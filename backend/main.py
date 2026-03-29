import os
import sys

# Path patch
backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, RedirectResponse
from starlette.middleware.base import BaseHTTPMiddleware
from core.config import settings
from middleware.auth import SessionValidationMiddleware
import logging

logging.basicConfig(
    level=getattr(logging, settings.log_level),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


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


# Ensure debug is always False in production regardless of env config
_debug_mode = settings.debug and settings.environment != "production"

# Create app
app = FastAPI(
    title="SL Academy Platform API",
    version="1.0.0",
    debug=_debug_mode,
    # Disable OpenAPI docs in production
    docs_url=None if settings.environment == "production" else "/docs",
    redoc_url=None if settings.environment == "production" else "/redoc",
    openapi_url=None if settings.environment == "production" else "/openapi.json",
)

# Middleware stack (innermost first, outermost last)
# Execution order on request: CORS → HTTPSRedirect → SecurityHeaders → SessionValidation → App
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

# Startup event
@app.on_event("startup")
async def startup():
    # Log the effective debug mode (never True in production regardless of DEBUG env var)
    logger.info(f"FastAPI application started. Environment: {settings.environment}, Debug: {_debug_mode}")

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
from api.routes import auth, tracks, lessons, questions, test_attempts, doubts, indicators, ai, upload, admin, youtube, schedule, monitoring

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

logger.info("All routers imported and registered successfully")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.api_host,
        port=settings.api_port,
        reload=settings.api_reload
    )
