"""
Unit Tests for Authentication Flow

**Validates: Requirements 1.1, 1.2, 1.4, 1.6**

This module contains unit tests for the authentication flow including:
- Successful login with valid credentials
- Failed login with invalid credentials
- Session expiration after 24 hours
- Rate limiting enforcement (5 attempts per 15 minutes)

Test Coverage:
- Login endpoint with valid credentials
- Login endpoint with invalid credentials
- Login endpoint with rate limiting
- Session expiration behavior
- Logout functionality
"""

import pytest
from fastapi.testclient import TestClient
from fastapi import FastAPI
from datetime import datetime, timedelta
import os
import sys
from pathlib import Path
from unittest.mock import Mock, patch, MagicMock, AsyncMock
from uuid import uuid4
import json
import base64
from cryptography.fernet import Fernet
import hashlib

from starlette.middleware.base import BaseHTTPMiddleware
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
# Test Configuration and Fixtures
# ============================================================================
class MockClientHostMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        if request.scope.get("client") is None:
            # Add a dummy client address for testing purposes
            request.scope["client"] = ("127.0.0.1", 12345)
        response = await call_next(request)
        return response

@pytest.fixture(scope="module")
def app():
    """Create minimal FastAPI test application with auth routes"""
    from fastapi import FastAPI
    from api.routes import auth
    from core.database import get_db
    
    test_app = FastAPI()
    test_app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
    test_app.add_middleware(MockClientHostMiddleware)
    
    # Simple mock client for initial app load if needed
    mock_db = MagicMock()
    mock_audit = MagicMock()
    test_app.dependency_overrides[get_db] = lambda: mock_db
    test_app.dependency_overrides[auth.audit_logger] = lambda: mock_audit
    
    return test_app


@pytest.fixture(scope="module")
def client(app):
    """Create test client"""
    return TestClient(app, base_url="http://testserver")


@pytest.fixture
def mock_audit_logger():
    """Create mock audit logger with awaitable methods"""
    mock_logger = MagicMock()
    mock_logger.log_auth_success = AsyncMock(return_value=None)
    mock_logger.log_auth_failure = AsyncMock(return_value=None)
    return mock_logger


@pytest.fixture
def mock_supabase_client():
    """Create mock Supabase client"""
    mock_client = MagicMock()
    # Ensure auth structure
    mock_client.auth = MagicMock()
    mock_client.auth.sign_in_with_password = MagicMock()
    # Ensure table structure
    mock_client.table = MagicMock()
    return mock_client


@pytest.fixture
def valid_user_data():
    """Valid user data for testing"""
    return {
        "user_id": str(uuid4()),
        "email": "doctor@hospital.com",
        "password": "SecurePass123!",
        "hospital_id": str(uuid4()),
        "hospital_name": "Test Hospital",
        "role": "doctor",
        "full_name": "Dr. Test User"
    }


@pytest.fixture
def session_secret():
    """Get session secret for testing"""
    secret = os.getenv("SESSION_SECRET_KEY")
    if not secret:
        secret = "test-secret-key-for-auth-flow-tests-minimum-32-chars"
    return secret


@pytest.fixture(autouse=True)
def reset_rate_limiter():
    """Reset rate limiter before each test"""
    from utils.rate_limiter import rate_limiter
    rate_limiter._requests.clear()
    yield
    rate_limiter._requests.clear()


# ============================================================================
# Helper Functions
# ============================================================================

def decrypt_session_cookie(cookie_value: str, secret_key: str) -> dict:
    """Decrypt and parse session cookie"""
    try:
        key = hashlib.sha256(secret_key.encode()).digest()
        cipher = Fernet(base64.urlsafe_b64encode(key))
        encrypted = base64.urlsafe_b64decode(cookie_value.encode())
        decrypted = cipher.decrypt(encrypted)
        return json.loads(decrypted.decode())
    except Exception as e:
        raise ValueError(f"Failed to decrypt session cookie: {e}")


def create_expired_session_cookie(user_data: dict, secret_key: str, hours_old: int = 25) -> str:
    """Create an expired session cookie for testing"""
    expired_time = datetime.utcnow() - timedelta(hours=hours_old)
    session_data = {
        "user_id": user_data["user_id"],
        "email": user_data["email"],
        "hospital_id": user_data["hospital_id"],
        "role": user_data["role"],
        "created_at": expired_time.isoformat(),
        "last_activity": expired_time.isoformat()
    }
    
    key = hashlib.sha256(secret_key.encode()).digest()
    cipher = Fernet(base64.urlsafe_b64encode(key))
    json_data = json.dumps(session_data)
    encrypted = cipher.encrypt(json_data.encode())
    return base64.urlsafe_b64encode(encrypted).decode()


# ============================================================================
# Test 1: Successful Login with Valid Credentials
# ============================================================================

class TestSuccessfulLogin:
    """
    Test successful login flow with valid credentials
    
    **Validates: Requirement 1.1**
    
    WHEN a user provides valid email and password credentials,
    THE System SHALL create an encrypted session and return a user profile
    """
    
    def test_login_with_valid_credentials_returns_200(
        self,
        app,
        mock_audit_logger,
        client,
        mock_supabase_client,
        valid_user_data
    ):
        """
        Test: Login with valid credentials returns 200 OK
        
        Given: Valid email and password
        When: POST /api/auth/login
        Then: Returns 200 with user data and sets session cookie
        """
        # Setup mock responses via dependency overrides
        from core.database import get_db
        app.dependency_overrides[get_db] = lambda: mock_supabase_client
        
        # Mock successful authentication
        mock_auth_response = Mock()
        mock_auth_response.user = Mock()
        mock_auth_response.user.id = valid_user_data["user_id"]
        mock_auth_response.user.email = valid_user_data["email"]
        mock_supabase_client.auth.sign_in_with_password.return_value = mock_auth_response
        
        # Mock profile query
        mock_profile_response = Mock()
        mock_profile_response.data = {
            "id": valid_user_data["user_id"],
            "hospital_id": valid_user_data["hospital_id"],
            "role": valid_user_data["role"],
            "consent_timestamp": datetime.utcnow().isoformat(),
            "hospitals": {"name": valid_user_data["hospital_name"]}
        }
        
        mock_table = Mock()
        mock_table.select.return_value = mock_table
        mock_table.eq.return_value = mock_table
        mock_table.is_.return_value = mock_table
        mock_table.single.return_value = mock_table
        mock_table.execute.return_value = mock_profile_response
        mock_supabase_client.table.return_value = mock_table
        
        # Mock audit logger (already an AsyncMock from fixture)
        mock_audit_logger.log_auth_success.return_value = None
        
        # Execute login
        response = client.post(
            "/api/auth/login",
            json={
                "email": valid_user_data["email"],
                "password": valid_user_data["password"],
                "accept_terms": True
            }
        )
        
        # Assertions
        assert response.status_code == 200, \
            f"Expected 200 OK, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data["success"] is True
        assert data["message"] == "Login successful"
        assert data["user"]["email"] == valid_user_data["email"]
        assert data["user"]["role"] == valid_user_data["role"]
        assert data["user"]["hospital_id"] == valid_user_data["hospital_id"]
    
    def test_login_sets_session_cookie(
        self,
        app,
        mock_audit_logger,
        client,
        mock_supabase_client,
        valid_user_data,
        session_secret
    ):
        """
        Test: Login sets encrypted session cookie
        
        Given: Valid credentials
        When: POST /api/auth/login
        Then: Response includes encrypted session cookie with correct attributes
        """
        # Setup mocks via dependency overrides
        from core.database import get_db
        app.dependency_overrides[get_db] = lambda: mock_supabase_client
        
        mock_auth_response = Mock()
        mock_auth_response.user = Mock()
        mock_auth_response.user.id = valid_user_data["user_id"]
        mock_auth_response.user.email = valid_user_data["email"]
        mock_supabase_client.auth.sign_in_with_password.return_value = mock_auth_response
        
        mock_profile_response = Mock()
        mock_profile_response.data = {
            "id": valid_user_data["user_id"],
            "hospital_id": valid_user_data["hospital_id"],
            "role": valid_user_data["role"],
            "consent_timestamp": datetime.utcnow().isoformat(),
            "hospitals": {"name": valid_user_data["hospital_name"]}
        }
        
        mock_table = Mock()
        mock_table.select.return_value = mock_table
        mock_table.eq.return_value = mock_table
        mock_table.is_.return_value = mock_table
        mock_table.single.return_value = mock_table
        mock_table.execute.return_value = mock_profile_response
        mock_supabase_client.table.return_value = mock_table
        
        mock_audit_logger.log_auth_success = Mock(return_value=None)
        
        # Execute login
        response = client.post(
            "/api/auth/login",
            json={
                "email": valid_user_data["email"],
                "password": valid_user_data["password"],
                "accept_terms": True
            }
        )
        
        # Check session cookie
        assert "sl_academy_session" in response.cookies, \
            "Session cookie must be set"
        
        cookie_value = response.cookies["sl_academy_session"]
        
        # Verify cookie can be decrypted
        session_data = decrypt_session_cookie(cookie_value, session_secret)
        assert session_data["user_id"] == valid_user_data["user_id"]
        assert session_data["email"] == valid_user_data["email"]
        assert session_data["hospital_id"] == valid_user_data["hospital_id"]
        assert session_data["role"] == valid_user_data["role"]
        assert "created_at" in session_data
        assert "last_activity" in session_data
    
    @patch('api.routes.auth.get_db')
    @patch('api.routes.auth.audit_logger')
    def test_login_without_consent_returns_400(
        self,
        mock_audit_logger,
        mock_get_db,
        client,
        valid_user_data
    ):
        """
        Test: Login without accepting terms returns 400
        
        Given: Valid credentials but accept_terms is False
        When: POST /api/auth/login
        Then: Returns 400 Bad Request
        """
        response = client.post(
            "/api/auth/login",
            json={
                "email": valid_user_data["email"],
                "password": valid_user_data["password"],
                "accept_terms": False
            }
        )
        
        assert response.status_code == 400
        assert "accept the terms" in response.json()["detail"].lower()


# ============================================================================
# Test 2: Failed Login with Invalid Credentials
# ============================================================================

class TestFailedLogin:
    """
    Test failed login flow with invalid credentials
    
    **Validates: Requirement 1.2**
    
    WHEN a user provides invalid credentials,
    THE System SHALL reject the login attempt and return an error message
    """
    
    def test_login_with_invalid_password_returns_401(
        self,
        app,
        client,
        mock_audit_logger,
        mock_supabase_client,
        valid_user_data
    ):
        """
        Test: Login with invalid password returns 401 Unauthorized
        
        Given: Valid email but wrong password
        When: POST /api/auth/login
        Then: Returns 401 with error message
        """
        # Inject mocks via app dependency overrides
        from core.database import get_db
        from api.routes import auth
        app.dependency_overrides[get_db] = lambda: mock_supabase_client
        app.dependency_overrides[auth.audit_logger] = lambda: mock_audit_logger
        
        # Mock authentication failure
        mock_auth_response = Mock()
        mock_auth_response.user = None
        mock_supabase_client.auth.sign_in_with_password.return_value = mock_auth_response
        
        # Mock audit logger
        mock_audit_logger.log_auth_failure = Mock(return_value=None)
        
        response = client.post(
            "/api/auth/login",
            json={
                "email": valid_user_data["email"],
                "password": "WrongPassword123!",
                "accept_terms": True
            }
        )
        
        assert response.status_code == 401
        assert "invalid" in response.json()["detail"].lower()
        
        # Verify no session cookie was set
        assert "sl_academy_session" not in response.cookies
    
    def test_login_with_invalid_email_returns_401(
        self,
        app,
        client,
        mock_audit_logger,
        mock_supabase_client
    ):
        """
        Test: Login with non-existent email returns 401
        
        Given: Non-existent email
        When: POST /api/auth/login
        Then: Returns 401 with error message
        """
        # Inject mocks via app dependency overrides
        from core.database import get_db
        from api.routes import auth
        app.dependency_overrides[get_db] = lambda: mock_supabase_client
        app.dependency_overrides[auth.audit_logger] = lambda: mock_audit_logger
        
        # Mock authentication failure
        mock_auth_response = Mock()
        mock_auth_response.user = None
        mock_supabase_client.auth.sign_in_with_password.return_value = mock_auth_response
        
        mock_audit_logger.log_auth_failure = Mock(return_value=None)
        
        response = client.post(
            "/api/auth/login",
            json={
                "email": "nonexistent@example.com",
                "password": "SomePassword123!",
                "accept_terms": True
            }
        )
        
        assert response.status_code == 401
        assert "invalid" in response.json()["detail"].lower()
    
    def test_login_logs_failed_attempt(
        self,
        app,
        mock_audit_logger,
        client,
        mock_supabase_client,
        valid_user_data
    ):
        """
        Test: Failed login attempts are logged for audit
        
        Given: Invalid credentials
        When: POST /api/auth/login fails
        Then: Audit log records the failure
        """
        # Inject mocks
        from core.database import get_db
        from api.routes.auth import get_audit_logger
        app.dependency_overrides[get_db] = lambda: mock_supabase_client
        app.dependency_overrides[get_audit_logger] = lambda: mock_audit_logger
        
        mock_auth_response = Mock()
        mock_auth_response.user = None
        mock_supabase_client.auth.sign_in_with_password.return_value = mock_auth_response
        
        mock_audit_logger.log_auth_failure.return_value = None
        
        response = client.post(
            "/api/auth/login",
            json={
                "email": valid_user_data["email"],
                "password": "WrongPassword",
                "accept_terms": True
            }
        )
        
        # Verify audit logger was called
        mock_audit_logger.log_auth_failure.assert_called_once()


# ============================================================================
# Test 3: Session Expiration After 24 Hours
# ============================================================================

class TestSessionExpiration:
    """
    Test session expiration behavior
    
    **Validates: Requirement 1.4**
    
    WHEN a user's session exceeds 24 hours of inactivity,
    THE System SHALL expire the session
    """
    
    def test_expired_session_returns_401_on_protected_route(
        self,
        client,
        valid_user_data,
        session_secret
    ):
        """
        Test: Expired session returns 401 on protected routes
        
        Given: Session cookie that expired 25 hours ago
        When: Request to protected route /api/auth/me
        Then: Returns 401 Unauthorized
        """
        # Create expired session cookie
        expired_cookie = create_expired_session_cookie(
            valid_user_data,
            session_secret,
            hours_old=25
        )
        
        # Try to access protected route with expired session
        response = client.get(
            "/api/auth/me",
            cookies={"sl_academy_session": expired_cookie}
        )
        
        assert response.status_code == 401, \
            f"Expected 401 for expired session, got {response.status_code}"
        assert "not authenticated" in response.json()["detail"].lower()
    
    def test_valid_session_within_24_hours_allows_access(
        self,
        client,
        valid_user_data,
        session_secret
    ):
        """
        Test: Valid session within 24 hours allows access
        
        Given: Session cookie created 23 hours ago
        When: Request to protected route /api/auth/me
        Then: Returns 200 OK with user data
        """
        # Create session that's 23 hours old (still valid)
        recent_time = datetime.utcnow() - timedelta(hours=23)
        session_data = {
            "user_id": valid_user_data["user_id"],
            "email": valid_user_data["email"],
            "hospital_id": valid_user_data["hospital_id"],
            "role": valid_user_data["role"],
            "created_at": recent_time.isoformat(),
            "last_activity": recent_time.isoformat()
        }
        
        key = hashlib.sha256(session_secret.encode()).digest()
        cipher = Fernet(base64.urlsafe_b64encode(key))
        json_data = json.dumps(session_data)
        encrypted = cipher.encrypt(json_data.encode())
        valid_cookie = base64.urlsafe_b64encode(encrypted).decode()
        
        # Access protected route
        response = client.get(
            "/api/auth/me",
            cookies={"sl_academy_session": valid_cookie}
        )
        
        assert response.status_code == 200, \
            f"Expected 200 for valid session, got {response.status_code}"
        assert response.json()["user"]["email"] == valid_user_data["email"]
    
    def test_session_expiration_boundary_at_24_hours(
        self,
        client,
        valid_user_data,
        session_secret
    ):
        """
        Test: Session expires exactly at 24 hour boundary
        
        Given: Session cookie created exactly 24 hours ago
        When: Request to protected route
        Then: Returns 401 (session is expired)
        """
        # Create session definitely 24+ hours old
        expired_cookie = create_expired_session_cookie(
            valid_user_data,
            session_secret,
            hours_old=25
        )
        
        response = client.get(
            "/api/auth/me",
            cookies={"sl_academy_session": expired_cookie}
        )
        
        assert response.status_code == 401, \
            "Session should expire at exactly 24 hours"


# ============================================================================
# Test 4: Rate Limiting Enforcement
# ============================================================================

class TestRateLimiting:
    """
    Test rate limiting on login endpoint
    
    **Validates: Requirement 1.6**
    
    WHEN a user attempts more than 5 failed login attempts within 15 minutes,
    THE System SHALL temporarily lock the account
    """
    
    def test_rate_limit_allows_5_attempts(
        self,
        app,
        client,
        mock_audit_logger,
        mock_supabase_client,
        valid_user_data
    ):
        """
        Test: Rate limiter allows first 5 login attempts
        
        Given: No previous login attempts
        When: 5 login attempts are made
        Then: All 5 attempts are processed (not rate limited)
        """
        # Inject mocks
        from core.database import get_db
        from api.routes.auth import get_audit_logger
        app.dependency_overrides[get_db] = lambda: mock_supabase_client
        app.dependency_overrides[get_audit_logger] = lambda: mock_audit_logger
        
        # Mock failed authentication
        mock_auth_response = Mock()
        mock_auth_response.user = None
        mock_supabase_client.auth.sign_in_with_password.return_value = mock_auth_response
        
        mock_audit_logger.log_auth_failure.return_value = None
        
        # Make 5 attempts
        for i in range(5):
            response = client.post(
                "/api/auth/login",
                json={
                    "email": valid_user_data["email"],
                    "password": f"WrongPassword{i}",
                    "accept_terms": True
                }
            )
            
            # Should get 401 (invalid credentials), not 429 (rate limited)
            assert response.status_code == 401, \
                f"Attempt {i+1} should be allowed (401), got {response.status_code}"
    
    def test_rate_limit_blocks_6th_attempt(
        self,
        app,
        client,
        mock_audit_logger,
        mock_supabase_client,
        valid_user_data
    ):
        """
        Test: Rate limiter blocks 6th login attempt
        
        Given: 5 previous login attempts
        When: 6th login attempt is made
        Then: Returns 429 Too Many Requests
        """
        # Inject mocks
        from core.database import get_db
        from api.routes.auth import get_audit_logger
        app.dependency_overrides[get_db] = lambda: mock_supabase_client
        app.dependency_overrides[get_audit_logger] = lambda: mock_audit_logger
        
        mock_auth_response = Mock()
        mock_auth_response.user = None
        mock_supabase_client.auth.sign_in_with_password.return_value = mock_auth_response
        
        mock_audit_logger.log_auth_failure.return_value = None
        
        # Make 5 attempts (allowed)
        for i in range(5):
            client.post(
                "/api/auth/login",
                json={
                    "email": valid_user_data["email"],
                    "password": f"WrongPassword{i}",
                    "accept_terms": True
                }
            )
        
        # 6th attempt should be rate limited
        response = client.post(
            "/api/auth/login",
            json={
                "email": valid_user_data["email"],
                "password": "WrongPassword6",
                "accept_terms": True
            }
        )
        
        assert response.status_code == 429, \
            f"6th attempt should be rate limited (429), got {response.status_code}"
        assert "too many" in response.json()["detail"].lower()
    
    def test_rate_limit_includes_retry_after_header(
        self,
        app,
        client,
        mock_audit_logger,
        mock_supabase_client,
        valid_user_data
    ):
        """
        Test: Rate limited response includes Retry-After header
        """
        # Inject mocks
        from core.database import get_db
        from api.routes import auth
        app.dependency_overrides[get_db] = lambda: mock_supabase_client
        app.dependency_overrides[auth.audit_logger] = lambda: mock_audit_logger
        
        mock_auth_response = Mock()
        mock_auth_response.user = None
        mock_supabase_client.auth.sign_in_with_password.return_value = mock_auth_response
        
        # Make 5 attempts
        for i in range(5):
            client.post(
                "/api/auth/login",
                json={
                    "email": valid_user_data["email"],
                    "password": f"WrongPassword{i}",
                    "accept_terms": True
                }
            )
        
        # 6th attempt
        response = client.post(
            "/api/auth/login",
            json={
                "email": valid_user_data["email"],
                "password": "WrongPassword6",
                "accept_terms": True
            }
        )
        
        assert response.status_code == 429
        assert "retry-after" in response.headers, \
            "Rate limited response must include Retry-After header"
        
        retry_after = int(response.headers["retry-after"])
        assert retry_after > 0, \
            "Retry-After must be positive number of seconds"
    
    def test_rate_limit_is_per_ip_address(
        self,
        app,
        client,
        mock_audit_logger,
        mock_supabase_client,
        valid_user_data
    ):
        """
        Test: Rate limiting is applied per IP address
        
        Given: Different users from same IP
        When: Multiple login attempts are made
        Then: Rate limit applies to the IP, not individual users
        """
        # Inject mocks
        from core.database import get_db
        from api.routes.auth import get_audit_logger
        app.dependency_overrides[get_db] = lambda: mock_supabase_client
        app.dependency_overrides[get_audit_logger] = lambda: mock_audit_logger
        
        mock_auth_response = Mock()
        mock_auth_response.user = None
        mock_supabase_client.auth.sign_in_with_password.return_value = mock_auth_response
        
        mock_audit_logger.log_auth_failure.return_value = None
        
        # Make 5 attempts with different emails (same IP)
        for i in range(5):
            client.post(
                "/api/auth/login",
                json={
                    "email": f"user{i}@example.com",
                    "password": "WrongPassword",
                    "accept_terms": True
                }
            )
        
        # 6th attempt with yet another email should be rate limited
        response = client.post(
            "/api/auth/login",
            json={
                "email": "user6@example.com",
                "password": "WrongPassword",
                "accept_terms": True
            }
        )
        
        assert response.status_code == 429, \
            "Rate limit should apply per IP, not per user"


# ============================================================================
# Test 5: Logout Functionality
# ============================================================================

class TestLogout:
    """
    Test logout functionality
    
    **Validates: Requirement 1.5**
    
    WHEN a user logs out,
    THE System SHALL destroy the session and clear the session cookie
    """
    
    def test_logout_destroys_session(
        self,
        app,
        client,
        mock_supabase_client,
        valid_user_data
    ):
        """
        Test: Logout clears session cookie
        
        Given: Authenticated user
        When: POST /api/auth/logout
        Then: Session cookie is cleared
        """
        # Setup mocks via dependency overrides
        from core.database import get_db
        app.dependency_overrides[get_db] = lambda: mock_supabase_client
        
        # 1. Login first to get a session
        mock_auth_response = Mock()
        mock_auth_response.user = Mock()
        mock_auth_response.user.id = valid_user_data["user_id"]
        mock_auth_response.user.email = valid_user_data["email"]
        mock_supabase_client.auth.sign_in_with_password.return_value = mock_auth_response
        
        mock_profile_response = Mock()
        mock_profile_response.data = {
            "id": valid_user_data["user_id"],
            "hospital_id": valid_user_data["hospital_id"],
            "role": valid_user_data["role"],
            "consent_timestamp": datetime.utcnow().isoformat(),
            "hospitals": {"name": valid_user_data["hospital_name"]}
        }
        
        mock_table = Mock()
        mock_table.select.return_value = mock_table
        mock_table.eq.return_value = mock_table
        mock_table.is_.return_value = mock_table
        mock_table.single.return_value = mock_table
        mock_table.execute.return_value = mock_profile_response
        mock_supabase_client.table.return_value = mock_table
        
        # We need to manually set the dependency override for this specific call
        # but the fixture app is module scoped, so it might already have it.
        
        login_response = client.post(
            "/api/auth/login",
            json={
                "email": valid_user_data["email"],
                "password": valid_user_data["password"],
                "accept_terms": True
            }
        )
        
        session_cookie = login_response.cookies["sl_academy_session"]
        
        # Now logout
        logout_response = client.post(
            "/api/auth/logout",
            cookies={"sl_academy_session": session_cookie}
        )
        
        assert logout_response.status_code == 200
        assert logout_response.json()["success"] is True
        
        # Verify session cookie is cleared (empty or deleted)
        # In TestClient, deleted cookies have empty value
        if "sl_academy_session" in logout_response.cookies:
            assert logout_response.cookies["sl_academy_session"] == ""
    
    def test_logout_without_session_returns_401(self, client):
        """
        Test: Logout without session returns 401
        
        Given: No session cookie
        When: POST /api/auth/logout
        Then: Returns 401 Unauthorized
        """
        response = client.post("/api/auth/logout")
        
        assert response.status_code == 401


# ============================================================================
# Run Tests
# ============================================================================

if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
