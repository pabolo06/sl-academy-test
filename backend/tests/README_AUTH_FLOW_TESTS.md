# Authentication Flow Unit Tests

## Overview

This directory contains comprehensive unit tests for the authentication flow of the SL Academy Platform.

**Task:** 2.6 Write unit tests for authentication flow  
**Validates:** Requirements 1.1, 1.2, 1.4, 1.6

## Test Coverage

### Test 1: Successful Login with Valid Credentials
*WHEN a user provides valid email and password credentials, THE System SHALL create an encrypted session and return a user profile*

**Validates: Requirement 1.1**

Tests:
- `test_login_with_valid_credentials_returns_200` - Verifies successful login returns 200 OK with user data
- `test_login_sets_session_cookie` - Verifies encrypted session cookie is set with correct data
- `test_login_without_consent_returns_400` - Verifies login requires accepting terms and conditions

### Test 2: Failed Login with Invalid Credentials
*WHEN a user provides invalid credentials, THE System SHALL reject the login attempt and return an error message*

**Validates: Requirement 1.2**

Tests:
- `test_login_with_invalid_password_returns_401` - Verifies wrong password returns 401 Unauthorized
- `test_login_with_invalid_email_returns_401` - Verifies non-existent email returns 401 Unauthorized
- `test_login_logs_failed_attempt` - Verifies failed attempts are logged for audit

### Test 3: Session Expiration After 24 Hours
*WHEN a user's session exceeds 24 hours of inactivity, THE System SHALL expire the session*

**Validates: Requirement 1.4**

Tests:
- `test_expired_session_returns_401_on_protected_route` - Verifies expired sessions (25 hours old) return 401
- `test_valid_session_within_24_hours_allows_access` - Verifies sessions within 24 hours allow access
- `test_session_expiration_boundary_at_24_hours` - Verifies sessions expire exactly at 24 hour boundary

### Test 4: Rate Limiting Enforcement
*WHEN a user attempts more than 5 failed login attempts within 15 minutes, THE System SHALL temporarily lock the account*

**Validates: Requirement 1.6**

Tests:
- `test_rate_limit_allows_5_attempts` - Verifies first 5 attempts are allowed
- `test_rate_limit_blocks_6th_attempt` - Verifies 6th attempt returns 429 Too Many Requests
- `test_rate_limit_includes_retry_after_header` - Verifies Retry-After header is included
- `test_rate_limit_is_per_ip_address` - Verifies rate limiting is applied per IP address

### Test 5: Logout Functionality
*WHEN a user logs out, THE System SHALL destroy the session and clear the session cookie*

**Validates: Requirement 1.5**

Tests:
- `test_logout_destroys_session` - Verifies logout clears session cookie
- `test_logout_without_session_returns_401` - Verifies logout requires valid session

## Prerequisites

### 1. Install Dependencies

```bash
cd backend
pip install pytest pytest-asyncio httpx python-dotenv cryptography
```

**Note:** If you encounter a `ModuleNotFoundError: No module named 'pyiceberg'` error, this is due to a recent supabase library update that requires the pyiceberg package. To install it:

```bash
# On Windows, you may need Microsoft Visual C++ 14.0 or greater
# Download from: https://visualstudio.microsoft.com/visual-cpp-build-tools/

pip install pyiceberg
```

Alternatively, you can downgrade the supabase library to a version that doesn't require pyiceberg:

```bash
pip install supabase==2.3.0
```

### 2. Configure Environment

Ensure your `.env` file has the required configuration:

```bash
SESSION_SECRET_KEY=your-secret-key-here-minimum-32-characters
SUPABASE_URL=your-supabase-url
SUPABASE_KEY=your-supabase-key
```

## Running the Tests

### Run All Authentication Flow Tests

```bash
cd backend
python -m pytest tests/test_auth_flow.py -v
```

### Run Specific Test Classes

```bash
# Test successful login
python -m pytest tests/test_auth_flow.py::TestSuccessfulLogin -v

# Test failed login
python -m pytest tests/test_auth_flow.py::TestFailedLogin -v

# Test session expiration
python -m pytest tests/test_auth_flow.py::TestSessionExpiration -v

# Test rate limiting
python -m pytest tests/test_auth_flow.py::TestRateLimiting -v

# Test logout
python -m pytest tests/test_auth_flow.py::TestLogout -v
```

### Run with Coverage Report

```bash
python -m pytest tests/test_auth_flow.py -v --cov=api.routes.auth --cov=utils.session --cov=utils.rate_limiter --cov-report=html
```

### Run with Detailed Output

```bash
python -m pytest tests/test_auth_flow.py -v -s
```

## Test Architecture

### Mocking Strategy

These tests use mocking to isolate the authentication logic from external dependencies:

1. **Supabase Client** - Mocked to avoid real database calls
2. **Audit Logger** - Mocked to avoid logging during tests
3. **Rate Limiter** - Reset before each test to ensure isolation

### Test Fixtures

- `app` - FastAPI application instance
- `client` - TestClient for making HTTP requests
- `mock_supabase_client` - Mock Supabase client with auth and table operations
- `valid_user_data` - Sample valid user data for testing
- `session_secret` - Session encryption secret
- `reset_rate_limiter` - Auto-used fixture to reset rate limiter between tests

### Helper Functions

- `decrypt_session_cookie(cookie_value, secret_key)` - Decrypts and parses session cookies
- `create_expired_session_cookie(user_data, secret_key, hours_old)` - Creates expired session cookies for testing

## Test Patterns

### Successful Login Test Pattern

```python
@patch('api.routes.auth.get_db')
@patch('api.routes.auth.audit_logger')
def test_login_success(mock_audit_logger, mock_get_db, client, mock_supabase_client):
    # Setup mocks
    mock_get_db.return_value = mock_supabase_client
    mock_supabase_client.auth.sign_in_with_password.return_value = mock_auth_response
    
    # Execute login
    response = client.post("/api/auth/login", json={...})
    
    # Assert success
    assert response.status_code == 200
    assert "sl_academy_session" in response.cookies
```

### Failed Login Test Pattern

```python
@patch('api.routes.auth.get_db')
def test_login_failure(mock_get_db, client, mock_supabase_client):
    # Setup mock to return no user
    mock_auth_response.user = None
    
    # Execute login
    response = client.post("/api/auth/login", json={...})
    
    # Assert failure
    assert response.status_code == 401
    assert "sl_academy_session" not in response.cookies
```

### Session Expiration Test Pattern

```python
def test_session_expiration(client, valid_user_data, session_secret):
    # Create expired session cookie
    expired_cookie = create_expired_session_cookie(valid_user_data, session_secret, hours_old=25)
    
    # Try to access protected route
    response = client.get("/api/auth/me", cookies={"sl_academy_session": expired_cookie})
    
    # Assert rejection
    assert response.status_code == 401
```

### Rate Limiting Test Pattern

```python
@patch('api.routes.auth.get_db')
def test_rate_limiting(mock_get_db, client, mock_supabase_client):
    # Make 5 attempts (allowed)
    for i in range(5):
        response = client.post("/api/auth/login", json={...})
        assert response.status_code == 401  # Invalid credentials, not rate limited
    
    # 6th attempt (blocked)
    response = client.post("/api/auth/login", json={...})
    assert response.status_code == 429  # Rate limited
```

## Key Security Properties Verified

### Authentication Security
- Valid credentials create encrypted session
- Invalid credentials return 401 without session
- Failed attempts are logged for audit
- Consent to terms is required

### Session Security
- Sessions are encrypted using Fernet (AES-256-GCM)
- Session cookies have httpOnly, secure, sameSite=lax attributes
- Sessions expire after exactly 24 hours
- Expired sessions are rejected with 401

### Rate Limiting
- First 5 login attempts are allowed
- 6th attempt within 15 minutes is blocked with 429
- Rate limiting is applied per IP address
- Retry-After header indicates wait time

### Logout Security
- Logout destroys session cookie
- Logout requires valid session
- After logout, session cannot be reused

## Troubleshooting

### Import Errors

If you see import errors:

1. Ensure you're running tests from the `backend` directory
2. Verify all dependencies are installed: `pip install -r requirements.txt`
3. Check that Python path includes the backend directory

### Mock Errors

If mocks are not working:

1. Verify patch paths match actual import paths in the code
2. Check that mock return values match expected types
3. Ensure fixtures are properly injected

### Rate Limiter Errors

If rate limiter tests fail:

1. Verify `reset_rate_limiter` fixture is auto-used
2. Check that rate limiter is properly cleared between tests
3. Ensure no parallel test execution (use `-n 1` flag)

### Session Cookie Errors

If session cookie tests fail:

1. Verify SESSION_SECRET_KEY is set in environment
2. Check that Fernet encryption/decryption is working
3. Ensure datetime handling is consistent (UTC)

## CI/CD Integration

To run these tests in CI/CD:

```yaml
# .github/workflows/test.yml
- name: Run Authentication Flow Tests
  env:
    SESSION_SECRET_KEY: ${{ secrets.SESSION_SECRET_KEY }}
    SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
    SUPABASE_KEY: ${{ secrets.SUPABASE_KEY }}
  run: |
    cd backend
    pip install -r requirements.txt
    python -m pytest tests/test_auth_flow.py -v --cov=api.routes.auth --cov-report=xml
```

## Test Isolation

These tests are designed to be:

- **Fast** - No real database or network calls (all mocked)
- **Isolated** - Each test is independent and can run in any order
- **Deterministic** - Same inputs always produce same outputs
- **Comprehensive** - Cover all authentication requirements

## Coverage Goals

Target coverage for authentication flow:

- `api/routes/auth.py` - 90%+ coverage
- `utils/session.py` - 90%+ coverage
- `utils/rate_limiter.py` - 85%+ coverage
- `middleware/auth.py` - 80%+ coverage

## Further Reading

- [FastAPI Testing Documentation](https://fastapi.tiangolo.com/tutorial/testing/)
- [Pytest Documentation](https://docs.pytest.org/)
- [Python Mock Documentation](https://docs.python.org/3/library/unittest.mock.html)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [Session Management Best Practices](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)

## Notes

- These tests use **mock objects** to avoid requiring a real Supabase instance
- Tests directly test the authentication routes and session management
- No real database operations are performed (tests are fast and isolated)
- Tests verify security properties at the API endpoint layer
- For property-based testing of session security, see `test_session_security.py`

## Expected Test Results

All 15 tests should pass:

```
tests/test_auth_flow.py::TestSuccessfulLogin::test_login_with_valid_credentials_returns_200 PASSED
tests/test_auth_flow.py::TestSuccessfulLogin::test_login_sets_session_cookie PASSED
tests/test_auth_flow.py::TestSuccessfulLogin::test_login_without_consent_returns_400 PASSED
tests/test_auth_flow.py::TestFailedLogin::test_login_with_invalid_password_returns_401 PASSED
tests/test_auth_flow.py::TestFailedLogin::test_login_with_invalid_email_returns_401 PASSED
tests/test_auth_flow.py::TestFailedLogin::test_login_logs_failed_attempt PASSED
tests/test_auth_flow.py::TestSessionExpiration::test_expired_session_returns_401_on_protected_route PASSED
tests/test_auth_flow.py::TestSessionExpiration::test_valid_session_within_24_hours_allows_access PASSED
tests/test_auth_flow.py::TestSessionExpiration::test_session_expiration_boundary_at_24_hours PASSED
tests/test_auth_flow.py::TestRateLimiting::test_rate_limit_allows_5_attempts PASSED
tests/test_auth_flow.py::TestRateLimiting::test_rate_limit_blocks_6th_attempt PASSED
tests/test_auth_flow.py::TestRateLimiting::test_rate_limit_includes_retry_after_header PASSED
tests/test_auth_flow.py::TestRateLimiting::test_rate_limit_is_per_ip_address PASSED
tests/test_auth_flow.py::TestLogout::test_logout_destroys_session PASSED
tests/test_auth_flow.py::TestLogout::test_logout_without_session_returns_401 PASSED

====================================== 15 passed ======================================
```
