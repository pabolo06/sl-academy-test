"""
SL Academy Platform - AI Celery Tasks
Background tasks for long-running AI operations (embeddings, bulk processing).

These tasks wrap the async CDSSService methods so they can be executed
by the Celery worker outside the FastAPI event loop.
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
