import os
import sys

# Path patch
backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

import asyncio
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, RedirectResponse
from starlette.middleware.base import BaseHTTPMiddleware
from core.config import settings
from middleware.auth import SessionValidationMiddleware

logging.basicConfig(
    level=getattr(logging, settings.log_level),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)

# ── Upgrade root logger to JSON format (structured observability) ──────────
try:
    from pythonjsonlogger import jsonlogger

    _json_formatter = jsonlogger.JsonFormatter(
        fmt="%(asctime)s %(name)s %(levelname)s %(message)s",
        rename_fields={"asctime": "timestamp", "levelname": "level"},
    )
    # Replace formatter on existing handlers
    for handler in logging.root.handlers:
        handler.setFormatter(_json_formatter)

    logging.getLogger(__name__).debug("JSON structured logging enabled")
except ImportError:
    logging.getLogger(__name__).warning(
        "python-json-logger not installed — using plain-text logs. "
        "Run: pip install python-json-logger"
    )
logger = logging.getLogger(__name__)


# Ensure debug is always False in production regardless of env config
_debug_mode = settings.debug and settings.environment != "production"

# ── APScheduler: autonomous background job engine ─────────────────────────────

def _run_weekly_watcher():
    """
    Wrapper executed by APScheduler in a background thread.
    Calls the async ScraplingWatcher using asyncio.run().

    The watcher scans all tracks that have a search_term configured
    in all hospitals. This is a system-level sweep — individual
    hospital checks are still triggered via the /api/watcher route.
    """
    from services.scrapling_watcher import scrapling_watcher
    from core.database import Database

    try:
        db = Database.get_client()
        # Fetch all tracks with a title (used as search_term)
        tracks_resp = (
            db.table("tracks")
            .select("id, title, hospital_id")
            .is_("deleted_at", "null")
            .execute()
        )
        tracks = tracks_resp.data or []
        if not tracks:
            logger.info("APScheduler: no tracks to scan")
            return

        async def _scan_all():
            for track in tracks[:10]:  # cap at 10 to avoid rate-limit issues
                await scrapling_watcher.check_track_updates(
                    track_id=track["id"],
                    search_term=track["title"],
                    hospital_id=track["hospital_id"],
                )

        asyncio.run(_scan_all())
        logger.info(f"APScheduler: weekly watcher completed — scanned {min(len(tracks), 10)} tracks")
    except Exception as exc:
        logger.error(f"APScheduler: weekly watcher error — {exc}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """FastAPI lifespan: manages startup and shutdown of background services."""
    # ── Startup ────────────────────────────────────────────────────────────────
    logger.info(
        f"FastAPI application started. Environment: {settings.environment}, "
        f"Debug: {_debug_mode}"
    )

    scheduler = None
    try:
        from apscheduler.schedulers.background import BackgroundScheduler
        scheduler = BackgroundScheduler()
        scheduler.add_job(
            _run_weekly_watcher,
            trigger="interval",
            weeks=1,
            id="scrapling_watcher_weekly",
            name="Weekly Clinical Guideline Watcher",
            replace_existing=True,
        )
        scheduler.start()
        logger.info("APScheduler started — scrapling_watcher scheduled weekly")
    except ImportError:
        logger.warning(
            "APScheduler not installed — background watcher disabled. "
            "Run: pip install apscheduler"
        )
    except Exception as exc:
        logger.error(f"APScheduler init error: {exc}")

    yield  # ← app is running

    # ── Shutdown ───────────────────────────────────────────────────────────────
    if scheduler:
        scheduler.shutdown(wait=False)
        logger.info("APScheduler shut down")


# ── Middleware ─────────────────────────────────────────────────────────────────

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Adds standard security headers to every response."""
    async def dispatch(self, request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
        if settings.environment == "production":
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains; preload"
        return response


_HEALTHCHECK_PATHS = {"/health", "/ping"}

class HTTPSRedirectMiddleware(BaseHTTPMiddleware):
    """Force HTTPS in production. Redirects HTTP requests to HTTPS.
    Health check paths are excluded — Railway sends them with x-forwarded-proto: http
    and does not follow 301 redirects."""
    async def dispatch(self, request: Request, call_next):
        if (
            settings.environment == "production"
            and request.headers.get("x-forwarded-proto") == "http"
            and request.url.path not in _HEALTHCHECK_PATHS
        ):
            https_url = str(request.url).replace("http://", "https://", 1)
            return RedirectResponse(url=https_url, status_code=301)
        return await call_next(request)


# ── App creation ─────────────────────────────────────────────────────────────

app = FastAPI(
    title="SL Academy Platform API",
    version="1.0.0",
    debug=_debug_mode,
    lifespan=lifespan,
    docs_url=None if settings.environment == "production" else "/docs",
    redoc_url=None if settings.environment == "production" else "/redoc",
    openapi_url=None if settings.environment == "production" else "/openapi.json",
)

# Middleware stack (innermost first, outermost last)
app.add_middleware(SessionValidationMiddleware)
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(HTTPSRedirectMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "Cookie"],
    max_age=3600
)

# Health / ping endpoints (used by Railway health check and CI)
@app.get("/health")
async def health():
    return JSONResponse({"status": "ok"})

@app.get("/ping")
async def ping():
    return JSONResponse({"status": "ok"})

# Root endpoint
@app.get("/")
async def root():
    return JSONResponse({
        "message": "SL Academy Platform API",
        "version": "1.0.0"
    })

# Import routers — fail-fast: missing module must never silently produce a broken app
from api.routes import auth, tracks, lessons, questions, test_attempts, doubts, indicators, ai, upload, admin, youtube, schedule, monitoring, cdss, rostering, watcher, occupational

app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(tracks.router, prefix="/api/tracks", tags=["Tracks"])
app.include_router(lessons.router, prefix="/api/lessons", tags=["Lessons"])
app.include_router(questions.router, prefix="/api", tags=["Questions"])
app.include_router(test_attempts.router, prefix="/api/test-attempts", tags=["Test Attempts"])
app.include_router(doubts.router, prefix="/api/doubts", tags=["Doubts"])
app.include_router(indicators.router, prefix="/api/indicators", tags=["Indicators"])
app.include_router(ai.router, prefix="/api", tags=["AI"])
app.include_router(upload.router, prefix="/api/upload", tags=["Upload"])
app.include_router(admin.router, prefix="/api/admin", tags=["Admin"])
app.include_router(youtube.router, prefix="/api", tags=["YouTube"])
app.include_router(schedule.router, tags=["Schedule"])
app.include_router(monitoring.router)  # prefix="/api/monitoring" already set in router
app.include_router(cdss.router)        # prefix="/api/cdss" already set in router
app.include_router(rostering.router)   # prefix="/api/rostering" already set in router
app.include_router(watcher.router)     # prefix="/api/watcher" already set in router
app.include_router(occupational.router) # prefix="/api/occupational" already set in router

logger.info("All routers imported and registered successfully")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.api_host,
        port=settings.api_port,
        reload=settings.api_reload
    )
