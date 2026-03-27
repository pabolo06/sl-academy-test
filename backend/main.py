import os
import sys

# Path patch: garante que os módulos internos (core, api, models) sejam encontrados 
# mesmo quando o backend é executado a partir do root (como no Vercel)
backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from core.config import settings
from middleware.auth import SessionValidationMiddleware
from middleware.error_handler import (
    http_exception_handler,
    validation_exception_handler,
    general_exception_handler
)
import logging

# Configure logging
logging.basicConfig(
    level=getattr(logging, settings.log_level),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Create FastAPI application
app = FastAPI(
    title="SL Academy Platform API",
    description="B2B Hospital Education and Management Platform",
    version="1.0.0",
    debug=settings.debug
)

# Add session validation middleware
app.add_middleware(SessionValidationMiddleware)

# Configure CORS (Must be the outermost layer to handle CORS on 401/error responses)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "Cookie"],
    max_age=3600
)

# Register exception handlers
app.add_exception_handler(StarletteHTTPException, http_exception_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(Exception, general_exception_handler)


# Startup event
@app.on_event("startup")
async def startup():
    """Log startup completion"""
    logger.info(f"FastAPI application started. Environment: {settings.environment}, Debug: {settings.debug}")
    logger.info(f"CORS origins configured: {settings.cors_origins_list}")


# Security headers middleware - DISABLED FOR DEBUGGING
# @app.middleware("http")
# async def add_security_headers(request, call_next):
#     """Add security headers to all responses"""
#     response = await call_next(request)
#     response.headers["X-Content-Type-Options"] = "nosniff"
#     response.headers["X-Frame-Options"] = "DENY"
#     response.headers["X-XSS-Protection"] = "1; mode=block"
#     response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
#     response.headers["Content-Security-Policy"] = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'"
#     return response


# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    try:
        logger.info(f"Health check requested - Environment: {settings.environment}")
        return JSONResponse(
            content={
                "status": "healthy",
                "environment": settings.environment,
                "version": "1.0.0"
            }
        )
    except Exception as e:
        logger.error(f"Health check failed: {e}", exc_info=True)
        return JSONResponse(
            status_code=500,
            content={"status": "error", "message": str(e)}
        )


# Root endpoint
@app.get("/")
async def root():
    """Root endpoint"""
    return JSONResponse(
        content={
            "message": "SL Academy Platform API",
            "version": "1.0.0",
            "docs": "/docs"
        }
    )


# Import routers
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


if __name__ == "__main__":
    import uvicorn
    
    logger.info(f"Starting SL Academy API on {settings.api_host}:{settings.api_port}")
    logger.info(f"Environment: {settings.environment}")
    logger.info(f"Debug mode: {settings.debug}")
    
    uvicorn.run(
        "main:app",
        host=settings.api_host,
        port=settings.api_port,
        reload=settings.api_reload
    )
