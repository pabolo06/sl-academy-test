"""
SL Academy Platform - Authentication Middleware
Validates sessions on protected routes and handles automatic refresh
"""

from fastapi import Request, Response, HTTPException, status
from starlette.middleware.base import BaseHTTPMiddleware
from utils.session import session_manager
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)


class SessionValidationMiddleware(BaseHTTPMiddleware):
    """
    Middleware to validate session on protected routes
    Automatically refreshes session on activity
    """
    
    # Routes that don't require authentication
    PUBLIC_ROUTES = [
        "/",
        "/health",
        "/docs",
        "/openapi.json",
        "/api/auth/login",
        "/api/auth/login/medico",   # NEW
        "/api/auth/login/gestor",   # NEW
    ]
    
    # Routes that start with these prefixes are public
    PUBLIC_PREFIXES = [
        "/docs",
        "/redoc",
        "/openapi",
        "/api/youtube",  # YouTube metadata endpoints (public)
    ]
    
    async def dispatch(self, request: Request, call_next):
        """Process request and validate session if needed"""

        # Pass OPTIONS (CORS preflight) without auth check
        if request.method == "OPTIONS":
            return await call_next(request)

        # Check if route is public
        if self._is_public_route(request.url.path):
            return await call_next(request)
        
        # Validate session for protected routes
        session = session_manager.get_session(request)
        
        if not session:
            logger.warning(f"Unauthorized access attempt to {request.url.path}")
            return Response(
                content='{"detail":"Not authenticated"}',
                status_code=status.HTTP_401_UNAUTHORIZED,
                media_type="application/json"
            )
        
        # Check if session needs refresh (activity within last 5 minutes)
        last_activity = datetime.fromisoformat(session["last_activity"])
        if datetime.utcnow() - last_activity > timedelta(minutes=5):
            # Session will be refreshed in response
            request.state.refresh_session = True
        
        # Process request
        response = await call_next(request)
        
        # Refresh session if needed
        if hasattr(request.state, "refresh_session") and request.state.refresh_session:
            session_manager.refresh_session(request, response)
        
        return response
    
    def _is_public_route(self, path: str) -> bool:
        """Check if route is public"""
        # Exact match
        if path in self.PUBLIC_ROUTES:
            return True
        
        # Prefix match
        for prefix in self.PUBLIC_PREFIXES:
            if path.startswith(prefix):
                return True
        
        return False


def require_role(*allowed_roles: str):
    """
    Dependency to require specific role(s) for endpoint access
    
    Usage:
        @router.get("/admin", dependencies=[Depends(require_role("manager"))])
    """
    def role_checker(request: Request):
        session = session_manager.get_session(request)
        
        if not session:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Not authenticated"
            )
        
        user_role = session.get("role")
        
        if user_role not in allowed_roles:
            logger.warning(
                f"Forbidden access attempt: user {session['email']} "
                f"(role: {user_role}) tried to access endpoint requiring {allowed_roles}"
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required role: {', '.join(allowed_roles)}"
            )
        
        return session
    
    return role_checker
