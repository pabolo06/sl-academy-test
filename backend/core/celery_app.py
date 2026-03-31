"""
SL Academy Platform - Celery Application
Async task queue for long-running AI operations (embeddings, bulk processing).

Usage:
    # Start the worker:
    celery -A core.celery_app worker --loglevel=info --pool=solo
"""

import os
import sys

# Ensure backend directory is in sys.path so tasks can import services/core
_backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if _backend_dir not in sys.path:
    sys.path.insert(0, _backend_dir)

from celery import Celery
from core.config import settings

celery_app = Celery(
    "sl_academy",
    broker=settings.celery_broker_url,
    backend=settings.celery_result_backend,
)

# ── Configuration ──────────────────────────────────────────────────────────────
celery_app.conf.update(
    # Serialization
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],

    # Timezone
    timezone="UTC",
    enable_utc=True,

    # Reliability: worker acknowledges task AFTER execution (not before)
    task_acks_late=True,
    worker_prefetch_multiplier=1,

    # Result expiry: 1 hour
    result_expires=3600,

    # Task routing
    task_default_queue="default",

    # Retry policy for broker connection
    broker_connection_retry_on_startup=True,
)

# ── Auto-discover tasks ───────────────────────────────────────────────────────
celery_app.autodiscover_tasks(["tasks"])
