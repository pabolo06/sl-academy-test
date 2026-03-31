"""
SL Academy Platform - AI Celery Tasks
Background tasks for long-running AI operations (embeddings, bulk processing,
clinical Q&A, and AI rostering chat).

These tasks wrap async service methods so they can be executed by the Celery
worker outside the FastAPI event loop.
"""

import asyncio
import logging

from celery import states
from core.celery_app import celery_app

logger = logging.getLogger(__name__)


def _run_async(coro):
    """Run an async coroutine in a new event loop (for Celery workers)."""
    loop = asyncio.new_event_loop()
    try:
        return loop.run_until_complete(coro)
    finally:
        loop.close()


@celery_app.task(
    bind=True,
    name="tasks.embed_single_lesson",
    max_retries=3,
    default_retry_delay=60,
    acks_late=True,
)
def embed_single_lesson_task(self, lesson_id: str) -> dict:
    """
    Generate and persist the vector embedding for a single lesson.

    Args:
        lesson_id: UUID string of the lesson to embed.

    Returns:
        dict with {"lesson_id": str, "status": "embedded"|"error", ...}
    """
    try:
        logger.info(f"Celery task: embedding lesson {lesson_id}")
        from services.cdss_service import cdss_service

        result = _run_async(cdss_service.embed_lesson(lesson_id))
        logger.info(f"Celery task: lesson {lesson_id} → {result['status']}")
        return result

    except Exception as exc:
        logger.error(f"Celery task embed_single_lesson failed: {exc}")
        # Retry with exponential backoff
        raise self.retry(exc=exc)


@celery_app.task(
    bind=True,
    name="tasks.embed_all_lessons",
    max_retries=2,
    default_retry_delay=120,
    acks_late=True,
    time_limit=600,       # hard kill after 10 minutes
    soft_time_limit=540,  # soft warning at 9 minutes
)
def embed_all_lessons_task(self, hospital_id: str) -> dict:
    """
    Embed all unembedded lessons for a hospital.

    This is a potentially long-running task — it iterates over all lessons
    and calls OpenAI for each. Time-limited to 10 minutes.

    Args:
        hospital_id: UUID string of the hospital.

    Returns:
        dict with {"status": "ok", "embedded": int, "errors": int}
    """
    try:
        logger.info(f"Celery task: bulk embed for hospital {hospital_id}")

        # Update task state to show progress
        self.update_state(
            state="PROCESSING",
            meta={"hospital_id": hospital_id, "message": "Embedding lessons..."},
        )

        from services.cdss_service import cdss_service

        result = _run_async(cdss_service.embed_all_lessons(hospital_id))
        logger.info(
            f"Celery task: bulk embed completed for hospital {hospital_id} — "
            f"{result.get('embedded', 0)} embedded, {result.get('errors', 0)} errors"
        )
        return result

    except Exception as exc:
        logger.error(f"Celery task embed_all_lessons failed: {exc}")
        raise self.retry(exc=exc)


@celery_app.task(
    bind=True,
    name="tasks.cdss_ask",
    max_retries=2,
    default_retry_delay=30,
    acks_late=True,
    time_limit=120,
    soft_time_limit=100,
)
def cdss_ask_task(
    self,
    question: str,
    hospital_id: str,
    top_k: int = 5,
    chat_history: list | None = None,
) -> dict:
    """
    Process a CDSS clinical question in the background (embed + RAG + generate).

    Args:
        question:     Clinical question string (already rate-limited at API layer).
        hospital_id:  Hospital UUID for data isolation.
        top_k:        Number of protocol sources to retrieve (default 5).
        chat_history: Optional prior conversation turns for multi-turn context.

    Returns:
        {"answer": str, "citations": [...], "confidence": str, "sources_found": int}
    """
    try:
        logger.info(f"Celery task: CDSS ask for hospital {hospital_id}")
        self.update_state(
            state="PROCESSING",
            meta={"hospital_id": hospital_id, "message": "Processing clinical question…"},
        )

        from services.cdss_service import cdss_service

        result = _run_async(
            cdss_service.ask(
                question=question,
                hospital_id=hospital_id,
                top_k=top_k,
                chat_history=chat_history,
            )
        )
        logger.info(
            f"Celery task: CDSS ask completed for hospital {hospital_id} — "
            f"confidence={result.get('confidence')} sources={result.get('sources_found')}"
        )
        return result

    except Exception as exc:
        logger.error(f"Celery task cdss_ask failed: {exc}")
        raise self.retry(exc=exc)


@celery_app.task(
    bind=True,
    name="tasks.rostering_chat",
    max_retries=2,
    default_retry_delay=30,
    acks_late=True,
    time_limit=120,
    soft_time_limit=100,
)
def rostering_chat_task(
    self,
    messages: list,
    hospital_id: str,
    requester_id: str,
) -> dict:
    """
    Run one AI rostering chat turn (function-calling loop) in the background.

    Args:
        messages:     Conversation history [{"role": ..., "content": ...}].
        hospital_id:  Hospital UUID for data isolation.
        requester_id: Doctor UUID making the request.

    Returns:
        {"reply": str, "tool_calls_made": [...], "swap_created": bool}
    """
    try:
        logger.info(
            f"Celery task: rostering chat for hospital {hospital_id} "
            f"requester={requester_id}"
        )
        self.update_state(
            state="PROCESSING",
            meta={"hospital_id": hospital_id, "message": "Processing rostering request…"},
        )

        from services.ai_rostering import ai_rostering_service

        result = _run_async(
            ai_rostering_service.chat(
                messages=messages,
                hospital_id=hospital_id,
                requester_id=requester_id,
            )
        )
        logger.info(
            f"Celery task: rostering chat completed — "
            f"tools={result.get('tool_calls_made')} swap={result.get('swap_created')}"
        )
        return result

    except Exception as exc:
        logger.error(f"Celery task rostering_chat failed: {exc}")
        raise self.retry(exc=exc)
