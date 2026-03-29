"""
SL Academy Platform - Authentication Middleware
Validates sessions on protected routes and handles automatic refresh
"""

from fastapi import Request, Response, HTTPException, status
from starlette.middleware.base import BaseHTTPMiddleware
from utils.session import session_manager
from core.database import Database
from datetime import datetime, timedelta
from typing import Optional
import asyncio
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
        "/ping",
        "/docs",
        "/openapi.json",
        "/api/auth/login",
        "/api/auth/login/medico",
        "/api/auth/login/gestor",
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

        # 1. Try session cookie
        session = session_manager.get_session(request)

        # 2. Fallback: validate Supabase JWT from Authorization header
        #    (frontend sends this when authenticated directly via Supabase Auth)
        if not session:
            session = await self._get_session_from_bearer(request)

        if not session:
            logger.warning(f"Unauthorized access attempt to {request.url.path}")
            return Response(
                content='{"detail":"Not authenticated"}',
                status_code=status.HTTP_401_UNAUTHORIZED,
                media_type="application/json"
            )

        # Inject into request.state so get_current_user / require_role can use it
        request.state.session = session

        # Check if session needs refresh (activity within last 5 minutes)
        last_activity = datetime.fromisoformat(session["last_activity"])
        if datetime.utcnow() - last_activity > timedelta(minutes=5):
            request.state.refresh_session = True

        # Process request
        response = await call_next(request)

        # Refresh session cookie if needed (no-op when session came from Bearer)
        if hasattr(request.state, "refresh_session") and request.state.refresh_session:
            session_manager.refresh_session(request, response)

        return response

    async def _get_session_from_bearer(self, request: Request) -> Optional[dict]:
        """Validate a Supabase JWT from the Authorization header.

        Returns a session-compatible dict on success, None otherwise.
        Runs the sync Supabase client in a thread pool with a 3-second timeout
        to avoid blocking the event loop indefinitely if Supabase is slow.
        """
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return None
        token = auth_header[7:]
        if not token:
            return None

        def _validate_sync() -> Optional[dict]:
            db = Database.get_client()
            user_response = db.auth.get_user(token)
            if not user_response.user:
                return None
            user = user_response.user
            profile_response = (
                db.table("profiles")
                .select("id, hospital_id, role")
                .eq("id", str(user.id))
                .is_("deleted_at", "null")
                .single()
                .execute()
            )
            if not profile_response.data:
                return None
            profile = profile_response.data
            now = datetime.utcnow().isoformat()
            return {
                "user_id": str(user.id),
                "email": user.email or "",
                "hospital_id": str(profile["hospital_id"]),
                "role": profile["role"],
                "created_at": now,
                "last_activity": now,
            }

        try:
            return await asyncio.wait_for(
                asyncio.get_event_loop().run_in_executor(None, _validate_sync),
                timeout=3.0,
            )
        except asyncio.TimeoutError:
            logger.warning("Bearer token validation timed out after 3s")
            return None
        except Exception as e:
            logger.debug(f"Bearer token validation failed: {type(e).__name__}: {e}")
            return None
    
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
        # Prefer session injected by middleware (supports both cookie and Bearer)
        session = getattr(request.state, "session", None) or session_manager.get_session(request)

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
