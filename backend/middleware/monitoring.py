"""
Monitoring middleware for FastAPI.
Tracks request metrics, performance, and errors.
"""

import time
import logging
from typing import Callable
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp

from core.monitoring import metrics, add_breadcrumb, capture_exception

logger = logging.getLogger(__name__)


class MonitoringMiddleware(BaseHTTPMiddleware):
    """Middleware to monitor requests and track metrics."""
    
    def __init__(self, app: ASGIApp):
        super().__init__(app)
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Start timing
        start_time = time.time()
        
        # Extract request info
        method = request.method
        path = request.url.path
        client_ip = request.client.host if request.client else "unknown"
        
        # Add breadcrumb for debugging
        add_breadcrumb(
            message=f"{method} {path}",
            category="http",
            level="info",
            data={
                "method": method,
                "url": str(request.url),
                "client_ip": client_ip,
            }
        )
        
        # Track request
        metrics.increment("http.requests.total", tags={"method": method, "path": path})
        
        try:
            # Process request
            response = await call_next(request)
            
            # Calculate duration
            duration_ms = (time.time() - start_time) * 1000
            
            # Track response metrics
            metrics.increment(
                "http.responses.total",
                tags={
                    "method": method,
                    "path": path,
                    "status": response.status_code,
                }
            )
            
            metrics.timing(
                "http.request.duration",
                duration_ms,
                tags={"method": method, "path": path}
            )
            
            # Log slow requests (> 1000ms)
            if duration_ms > 1000:
                logger.warning(
                    f"Slow request: {method} {path} took {duration_ms:.2f}ms "
                    f"(status: {response.status_code})"
                )
                metrics.increment("http.requests.slow", tags={"method": method, "path": path})
            
            # Track error responses
            if response.status_code >= 400:
                metrics.increment(
                    "http.errors.total",
                    tags={
                        "method": method,
                        "path": path,
                        "status": response.status_code,
                    }
                )
                
                # Log client errors (4xx)
                if 400 <= response.status_code < 500:
                    logger.info(
                        f"Client error: {method} {path} returned {response.status_code} "
                        f"in {duration_ms:.2f}ms"
                    )
                
                # Log server errors (5xx)
                if response.status_code >= 500:
                    logger.error(
                        f"Server error: {method} {path} returned {response.status_code} "
                        f"in {duration_ms:.2f}ms"
                    )
            
            # Add custom headers for monitoring
            response.headers["X-Response-Time"] = f"{duration_ms:.2f}ms"
            
            return response
        
        except Exception as e:
            # Calculate duration
            duration_ms = (time.time() - start_time) * 1000
            
            # Track exception
            metrics.increment("http.exceptions.total", tags={"method": method, "path": path})
            
            # Log exception
            logger.error(
                f"Exception in {method} {path} after {duration_ms:.2f}ms: {e}",
                exc_info=True
            )
            
            # Capture in Sentry
            capture_exception(
                e,
                context={
                    "request": {
                        "method": method,
                        "url": str(request.url),
                        "client_ip": client_ip,
                        "duration_ms": duration_ms,
                    }
                }
            )
            
            # Re-raise to let error handler deal with it
            raise


class HealthCheckMiddleware(BaseHTTPMiddleware):
    """Middleware to handle health check requests efficiently."""
    
    def __init__(self, app: ASGIApp, health_path: str = "/health"):
        super().__init__(app)
        self.health_path = health_path
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Fast path for health checks
        if request.url.path == self.health_path:
            return Response(
                content='{"status":"healthy"}',
                status_code=200,
                media_type="application/json"
            )
        
        return await call_next(request)


def track_api_call(endpoint: str, user_id: str = None, hospital_id: str = None):
    """
    Track an API call for analytics.
    
    Args:
        endpoint: API endpoint name
        user_id: User ID (optional)
        hospital_id: Hospital ID (optional)
    """
    tags = {"endpoint": endpoint}
    if hospital_id:
        tags["hospital_id"] = hospital_id
    
    metrics.increment("api.calls.total", tags=tags)
    
    add_breadcrumb(
        message=f"API call: {endpoint}",
        category="api",
        level="info",
        data={"user_id": user_id, "hospital_id": hospital_id}
    )
