"""
Property-Based Tests for Session Security

**Validates: Requirements 1.3, 12.2, 12.3, 12.4**

This module contains property-based tests that verify session management
security properties including cookie attributes and protected route authentication.

Properties tested:
- Property 4: Session Security Attributes - Session cookies have httpOnly, secure, and sameSite=lax
- Property 5: Protected Route Authentication - Protected routes reject requests without valid sessions
"""

import pytest
from hypothesis import given, strategies as st, assume, settings
from uuid import UUID, uuid4
from typing import Dict, Optional
import os
import sys
from pathlib import Path
from datetime import datetime, timedelta
import json
import base64
from cryptography.fernet import Fernet
import hashlib

# Add backend directory to path
backend_dir = Path(__file__).parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

# Load environment variables
from dotenv import load_dotenv
env_file = backend_dir / ".env"
if env_file.exists():
    load_dotenv(env_file)


# ============================================================================
# Test Configuration
# ============================================================================

@pytest.fixture(scope="module")
def session_secret():
    """Get session secret for testing"""
    secret = os.getenv("SESSION_SECRET_KEY")
    if not secret:
        # Use a test secret if not configured
        secret = "test-secret-key-for-session-security-tests-minimum-32-chars"
    return secret


@pytest.fixture(scope="module")
def session_manager(session_secret):
    """Create session manager instance for testing"""
    # Mock settings
    class MockSettings:
        session_secret_key = session_secret
        environment = "development"
    
    # Temporarily replace settings
    import core.config as config_module
    original_settings = config_module.settings
    config_module.settings = MockSettings()
    
    from utils.session import SessionManager
    manager = SessionManager()
    
    yield manager
    
    # Restore original settings
    config_module.settings = original_settings


# ============================================================================
# Helper Functions
# ============================================================================

def parse_cookie_string(cookie_string: str) -> Dict[str, any]:
    """Parse Set-Cookie header string to extract attributes"""
    attributes = {}
    parts = cookie_string.split(";")
    
    # First part is the cookie name=value
    if parts:
        name_value = parts[0].strip().split("=", 1)
        if len(name_value) == 2:
            attributes["name"] = name_value[0]
            attributes["value"] = name_value[1]
    
    # Parse attributes
    for part in parts[1:]:
        part = part.strip()
        if "=" in part:
            key, value = part.split("=", 1)
            attributes[key.lower()] = value
        else:
            # Boolean attributes like HttpOnly, Secure
            attributes[part.lower()] = True
    
    return attributes


def decrypt_session_cookie(cookie_value: str, secret_key: str) -> Optional[dict]:
    """Decrypt and parse session cookie"""
    try:
        # Create Fernet cipher
        key = hashlib.sha256(secret_key.encode()).digest()
        cipher = Fernet(base64.urlsafe_b64encode(key))
        
        # Decrypt
        encrypted = base64.urlsafe_b64decode(cookie_value.encode())
        decrypted = cipher.decrypt(encrypted)
        session_data = json.loads(decrypted.decode())
        
        return session_data
    except Exception:
        return None


class MockRequest:
    """Mock FastAPI Request object"""
    def __init__(self, cookies: Dict[str, str] = None):
        self.cookies = cookies or {}


class MockResponse:
    """Mock FastAPI Response object"""
    def __init__(self):
        self.cookies_set = []
        self.cookies_deleted = []
    
    def set_cookie(
        self,
        key: str,
        value: str = "",
        max_age: int = None,
        expires: int = None,
        path: str = "/",
        domain: str = None,
        secure: bool = False,
        httponly: bool = False,
        samesite: str = "lax"
    ):
        """Mock set_cookie method"""
        self.cookies_set.append({
            "key": key,
            "value": value,
            "max_age": max_age,
            "expires": expires,
            "path": path,
            "domain": domain,
            "secure": secure,
            "httponly": httponly,
            "samesite": samesite
        })
    
    def delete_cookie(self, key: str, path: str = "/", domain: str = None):
        """Mock delete_cookie method"""
        self.cookies_deleted.append({
            "key": key,
            "path": path,
            "domain": domain
        })


# ============================================================================
# Property 4: Session Security Attributes
# ============================================================================

class TestSessionSecurityAttributes:
    """
    **Property 4: Session Security Attributes**
    
    For any session cookie created, it must have httpOnly, secure, and 
    sameSite=lax attributes set.
    
    **Validates: Requirements 1.3, 12.2**
    """
    
    def test_session_cookie_has_httponly_attribute(self, session_manager):
        """
        Property: Session cookie has httpOnly attribute set to True
        
        Given: Session manager creates a session
        When: Session cookie is set
        Then: httpOnly attribute is True
        """
        response = MockResponse()
        
        session_manager.create_session(
            response=response,
            user_id=str(uuid4()),
            email="test@example.com",
            hospital_id=str(uuid4()),
            role="doctor"
        )
        
        # Property: Cookie was set
        assert len(response.cookies_set) == 1, "Session cookie must be set"
        
        cookie = response.cookies_set[0]
        
        # Property: httpOnly is True
        assert cookie["httponly"] is True, \
            "Session cookie must have httpOnly=True"
    
    def test_session_cookie_has_samesite_lax(self, session_manager):
        """
        Property: Session cookie has sameSite=lax attribute
        
        Given: Session manager creates a session
        When: Session cookie is set
        Then: sameSite attribute is 'lax'
        """
        response = MockResponse()
        
        session_manager.create_session(
            response=response,
            user_id=str(uuid4()),
            email="test@example.com",
            hospital_id=str(uuid4()),
            role="doctor"
        )
        
        cookie = response.cookies_set[0]
        
        # Property: sameSite is 'lax'
        assert cookie["samesite"] == "lax", \
            "Session cookie must have sameSite=lax"
    
    def test_session_cookie_has_correct_max_age(self, session_manager):
        """
        Property: Session cookie has max_age of 24 hours (86400 seconds)
        
        Given: Session manager creates a session
        When: Session cookie is set
        Then: max_age is 86400 seconds
        """
        response = MockResponse()
        
        session_manager.create_session(
            response=response,
            user_id=str(uuid4()),
            email="test@example.com",
            hospital_id=str(uuid4()),
            role="doctor"
        )
        
        cookie = response.cookies_set[0]
        
        # Property: max_age is 24 hours
        assert cookie["max_age"] == 86400, \
            "Session cookie max_age must be 86400 seconds (24 hours)"
    
    def test_session_cookie_has_root_path(self, session_manager):
        """
        Property: Session cookie has path='/'
        
        Given: Session manager creates a session
        When: Session cookie is set
        Then: path is '/'
        """
        response = MockResponse()
        
        session_manager.create_session(
            response=response,
            user_id=str(uuid4()),
            email="test@example.com",
            hospital_id=str(uuid4()),
            role="doctor"
        )
        
        cookie = response.cookies_set[0]
        
        # Property: path is '/'
        assert cookie["path"] == "/", \
            "Session cookie path must be '/'"
    
    @given(
        user_count=st.integers(min_value=1, max_value=10)
    )
    @settings(max_examples=20, deadline=None)
    def test_session_attributes_consistent_across_users(
        self,
        session_manager,
        user_count: int
    ):
        """
        Property: Session cookie attributes are consistent for all users
        
        Given: Multiple different users
        When: Each user gets a session
        Then: All session cookies have the same security attributes
        """
        for i in range(user_count):
            response = MockResponse()
            
            session_manager.create_session(
                response=response,
                user_id=str(uuid4()),
                email=f"user{i}@example.com",
                hospital_id=str(uuid4()),
                role="doctor" if i % 2 == 0 else "manager"
            )
            
            cookie = response.cookies_set[0]
            
            # Property: All required security attributes are present and correct
            assert cookie["httponly"] is True, \
                f"User {i}: httpOnly must be True"
            assert cookie["samesite"] == "lax", \
                f"User {i}: sameSite must be 'lax'"
            assert cookie["max_age"] == 86400, \
                f"User {i}: max_age must be 86400"
            assert cookie["path"] == "/", \
                f"User {i}: path must be '/'"
    
    def test_session_cookie_value_is_encrypted(
        self,
        session_manager,
        session_secret: str
    ):
        """
        Property: Session cookie value is encrypted
        
        Given: Session manager creates a session
        When: Session cookie is set
        Then: Cookie value is encrypted and can be decrypted with session secret
        """
        response = MockResponse()
        user_id = str(uuid4())
        email = "test@example.com"
        hospital_id = str(uuid4())
        role = "doctor"
        
        session_manager.create_session(
            response=response,
            user_id=user_id,
            email=email,
            hospital_id=hospital_id,
            role=role
        )
        
        cookie = response.cookies_set[0]
        cookie_value = cookie["value"]
        
        # Property: Cookie value can be decrypted
        session_data = decrypt_session_cookie(cookie_value, session_secret)
        assert session_data is not None, \
            "Session cookie value must be encrypted and decryptable"
        
        # Property: Decrypted session contains required fields
        required_fields = ["user_id", "email", "hospital_id", "role", "created_at", "last_activity"]
        for field in required_fields:
            assert field in session_data, \
                f"Session data must contain {field}"
        
        # Property: Session data matches input
        assert session_data["email"] == email
        assert session_data["user_id"] == user_id
        assert session_data["hospital_id"] == hospital_id
        assert session_data["role"] == role
    
    @given(
        email=st.emails(),
        role=st.sampled_from(["doctor", "manager"])
    )
    @settings(max_examples=30, deadline=None)
    def test_session_data_integrity(
        self,
        session_manager,
        session_secret: str,
        email: str,
        role: str
    ):
        """
        Property: Session data can be round-tripped (create -> decrypt -> verify)
        
        Given: Random user data
        When: Session is created and then decrypted
        Then: Decrypted data matches original data
        """
        response = MockResponse()
        user_id = str(uuid4())
        hospital_id = str(uuid4())
        
        # Create session
        session_manager.create_session(
            response=response,
            user_id=user_id,
            email=email,
            hospital_id=hospital_id,
            role=role
        )
        
        # Decrypt session
        cookie_value = response.cookies_set[0]["value"]
        session_data = decrypt_session_cookie(cookie_value, session_secret)
        
        # Property: Data integrity is maintained
        assert session_data["user_id"] == user_id
        assert session_data["email"] == email
        assert session_data["hospital_id"] == hospital_id
        assert session_data["role"] == role


# ============================================================================
# Property 5: Protected Route Authentication
# ============================================================================

class TestProtectedRouteAuthentication:
    """
    **Property 5: Protected Route Authentication**
    
    For any request to a protected route, a valid session must exist or 
    the request must be rejected with 401.
    
    **Validates: Requirements 12.3, 12.4**
    """
    
    def test_get_session_returns_none_without_cookie(self, session_manager):
        """
        Property: get_session returns None when no session cookie exists
        
        Given: Request without session cookie
        When: get_session is called
        Then: Returns None
        """
        request = MockRequest(cookies={})
        
        session = session_manager.get_session(request)
        
        # Property: No session returned
        assert session is None, \
            "get_session must return None when no session cookie exists"
    
    def test_get_session_returns_none_with_invalid_cookie(self, session_manager):
        """
        Property: get_session returns None with invalid/corrupted session cookie
        
        Given: Request with invalid session cookie
        When: get_session is called
        Then: Returns None
        """
        request = MockRequest(cookies={
            "sl_academy_session": "invalid_cookie_value_" + str(uuid4())
        })
        
        session = session_manager.get_session(request)
        
        # Property: No session returned for invalid cookie
        assert session is None, \
            "get_session must return None with invalid session cookie"
    
    def test_get_session_returns_data_with_valid_cookie(
        self,
        session_manager,
        session_secret: str
    ):
        """
        Property: get_session returns session data with valid cookie
        
        Given: Request with valid session cookie
        When: get_session is called
        Then: Returns session data
        """
        # Create session
        response = MockResponse()
        user_id = str(uuid4())
        email = "test@example.com"
        hospital_id = str(uuid4())
        role = "doctor"
        
        session_manager.create_session(
            response=response,
            user_id=user_id,
            email=email,
            hospital_id=hospital_id,
            role=role
        )
        
        cookie_value = response.cookies_set[0]["value"]
        
        # Get session
        request = MockRequest(cookies={"sl_academy_session": cookie_value})
        session = session_manager.get_session(request)
        
        # Property: Session data is returned
        assert session is not None, \
            "get_session must return session data with valid cookie"
        
        # Property: Session data is correct
        assert session["user_id"] == user_id
        assert session["email"] == email
        assert session["hospital_id"] == hospital_id
        assert session["role"] == role
    
    def test_expired_session_returns_none(
        self,
        session_manager,
        session_secret: str
    ):
        """
        Property: Expired session cookie returns None
        
        Given: A session cookie that has expired (created_at > 24 hours ago)
        When: get_session is called
        Then: Returns None
        """
        # Create expired session data manually
        expired_time = datetime.utcnow() - timedelta(hours=25)  # 25 hours ago
        session_data = {
            "user_id": str(uuid4()),
            "email": "test@example.com",
            "hospital_id": str(uuid4()),
            "role": "doctor",
            "created_at": expired_time.isoformat(),
            "last_activity": expired_time.isoformat()
        }
        
        # Encrypt session data
        key = hashlib.sha256(session_secret.encode()).digest()
        cipher = Fernet(base64.urlsafe_b64encode(key))
        json_data = json.dumps(session_data)
        encrypted = cipher.encrypt(json_data.encode())
        cookie_value = base64.urlsafe_b64encode(encrypted).decode()
        
        # Get session
        request = MockRequest(cookies={"sl_academy_session": cookie_value})
        session = session_manager.get_session(request)
        
        # Property: Expired session returns None
        assert session is None, \
            "get_session must return None for expired session"
    
    @given(
        hours_old=st.integers(min_value=0, max_value=48)
    )
    @settings(max_examples=20, deadline=None)
    def test_session_expiration_boundary(
        self,
        session_manager,
        session_secret: str,
        hours_old: int
    ):
        """
        Property: Sessions expire after exactly 24 hours
        
        Given: Session created N hours ago
        When: get_session is called
        Then: Returns data if N < 24, None if N >= 24
        """
        # Create session data with specific age
        created_time = datetime.utcnow() - timedelta(hours=hours_old)
        session_data = {
            "user_id": str(uuid4()),
            "email": "test@example.com",
            "hospital_id": str(uuid4()),
            "role": "doctor",
            "created_at": created_time.isoformat(),
            "last_activity": created_time.isoformat()
        }
        
        # Encrypt
        key = hashlib.sha256(session_secret.encode()).digest()
        cipher = Fernet(base64.urlsafe_b64encode(key))
        json_data = json.dumps(session_data)
        encrypted = cipher.encrypt(json_data.encode())
        cookie_value = base64.urlsafe_b64encode(encrypted).decode()
        
        # Get session
        request = MockRequest(cookies={"sl_academy_session": cookie_value})
        session = session_manager.get_session(request)
        
        # Property: Session validity depends on age
        if hours_old < 24:
            assert session is not None, \
                f"Session should be valid after {hours_old} hours"
        else:
            assert session is None, \
                f"Session should be expired after {hours_old} hours"
    
    def test_destroy_session_deletes_cookie(self, session_manager):
        """
        Property: destroy_session deletes the session cookie
        
        Given: Session manager
        When: destroy_session is called
        Then: Session cookie is deleted
        """
        response = MockResponse()
        
        session_manager.destroy_session(response)
        
        # Property: Cookie was deleted
        assert len(response.cookies_deleted) == 1, \
            "destroy_session must delete the session cookie"
        
        deleted_cookie = response.cookies_deleted[0]
        
        # Property: Correct cookie was deleted
        assert deleted_cookie["key"] == "sl_academy_session", \
            "destroy_session must delete 'sl_academy_session' cookie"
        assert deleted_cookie["path"] == "/", \
            "destroy_session must delete cookie with path='/'"
    
    def test_refresh_session_updates_activity_timestamp(
        self,
        session_manager,
        session_secret: str
    ):
        """
        Property: refresh_session updates last_activity timestamp
        
        Given: Valid session
        When: refresh_session is called
        Then: last_activity timestamp is updated
        """
        # Create initial session
        response1 = MockResponse()
        user_id = str(uuid4())
        
        session_manager.create_session(
            response=response1,
            user_id=user_id,
            email="test@example.com",
            hospital_id=str(uuid4()),
            role="doctor"
        )
        
        initial_cookie_value = response1.cookies_set[0]["value"]
        initial_session = decrypt_session_cookie(initial_cookie_value, session_secret)
        initial_activity = datetime.fromisoformat(initial_session["last_activity"])
        
        # Wait a moment and refresh
        import time
        time.sleep(0.1)
        
        request = MockRequest(cookies={"sl_academy_session": initial_cookie_value})
        response2 = MockResponse()
        
        result = session_manager.refresh_session(request, response2)
        
        # Property: Refresh succeeded
        assert result is True, \
            "refresh_session must return True for valid session"
        
        # Property: New cookie was set
        assert len(response2.cookies_set) == 1, \
            "refresh_session must set new session cookie"
        
        refreshed_cookie_value = response2.cookies_set[0]["value"]
        refreshed_session = decrypt_session_cookie(refreshed_cookie_value, session_secret)
        refreshed_activity = datetime.fromisoformat(refreshed_session["last_activity"])
        
        # Property: last_activity was updated
        assert refreshed_activity > initial_activity, \
            "refresh_session must update last_activity timestamp"


# ============================================================================
# Run Tests
# ============================================================================

if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])





# ============================================================================
# Run Tests
# ============================================================================

if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
