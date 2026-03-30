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
from datetime import date
from typing import Any

from core.config import settings
from core.database import Database

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

        return [
            {"doctor_id": d["id"], "full_name": d["full_name"], "email": d["email"]}
            for did, d in all_doctors.items()
            if did not in busy_ids
        ]

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

        # Build full message list with system prompt
        full_messages = [
            {"role": "system", "content": _ROSTERING_SYSTEM_PROMPT},
            *messages,
        ]

        tool_calls_made: list[str] = []
        swap_created = False

        # ── Function calling loop (max 5 iterations to prevent runaway) ────────
        for _iteration in range(5):
            response = await client.chat.completions.create(
                model=settings.ai_model,
                messages=full_messages,
                tools=_TOOLS,
                tool_choice="auto",
                temperature=0.2,
                max_tokens=800,
            )

            message = response.choices[0].message

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


# ── Module-level singleton ─────────────────────────────────────────────────────
ai_rostering_service = AIRosteringService()
