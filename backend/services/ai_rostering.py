"""
SL Academy Platform - AI Rostering Service (Phase 3)
Intelligent shift management via OpenAI function calling.

Pattern (OpenCDSS / Hospital-Roster-Agent inspired):
  1. Doctor sends a natural-language message ("I want to swap my Friday shift with Dr. Ana")
  2. The AI decides which tool(s) to call (function calling loop)
  3. We execute each tool call against the database
  4. AI receives the results and generates a human-readable response
  5. If a swap is requested → creates a pending shift_swap_request (human approval required)

The AI can NEVER approve swaps — that is always a manager action (human-in-the-loop).

Graceful degradation: returns safe fallback messages when OPENAI_API_KEY is not set.
"""

from __future__ import annotations

import json
import logging
import time
from datetime import date
from typing import Any

from tenacity import (
    retry,
    stop_after_attempt,
    wait_exponential,
    retry_if_exception_type,
)

from core.config import settings
from core.database import Database
from utils.pii_scrubber import scrub_pii

logger = logging.getLogger(__name__)

# ── System prompt ──────────────────────────────────────────────────────────────

_ROSTERING_SYSTEM_PROMPT = """Você é o Assistente de Escalas do Hospital (AI Rostering).
Você ajuda médicos a consultar e gerir os seus plantões de forma conversacional.

Regras obrigatórias:
1. Você pode CONSULTAR escalas e CRIAR pedidos de troca — nunca aprova alterações diretamente.
2. Toda troca precisa de aprovação do Diretor (gestor) antes de ser efetivada.
3. Ao criar um pedido de troca, informe claramente: "Pedido criado e enviado para aprovação do gestor."
4. Sempre confirme os detalhes (data, turno, médico alvo) antes de criar um pedido.
5. Se não encontrar o médico ou o plantão, informe claramente em vez de inventar dados.
6. Seja direto, educado e profissional. Respostas curtas e claras."""

# ── OpenAI Tool definitions (JSON Schema) ─────────────────────────────────────

_TOOLS: list[dict] = [
    {
        "type": "function",
        "function": {
            "name": "get_doctor_schedule",
            "description": (
                "Fetch the list of scheduled shifts for a specific doctor "
                "between two dates. Returns slot_id, slot_date, shift (morning/afternoon/night), "
                "and schedule status."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "doctor_id": {
                        "type": "string",
                        "description": "UUID of the doctor whose schedule is being fetched.",
                    },
                    "start_date": {
                        "type": "string",
                        "description": "Start date in YYYY-MM-DD format.",
                    },
                    "end_date": {
                        "type": "string",
                        "description": "End date in YYYY-MM-DD format.",
                    },
                },
                "required": ["doctor_id", "start_date", "end_date"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_available_doctors",
            "description": (
                "List all active doctors in the hospital who are NOT already "
                "scheduled for a given date and shift. Useful to find candidates "
                "for a swap."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "slot_date": {
                        "type": "string",
                        "description": "Date in YYYY-MM-DD format.",
                    },
                    "shift": {
                        "type": "string",
                        "enum": ["morning", "afternoon", "night"],
                        "description": "Shift to check availability for.",
                    },
                },
                "required": ["slot_date", "shift"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "request_shift_swap",
            "description": (
                "Create a pending shift swap request. The requester (current doctor) "
                "gives up their slot to the target doctor. "
                "The request is sent for manager approval — it does NOT take effect immediately."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "slot_id": {
                        "type": "string",
                        "description": "UUID of the schedule_slot to be swapped.",
                    },
                    "target_doctor_id": {
                        "type": "string",
                        "description": "UUID of the doctor who will receive the slot.",
                    },
                    "reason": {
                        "type": "string",
                        "description": "Natural-language reason for the swap (optional).",
                    },
                },
                "required": ["slot_id", "target_doctor_id"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_swap_requests",
            "description": (
                "List the current doctor's shift swap requests, optionally filtered by status."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "status": {
                        "type": "string",
                        "enum": ["pending", "approved", "rejected", "all"],
                        "description": "Filter by swap status. Defaults to 'all'.",
                    },
                },
                "required": [],
            },
        },
    },
]


# ── Tool executor ──────────────────────────────────────────────────────────────

class RosteringTools:
    """Executes tool calls made by the LLM against the Supabase database."""

    def __init__(self, hospital_id: str, requester_id: str) -> None:
        self.hospital_id = hospital_id
        self.requester_id = requester_id
        self.db = Database.get_client()

    # ── Credential check (non-raising) ─────────────────────────────────────────

    def _check_credentials(self, doctor_id: str, track_id: str) -> tuple[bool, str]:
        """
        Validate that a doctor holds active certification for a track.

        Unlike schedule.py's _validate_doctor_credentials (which raises HTTPException),
        this returns (passed: bool, reason: str) so it can be used inside tool
        call executors without breaking the function calling loop.
        """
        try:
            track_resp = (
                self.db.table("tracks")
                .select("title, required_score")
                .eq("id", track_id)
                .is_("deleted_at", "null")
                .single()
                .execute()
            )
            if not track_resp.data:
                return True, ""  # track not found — no requirement enforced

            required_score = track_resp.data.get("required_score")
            if required_score is None:
                return True, ""  # no score requirement on this track

            track_title = track_resp.data["title"]

            lessons_resp = (
                self.db.table("lessons")
                .select("id, title")
                .eq("track_id", track_id)
                .is_("deleted_at", "null")
                .execute()
            )
            if not lessons_resp.data:
                return True, ""  # no lessons — cannot validate

            lesson_ids = [l["id"] for l in lessons_resp.data]

            attempts_resp = (
                self.db.table("test_attempts")
                .select("lesson_id, score")
                .eq("profile_id", doctor_id)
                .eq("type", "post")
                .in_("lesson_id", lesson_ids)
                .execute()
            )

            best_scores: dict[str, float] = {}
            for attempt in (attempts_resp.data or []):
                lid = attempt["lesson_id"]
                if lid not in best_scores or attempt["score"] > best_scores[lid]:
                    best_scores[lid] = float(attempt["score"])

            failed = [
                lid for lid in lesson_ids
                if best_scores.get(lid) is None or best_scores[lid] < float(required_score)
            ]

            if failed:
                return False, (
                    f"Médico não possui certificação mínima ({required_score}%) "
                    f"para a track '{track_title}'. "
                    f"{len(failed)}/{len(lesson_ids)} aulas pendentes."
                )

            return True, ""

        except Exception as exc:
            logger.warning(f"Credential check error: {exc}")
            return True, ""  # fail-open: do not block on transient errors

    def execute(self, tool_name: str, args: dict) -> Any:
        """Dispatch a tool call by name."""
        dispatch = {
            "get_doctor_schedule":   self._get_doctor_schedule,
            "get_available_doctors": self._get_available_doctors,
            "request_shift_swap":    self._request_shift_swap,
            "get_swap_requests":     self._get_swap_requests,
        }
        fn = dispatch.get(tool_name)
        if not fn:
            return {"error": f"Unknown tool: {tool_name}"}
        try:
            return fn(**args)
        except Exception as exc:
            logger.error(f"AI Rostering tool '{tool_name}' failed: {exc}")
            return {"error": str(exc)}

    def _get_doctor_schedule(
        self, doctor_id: str, start_date: str, end_date: str
    ) -> list[dict]:
        resp = (
            self.db.table("schedule_slots")
            .select("id, slot_date, shift, notes, schedules(week_start, status, hospital_id)")
            .eq("doctor_id", doctor_id)
            .gte("slot_date", start_date)
            .lte("slot_date", end_date)
            .order("slot_date")
            .execute()
        )
        # Hospital isolation — only return slots from this hospital
        return [
            {
                "slot_id":    s["id"],
                "slot_date":  s["slot_date"],
                "shift":      s["shift"],
                "notes":      s.get("notes"),
                "week_start": s["schedules"]["week_start"] if s.get("schedules") else None,
            }
            for s in (resp.data or [])
            if s.get("schedules", {}).get("hospital_id") == self.hospital_id
        ]

    def _get_available_doctors(self, slot_date: str, shift: str) -> list[dict]:
        # All active doctors in hospital
        all_doctors_resp = (
            self.db.table("profiles")
            .select("id, full_name, email")
            .eq("hospital_id", self.hospital_id)
            .eq("role", "doctor")
            .is_("deleted_at", "null")
            .execute()
        )
        all_doctors = {d["id"]: d for d in (all_doctors_resp.data or [])}

        # Doctors already scheduled for this slot_date + shift
        busy_resp = (
            self.db.table("schedule_slots")
            .select("doctor_id, schedules(hospital_id)")
            .eq("slot_date", slot_date)
            .eq("shift", shift)
            .execute()
        )
        busy_ids = {
            s["doctor_id"]
            for s in (busy_resp.data or [])
            if s.get("schedules", {}).get("hospital_id") == self.hospital_id
        }

        available = [
            {"doctor_id": d["id"], "full_name": d["full_name"], "email": d["email"]}
            for did, d in all_doctors.items()
            if did not in busy_ids
        ]

        # ── Credential filter ──────────────────────────────────────────────────
        # If any schedule for this date+shift has a required_track_id,
        # filter out doctors who are not certified for it.
        schedule_resp = (
            self.db.table("schedule_slots")
            .select("schedules(required_track_id)")
            .eq("slot_date", slot_date)
            .eq("shift", shift)
            .execute()
        )
        required_track_ids = {
            s["schedules"]["required_track_id"]
            for s in (schedule_resp.data or [])
            if s.get("schedules", {}).get("required_track_id")
        }

        if required_track_ids:
            track_id = next(iter(required_track_ids))  # use first requirement
            available = [
                doc for doc in available
                if self._check_credentials(doc["doctor_id"], track_id)[0]
            ]

        return available

    def _request_shift_swap(
        self, slot_id: str, target_doctor_id: str, reason: str = ""
    ) -> dict:
        # Verify the slot belongs to the requester and this hospital
        slot_resp = (
            self.db.table("schedule_slots")
            .select("id, doctor_id, schedules(hospital_id)")
            .eq("id", slot_id)
            .single()
            .execute()
        )
        if not slot_resp.data:
            return {"error": "Slot not found."}

        slot = slot_resp.data
        if slot["doctor_id"] != self.requester_id:
            return {"error": "You can only swap your own slots."}
        if slot.get("schedules", {}).get("hospital_id") != self.hospital_id:
            return {"error": "Slot does not belong to your hospital."}
        if target_doctor_id == self.requester_id:
            return {"error": "You cannot swap a slot with yourself."}

        # ── Credential check ───────────────────────────────────────────────────
        # If the schedule requires a track certification, the target doctor
        # must hold it — the AI cannot suggest/approve uncertified swaps.
        slot_full_resp = (
            self.db.table("schedule_slots")
            .select("schedules(id, required_track_id)")
            .eq("id", slot_id)
            .single()
            .execute()
        )
        if slot_full_resp.data:
            req_track = slot_full_resp.data.get("schedules", {}).get("required_track_id")
            if req_track:
                passed, cred_reason = self._check_credentials(target_doctor_id, req_track)
                if not passed:
                    return {"error": f"Troca bloqueada: {cred_reason}"}
        # ───────────────────────────────────────────────────────────────────────

        # Check no pending swap already exists for this slot
        existing_resp = (
            self.db.table("shift_swap_requests")
            .select("id")
            .eq("slot_id", slot_id)
            .eq("status", "pending")
            .execute()
        )
        if existing_resp.data:
            return {"error": "A pending swap request already exists for this slot."}

        insert_resp = (
            self.db.table("shift_swap_requests")
            .insert({
                "hospital_id":   self.hospital_id,
                "requester_id":  self.requester_id,
                "target_id":     target_doctor_id,
                "slot_id":       slot_id,
                "reason":        reason or None,
                "status":        "pending",
            })
            .execute()
        )

        if insert_resp.data:
            req = insert_resp.data[0]
            return {
                "swap_request_id": req["id"],
                "status":          "pending",
                "message":         "Swap request created. Awaiting manager approval.",
            }
        return {"error": "Failed to create swap request."}

    def _get_swap_requests(self, status: str = "all") -> list[dict]:
        query = (
            self.db.table("shift_swap_requests")
            .select("id, status, reason, created_at, target_id, slot_id")
            .eq("requester_id", self.requester_id)
        )
        if status != "all":
            query = query.eq("status", status)
        resp = query.order("created_at", desc=True).execute()
        return resp.data or []


# ── AI Rostering Service ───────────────────────────────────────────────────────

class AIRosteringService:
    """
    Orchestrates the OpenAI function calling loop for roster management.

    Single-session pattern: messages are passed in from the route layer
    (stateless backend — session history lives in the frontend or Redis).
    """

    def __init__(self) -> None:
        self._client = None

    @property
    def is_enabled(self) -> bool:
        return bool(settings.openai_api_key)

    def _get_client(self):
        if self._client is None:
            from openai import AsyncOpenAI
            self._client = AsyncOpenAI(api_key=settings.openai_api_key)
        return self._client

    async def chat(
        self,
        messages: list[dict],
        hospital_id: str,
        requester_id: str,
    ) -> dict:
        """
        Run a rostering chat turn with function calling.

        Args:
            messages:     Conversation history [{"role": "user"|"assistant", "content": str}]
            hospital_id:  Hospital for data isolation
            requester_id: Doctor making the request

        Returns:
            {"reply": str, "tool_calls_made": [str], "swap_created": bool}
        """
        if not self.is_enabled:
            return {
                "reply": (
                    "O Assistente de Escalas está temporariamente indisponível. "
                    "Para trocar plantões, contacte diretamente o seu gestor."
                ),
                "tool_calls_made": [],
                "swap_created": False,
            }

        client = self._get_client()
        tools = RosteringTools(hospital_id=hospital_id, requester_id=requester_id)

        # PII scrub: sanitise user messages before sending to the LLM
        sanitised_messages = [
            {**m, "content": scrub_pii(m["content"])} if m.get("role") == "user" else m
            for m in messages
        ]

        # Build full message list with system prompt
        full_messages = [
            {"role": "system", "content": _ROSTERING_SYSTEM_PROMPT},
            *sanitised_messages,
        ]

        tool_calls_made: list[str] = []
        swap_created = False
        t0 = time.time()

        _FALLBACK_MSG = (
            "Assistente indisponível no momento. "
            "Por favor tente novamente em alguns minutos ou contacte o seu gestor."
        )

        # ── Function calling loop (max 5 iterations to prevent runaway) ────────
        for _iteration in range(5):
            try:
                response = await self._call_openai(
                    client, full_messages, _TOOLS
                )
            except Exception as exc:
                logger.error(
                    "AI Rostering OpenAI call failed after retries",
                    extra={"hospital_id": hospital_id, "error": str(exc)},
                )
                return {
                    "reply": _FALLBACK_MSG,
                    "tool_calls_made": tool_calls_made,
                    "swap_created": False,
                }

            message = response.choices[0].message

            # Log token usage for observability
            usage = getattr(response, "usage", None)
            if usage:
                logger.info(
                    "AI Rostering OpenAI call",
                    extra={
                        "hospital_id": hospital_id,
                        "prompt_tokens": usage.prompt_tokens,
                        "completion_tokens": usage.completion_tokens,
                        "total_tokens": usage.total_tokens,
                        "elapsed_ms": round((time.time() - t0) * 1000),
                    },
                )

            # No tool calls → final answer
            if not message.tool_calls:
                return {
                    "reply": message.content or "",
                    "tool_calls_made": tool_calls_made,
                    "swap_created": swap_created,
                }

            # Append assistant message with tool_calls to history
            full_messages.append(message.model_dump(exclude_unset=True))

            # Execute each tool call
            for tc in message.tool_calls:
                fn_name = tc.function.name
                fn_args = json.loads(tc.function.arguments)

                logger.info(f"AI Rostering: calling tool '{fn_name}' args={fn_args}")
                tool_calls_made.append(fn_name)

                result = tools.execute(fn_name, fn_args)

                if fn_name == "request_shift_swap" and isinstance(result, dict):
                    if result.get("status") == "pending":
                        swap_created = True

                # Append tool result to history
                full_messages.append({
                    "role":         "tool",
                    "tool_call_id": tc.id,
                    "content":      json.dumps(result, default=str),
                })

        # Safety: if loop exhausted without final answer
        logger.warning("AI Rostering: function calling loop exhausted without final answer")
        return {
            "reply": "Não consegui completar a operação. Por favor tente novamente.",
            "tool_calls_made": tool_calls_made,
            "swap_created": swap_created,
        }

    # ── Tenacity-wrapped OpenAI call ───────────────────────────────────────────

    @staticmethod
    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=1, max=10),
        retry=retry_if_exception_type(Exception),
        reraise=True,
    )
    async def _call_openai(client, messages, tools):
        """Single OpenAI chat completion call with exponential-backoff retry."""
        return await client.chat.completions.create(
            model=settings.ai_model,
            messages=messages,
            tools=tools,
            tool_choice="auto",
            temperature=0.2,
            max_tokens=800,
        )


# ── Module-level singleton ─────────────────────────────────────────────────────
ai_rostering_service = AIRosteringService()
