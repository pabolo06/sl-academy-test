"""
SL Academy Platform - Session Management
Iron-session style encrypted cookie management for FastAPI
"""

from fastapi import Request, Response, HTTPException, status
from datetime import datetime, timedelta
from typing import Optional
import json
import base64
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives import hashes
from core.config import settings


class SessionManager:
    """Manages encrypted session cookies"""
    
    SESSION_COOKIE_NAME = "sl_academy_session"
    SESSION_MAX_AGE = 24 * 60 * 60  # 24 hours in seconds
    
    def __init__(self):
        import hashlib
        # Salt derived from the secret itself — avoids hardcoded value while
        # keeping determinism (same secret always produces the same cipher key)
        salt = hashlib.sha256(settings.session_secret_key.encode()).digest()[:16]
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=100000,
        )
        raw_key = kdf.derive(settings.session_secret_key.encode())
        self.cipher = Fernet(base64.urlsafe_b64encode(raw_key))
    
    def create_session(
        self,
        response: Response,
        user_id: str,
        email: str,
        hospital_id: str,
        role: str
    ) -> None:
        """Create encrypted session cookie"""
        now = datetime.utcnow()
        session_data = {
            "user_id": user_id,
            "email": email,
            "hospital_id": hospital_id,
            "role": role,
            "created_at": now.isoformat(),
            "last_activity": now.isoformat()
        }
        
        # Encrypt session data
        json_data = json.dumps(session_data)
        encrypted = self.cipher.encrypt(json_data.encode())
        cookie_value = base64.urlsafe_b64encode(encrypted).decode()
        
        # Set secure cookie
        response.set_cookie(
            key=self.SESSION_COOKIE_NAME,
            value=cookie_value,
            max_age=self.SESSION_MAX_AGE,
            httponly=True,
            secure=settings.environment == "production",
            samesite="lax",
            path="/"
        )
    
    def get_session(self, request: Request) -> Optional[dict]:
        """Get and decrypt session data from cookie"""
        cookie_value = request.cookies.get(self.SESSION_COOKIE_NAME)
        
        if not cookie_value:
            return None
        
        try:
            # Decrypt session data
            encrypted = base64.urlsafe_b64decode(cookie_value.encode())
            decrypted = self.cipher.decrypt(encrypted)
            session_data = json.loads(decrypted.decode())
            
            # Check session expiration
            created_at = datetime.fromisoformat(session_data["created_at"])
            if datetime.utcnow() - created_at >= timedelta(seconds=self.SESSION_MAX_AGE):
                return None
            
            return session_data
        except Exception:
            return None
    
    def refresh_session(self, request: Request, response: Response) -> bool:
        """Refresh session activity timestamp"""
        session = self.get_session(request)
        
        if not session:
            return False
        
        # Update last activity
        session["last_activity"] = datetime.utcnow().isoformat()
        
        # Re-encrypt and set cookie
        json_data = json.dumps(session)
        encrypted = self.cipher.encrypt(json_data.encode())
        cookie_value = base64.urlsafe_b64encode(encrypted).decode()
        
        response.set_cookie(
            key=self.SESSION_COOKIE_NAME,
            value=cookie_value,
            max_age=self.SESSION_MAX_AGE,
            httponly=True,
            secure=settings.environment == "production",
            samesite="lax",
            path="/"
        )
        
        return True
    
    def destroy_session(self, response: Response) -> None:
        """Destroy session cookie"""
        response.delete_cookie(
            key=self.SESSION_COOKIE_NAME,
            path="/"
        )


# Global session manager instance
session_manager = SessionManager()


def get_current_user(request: Request) -> dict:
    """Dependency to get current authenticated user.

    Reads from request.state.session (set by SessionValidationMiddleware),
    which supports both cookie-based sessions and Supabase JWT Bearer tokens.
    Falls back to reading the cookie directly for cases where the middleware
    is not in the stack.
    """
    session = getattr(request.state, "session", None) or session_manager.get_session(request)

    if not session:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )

    return session
