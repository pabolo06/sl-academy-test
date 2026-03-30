"""
SL Academy Platform - CDSS Routes (Clinical Decision Support System)
Phase 2: RAG-based clinical Q&A over hospital protocols (POPs).

Endpoints:
  POST /api/cdss/ask              — doctor asks a clinical question
  POST /api/cdss/embed/{lesson_id} — manager embeds a specific lesson
  POST /api/cdss/embed-all        — manager embeds all unembedded lessons
"""

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from typing import Any, Dict, List, Optional
from uuid import UUID

from utils.session import get_current_user
from middleware.auth import require_role
from services.cdss_service import cdss_service
from utils.rate_limiter import rate_limiter
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/cdss", tags=["cdss"])


# ── Request / Response models ──────────────────────────────────────────────────

class ClinicalQuestion(BaseModel):
    question: str = Field(
        ...,
        min_length=10,
        max_length=1000,
        description="Clinical question about dosage, protocol, or guideline.",
    )
    top_k: int = Field(
        default=5,
        ge=1,
        le=10,
        description="Maximum number of protocol sources to retrieve.",
    )
    chat_history: List[Dict[str, Any]] = Field(
        default=[],
        description="Prior conversation turns [{role, content}] for multi-turn context.",
    )


class Citation(BaseModel):
    lesson_id: UUID
    title: str
    track_title: str
    similarity: float


class CDSSResponse(BaseModel):
    answer: str
    citations: List[Citation]
    confidence: str = Field(
        description="'high' (≥0.80), 'medium' (≥0.65), 'low' (≥0.50), "
                    "'no_context', 'unavailable', or 'error'."
    )
    sources_found: int


class EmbedResult(BaseModel):
    lesson_id: Optional[str] = None
    status: str
    message: Optional[str] = None


# ── Routes ─────────────────────────────────────────────────────────────────────

@router.post("/ask", response_model=CDSSResponse)
async def ask_clinical_question(
    body: ClinicalQuestion,
    current_user: dict = Depends(get_current_user),
):
    """
    Ask a clinical question and receive a RAG-grounded answer citing internal protocols.

    The CDSS:
    1. Embeds the question using text-embedding-3-small
    2. Retrieves the most semantically similar lessons/POPs from this hospital
    3. Generates a grounded answer citing each source by name

    Rate limited to 10 questions per minute per user.
    Returns safe fallback if OpenAI is not configured.
    """
    # Rate limit: 10 CDSS questions per minute per user (OpenAI costs money)
    is_allowed, retry_after = await rate_limiter.check_rate_limit(
        identifier=f"cdss:{current_user['user_id']}",
        max_requests=10,
        window_seconds=60,
    )
    if not is_allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many clinical questions. Please wait before asking again.",
            headers={"Retry-After": str(retry_after)},
        )

    result = await cdss_service.ask(
        question=body.question,
        hospital_id=current_user["hospital_id"],
        top_k=body.top_k,
        chat_history=body.chat_history or None,
    )

    return CDSSResponse(**result)


@router.post("/embed/{lesson_id}", response_model=EmbedResult)
async def embed_lesson(
    lesson_id: UUID,
    current_user: dict = Depends(require_role("manager")),
):
    """
    Generate and store the vector embedding for a specific lesson (manager only).

    Idempotent — safe to call multiple times.
    Requires OPENAI_API_KEY to be configured.
    """
    result = await cdss_service.embed_lesson(str(lesson_id))

    if result["status"] == "error":
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=result.get("message", "Failed to embed lesson."),
        )

    return EmbedResult(**result)


@router.post("/embed-all")
async def embed_all_lessons(
    current_user: dict = Depends(require_role("manager")),
):
    """
    Embed all lessons in this hospital that don't yet have a vector (manager only).

    Runs synchronously — for large hospitals consider running this off-peak.
    Returns a summary: {"embedded": N, "errors": N}
    """
    result = await cdss_service.embed_all_lessons(
        hospital_id=current_user["hospital_id"]
    )

    if result.get("status") == "disabled":
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=result.get("message", "CDSS not configured."),
        )

    logger.info(
        f"Bulk embed completed for hospital {current_user['hospital_id']}: {result}"
    )
    return result
