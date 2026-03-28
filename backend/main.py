import os
import sys

# Path patch
backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
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
        if settings.environment == "production":
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        return response


# Create app
app = FastAPI(
    title="SL Academy Platform API",
    version="1.0.0",
    debug=settings.debug
)

# Middleware stack (innermost first, outermost last)
# Execution order on request: CORS → SecurityHeaders → SessionValidation → App
app.add_middleware(SessionValidationMiddleware)
app.add_middleware(SecurityHeadersMiddleware)
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
    logger.info(f"App started - Env: {settings.environment}, Debug: {settings.debug}")

# Health endpoint
@app.get("/health")
async def health():
    return JSONResponse({"status": "ok"})

# Root endpoint
@app.get("/")
async def root():
    return JSONResponse({
        "message": "SL Academy Platform API",
        "version": "1.0.0"
    })

# Import routers - NOW RE-ENABLED
try:
    from api.routes import auth, tracks, lessons, questions, test_attempts, doubts, indicators, ai, upload, admin, youtube, schedule

    # Include routers
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

    logger.info("All routers imported and registered successfully")
except Exception as e:
    logger.error(f"Error importing routers: {e}", exc_info=True)
    # Don't fail - let app run with just basic endpoints

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.api_host,
        port=settings.api_port,
        reload=settings.api_reload
    )
