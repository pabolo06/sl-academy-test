"""
SL Academy Platform - CDSS Routes (Clinical Decision Support System)
Phase 2: RAG-based clinical Q&A over hospital protocols (POPs).

Endpoints:
  POST /api/cdss/ask              — doctor asks a clinical question (sync)
  POST /api/cdss/embed/{lesson_id} — manager queues embedding for a lesson (async, 202)
  POST /api/cdss/embed-all        — manager queues bulk embedding (async, 202)
  GET  /api/cdss/tasks/{task_id}  — poll task status
"""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import JSONResponse
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


class TaskAccepted(BaseModel):
    task_id: str
    status: str = "PENDING"
    message: str = "Task queued for background processing."


class TaskStatusResponse(BaseModel):
    task_id: str
    status: str
    result: Optional[Dict[str, Any]] = None
    error: Optional[str] = None


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


@router.post(
    "/embed/{lesson_id}",
    response_model=TaskAccepted,
    status_code=status.HTTP_202_ACCEPTED,
)
async def embed_lesson(
    lesson_id: UUID,
    current_user: dict = Depends(require_role("manager")),
):
    """
    Queue embedding generation for a specific lesson (manager only).

    Returns 202 Accepted with a task_id for polling via GET /api/cdss/tasks/{task_id}.
    Idempotent — safe to call multiple times.
    """
    from tasks.ai_tasks import embed_single_lesson_task

    task = embed_single_lesson_task.delay(str(lesson_id))
    logger.info(
        f"Queued embed task {task.id} for lesson {lesson_id} "
        f"(manager: {current_user['user_id']})"
    )
    return TaskAccepted(task_id=task.id)


@router.post(
    "/embed-all",
    response_model=TaskAccepted,
    status_code=status.HTTP_202_ACCEPTED,
)
async def embed_all_lessons(
    current_user: dict = Depends(require_role("manager")),
):
    """
    Queue bulk embedding of all unembedded lessons for this hospital (manager only).

    Returns 202 Accepted with a task_id for polling via GET /api/cdss/tasks/{task_id}.
    The task runs in background with a 10-minute time limit.
    """
    # Check if CDSS is enabled before wasting a Celery slot
    if not cdss_service.is_enabled:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="CDSS not configured: OPENAI_API_KEY is not set.",
        )

    from tasks.ai_tasks import embed_all_lessons_task

    task = embed_all_lessons_task.delay(current_user["hospital_id"])
    logger.info(
        f"Queued bulk embed task {task.id} for hospital {current_user['hospital_id']} "
        f"(manager: {current_user['user_id']})"
    )
    return TaskAccepted(task_id=task.id)


@router.get("/tasks/{task_id}", response_model=TaskStatusResponse)
async def get_task_status(
    task_id: str,
    current_user: dict = Depends(get_current_user),
):
    """
    Poll the status of a background Celery task.

    Possible statuses:
    - PENDING: Task is waiting in the queue
    - PROCESSING: Task is actively running
    - SUCCESS: Task completed successfully (result in 'result' field)
    - FAILURE: Task failed (error message in 'error' field)
    - RETRY: Task is being retried
    """
    from celery.result import AsyncResult
    from core.celery_app import celery_app

    result = AsyncResult(task_id, app=celery_app)

    response = TaskStatusResponse(
        task_id=task_id,
        status=result.status,
    )

    if result.ready():
        if result.successful():
            response.result = result.result
        else:
            # Task failed — extract error message safely
            try:
                response.error = str(result.result)
            except Exception:
                response.error = "Unknown error occurred."

    elif result.status == "PROCESSING":
        # Custom state set by update_state() in the task
        response.result = result.info if isinstance(result.info, dict) else None

    return response
