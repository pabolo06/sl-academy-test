"""
SL Academy Platform - CDSS Service (Clinical Decision Support System)
Phase 2: RAG-based clinical question answering over hospital protocols (POPs).

Inspired by OpenCDSS (Stanford) pattern:
  1. Doctor asks a clinical question (e.g. dosage, protocol, guideline)
  2. System generates a query embedding via OpenAI text-embedding-3-small
  3. pgvector cosine search finds the most relevant internal lessons/POPs
  4. LLM receives the question + retrieved context and answers citing the source

Graceful degradation: all methods return safe fallbacks when OPENAI_API_KEY
is not configured, so the app starts without errors.
"""

from __future__ import annotations

import logging
import time
from typing import Optional

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


# ── In-memory TTL cache ─────────────────────────────────────────────────────────

_CACHE_TTL_SECONDS = 3600  # 1 hour
_answer_cache: dict[str, tuple[float, dict]] = {}  # key → (expiry_ts, result)


def _cache_get(key: str) -> dict | None:
    """Return cached result if it exists and hasn't expired."""
    entry = _answer_cache.get(key)
    if entry is None:
        return None
    expiry, result = entry
    if time.time() > expiry:
        del _answer_cache[key]
        return None
    return result


def _cache_set(key: str, result: dict) -> None:
    """Store a result in cache with TTL."""
    _answer_cache[key] = (time.time() + _CACHE_TTL_SECONDS, result)

# CDSS system prompt — clinical accuracy over creativity
_SYSTEM_PROMPT = """Você é um Sistema de Suporte à Decisão Clínica (CDSS) do hospital.

Regras obrigatórias:
1. Responda SOMENTE com base nos protocolos internos fornecidos abaixo.
2. Cite SEMPRE a fonte (nome da aula/POP) entre colchetes: [Fonte: Título da Aula].
3. Se a informação não estiver nos protocolos, diga claramente: "Este tópico não está coberto pelos protocolos internos disponíveis."
4. Nunca invente dados clínicos, dosagens ou procedimentos.
5. Seja objetivo, seguro e direto. Respostas longas apenas quando necessário.
6. Em caso de emergência, sempre oriente a acionar o protocolo de emergência do hospital."""


class CDSSService:
    """
    Clinical Decision Support System via RAG (Retrieval-Augmented Generation).

    Lifecycle:
    - Instantiated once at module load (lazy OpenAI client init)
    - `is_enabled` → False when OPENAI_API_KEY is empty (safe no-op mode)
    - `embed_lesson()` → called by managers to vectorize lesson content
    - `ask()` → called by doctors to get protocol-grounded clinical answers
    """

    def __init__(self) -> None:
        self._openai_client = None  # lazy init — avoids import errors at startup

    # ── Public API ─────────────────────────────────────────────────────────────

    @property
    def is_enabled(self) -> bool:
        """True only when OpenAI key is present. Gate for all live operations."""
        return bool(settings.openai_api_key)

    async def embed_lesson(self, lesson_id: str) -> dict:
        """
        Generate and persist the vector embedding for a lesson.

        Content = lesson title + description (the "document" stored in pgvector).
        Idempotent — safe to call multiple times (overwrites previous embedding).

        Returns: {"lesson_id": str, "status": "embedded" | "disabled" | "error"}
        """
        if not self.is_enabled:
            return {"lesson_id": lesson_id, "status": "disabled",
                    "message": "CDSS not configured: OPENAI_API_KEY is not set."}

        db = Database.get_client()

        lesson_resp = db.table("lessons").select(
            "id, title, description"
        ).eq("id", lesson_id).is_("deleted_at", "null").single().execute()

        if not lesson_resp.data:
            return {"lesson_id": lesson_id, "status": "error",
                    "message": "Lesson not found."}

        lesson = lesson_resp.data
        content = f"{lesson['title']}\n\n{lesson.get('description') or ''}"

        try:
            embedding = await self._embed_text(content)
            db.table("lessons").update(
                {"embedding": embedding}
            ).eq("id", lesson_id).execute()

            logger.info(f"CDSS: embedded lesson {lesson_id} ({lesson['title']})")
            return {"lesson_id": lesson_id, "status": "embedded"}

        except Exception as exc:
            logger.error(f"CDSS: failed to embed lesson {lesson_id}: {exc}")
            return {"lesson_id": lesson_id, "status": "error", "message": str(exc)}

    async def embed_all_lessons(self, hospital_id: str) -> dict:
        """
        Embed all non-deleted lessons for a hospital that don't yet have embeddings.
        Returns a summary of results.
        """
        if not self.is_enabled:
            return {"status": "disabled", "message": "OPENAI_API_KEY is not set."}

        db = Database.get_client()
        lessons_resp = db.table("lessons").select(
            "id, track_id, tracks!inner(hospital_id)"
        ).is_("deleted_at", "null").is_("embedding", "null").execute()

        if not lessons_resp.data:
            return {"status": "ok", "embedded": 0, "message": "No lessons need embedding."}

        # Filter by hospital
        lesson_ids = [
            l["id"] for l in lessons_resp.data
            if l.get("tracks", {}).get("hospital_id") == hospital_id
        ]

        results = {"embedded": 0, "errors": 0}
        for lid in lesson_ids:
            result = await self.embed_lesson(lid)
            if result["status"] == "embedded":
                results["embedded"] += 1
            else:
                results["errors"] += 1

        logger.info(
            f"CDSS: bulk embed for hospital {hospital_id} — "
            f"{results['embedded']} embedded, {results['errors']} errors"
        )
        return {"status": "ok", **results}

    async def ask(
        self,
        question: str,
        hospital_id: str,
        top_k: int = 5,
        match_threshold: float = 0.5,
        chat_history: list[dict] | None = None,
    ) -> dict:
        """
        Core RAG endpoint: answer a clinical question using internal protocols.

        Flow:
          1. Embed the question
          2. Retrieve top-k similar lessons via pgvector (match_lessons RPC)
          3. Build a grounded prompt with retrieved context
          4. Return LLM answer + citations

        Returns:
          {
            "answer": str,
            "citations": [{"lesson_id", "title", "track_title", "similarity"}],
            "confidence": "high" | "medium" | "low" | "no_context",
            "sources_found": int
          }
        """
        if not self.is_enabled:
            return {
                "answer": (
                    "O Sistema de Suporte à Decisão Clínica está temporariamente indisponível. "
                    "Consulte o manual de protocolos ou a equipa médica responsável."
                ),
                "citations": [],
                "confidence": "unavailable",
                "sources_found": 0,
            }

        try:
            # 0. PII scrub: sanitise the question before it reaches the LLM
            safe_question = scrub_pii(question)

            # 0b. Cache check — use lowercase key for case-insensitive matching
            cache_key = f"{hospital_id}:{safe_question.lower().strip()}"
            cached = _cache_get(cache_key)
            if cached is not None:
                logger.info(
                    "CDSS cache hit",
                    extra={"hospital_id": hospital_id, "cache": "hit"},
                )
                return cached

            t0 = time.time()

            # 1. Embed the (sanitised) question
            query_embedding = await self._embed_text(safe_question)

            # 2. Semantic search via pgvector RPC
            db = Database.get_client()
            search_resp = db.rpc("match_lessons", {
                "query_embedding": query_embedding,
                "hospital_id_param": hospital_id,
                "match_threshold": match_threshold,
                "match_count": top_k,
            }).execute()

            context_lessons = search_resp.data or []

            # 3. Generate grounded answer (with optional conversation history)
            answer = await self._generate_answer(
                safe_question, context_lessons, chat_history=chat_history
            )

            # 4. Build citations
            citations = [
                {
                    "lesson_id": l["id"],
                    "title": l["title"],
                    "track_title": l.get("track_title", ""),
                    "similarity": round(float(l.get("similarity", 0)), 3),
                }
                for l in context_lessons
            ]

            # Confidence based on top similarity score
            top_similarity = float(context_lessons[0]["similarity"]) if context_lessons else 0
            confidence = (
                "high"       if top_similarity >= 0.80 else
                "medium"     if top_similarity >= 0.65 else
                "low"        if top_similarity >= 0.50 else
                "no_context"
            )

            logger.info(
                "CDSS answered",
                extra={
                    "hospital_id": hospital_id,
                    "sources": len(citations),
                    "confidence": confidence,
                    "elapsed_ms": round((time.time() - t0) * 1000),
                },
            )

            result = {
                "answer": answer,
                "citations": citations,
                "confidence": confidence,
                "sources_found": len(citations),
            }

            # Store in cache for future identical questions
            _cache_set(cache_key, result)

            return result

        except Exception as exc:
            logger.error(f"CDSS: error answering question: {exc}")
            return {
                "answer": (
                    "Ocorreu um erro ao consultar os protocolos internos. "
                    "Por favor tente novamente ou consulte a equipa médica."
                ),
                "citations": [],
                "confidence": "error",
                "sources_found": 0,
            }

    # ── Private helpers ────────────────────────────────────────────────────────

    def _get_client(self):
        """Lazy-init OpenAI async client."""
        if self._openai_client is None:
            from openai import AsyncOpenAI  # imported here to avoid startup errors
            self._openai_client = AsyncOpenAI(api_key=settings.openai_api_key)
        return self._openai_client

    # ── Tenacity-wrapped OpenAI calls ──────────────────────────────────────

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=1, max=10),
        retry=retry_if_exception_type(Exception),
        reraise=True,
    )
    async def _embed_text(self, text: str) -> list[float]:
        """Call OpenAI text-embedding-3-small and return the vector (with retry)."""
        client = self._get_client()
        response = await client.embeddings.create(
            input=text[:8000],  # token limit safety guard
            model="text-embedding-3-small",
        )
        return response.data[0].embedding

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=1, max=10),
        retry=retry_if_exception_type(Exception),
        reraise=True,
    )
    async def _generate_answer(
        self,
        question: str,
        context_lessons: list[dict],
        chat_history: list[dict] | None = None,
    ) -> str:
        """Generate a protocol-grounded answer using retrieved lesson context.

        If *chat_history* is provided, prior turns are injected between the
        system prompt and the current question so the LLM maintains clinical
        context across a multi-turn conversation.
        """
        client = self._get_client()

        if not context_lessons:
            context_block = "Nenhum protocolo interno relevante foi encontrado para esta consulta."
        else:
            context_block = "\n\n".join(
                f"[Fonte: {l['title']} — {l.get('track_title', '')}]\n"
                f"{l.get('description') or 'Sem descrição disponível.'}"
                for l in context_lessons
            )

        # Build message list: system → (optional history) → current question
        messages: list[dict] = [{"role": "system", "content": _SYSTEM_PROMPT}]

        # Inject prior conversation turns (PII already scrubbed at ask() level)
        if chat_history:
            for turn in chat_history:
                role = turn.get("role", "user")
                content = turn.get("content", "")
                if role in ("user", "assistant") and content:
                    messages.append({"role": role, "content": scrub_pii(content)})

        messages.append({
            "role": "user",
            "content": (
                f"Pergunta clínica: {question}\n\n"
                f"Protocolos internos disponíveis:\n{context_block}"
            ),
        })

        response = await client.chat.completions.create(
            model=settings.ai_model,
            temperature=0.1,       # clinical accuracy requires low temperature
            max_tokens=1000,
            messages=messages,
        )

        return response.choices[0].message.content


# ── Module-level singleton ─────────────────────────────────────────────────────
cdss_service = CDSSService()
