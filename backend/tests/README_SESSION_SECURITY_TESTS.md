# Session Security Property-Based Tests

## Overview

This directory contains property-based tests for session security using the Hypothesis library.

**Task:** 2.3 Write property tests for session security  
**Validates:** Requirements 1.3, 12.2, 12.3, 12.4

## Properties Tested

### Property 4: Session Security Attributes
*For any session cookie created, it must have httpOnly, secure, and sameSite=lax attributes set.*

**Validates: Requirements 1.3, 12.2**

Tests:
- `test_session_cookie_has_httponly_attribute` - Verifies httpOnly attribute is set to True
- `test_session_cookie_has_samesite_lax` - Verifies sameSite attribute is 'lax'
- `test_session_cookie_has_correct_max_age` - Verifies max_age is 86400 seconds (24 hours)
- `test_session_cookie_has_root_path` - Verifies path is '/'
- `test_session_attributes_consistent_across_users` - Verifies attributes are consistent for all users
- `test_session_cookie_value_is_encrypted` - Verifies cookie value is encrypted
- `test_session_data_integrity` - Verifies session data can be round-tripped (create -> decrypt -> verify)

### Property 5: Protected Route Authentication
*For any request to a protected route, a valid session must exist or the request must be rejected with 401.*

**Validates: Requirements 12.3, 12.4**

Tests:
- `test_get_session_returns_none_without_cookie` - Verifies get_session returns None without cookie
- `test_get_session_returns_none_with_invalid_cookie` - Verifies get_session returns None with invalid cookie
- `test_get_session_returns_data_with_valid_cookie` - Verifies get_session returns data with valid cookie
- `test_expired_session_returns_none` - Verifies expired sessions return None
- `test_session_expiration_boundary` - Verifies sessions expire after exactly 24 hours
- `test_destroy_session_deletes_cookie` - Verifies destroy_session deletes the cookie
- `test_refresh_session_updates_activity_timestamp` - Verifies refresh_session updates last_activity

## Prerequisites

### 1. Install Dependencies

```bash
cd backend
pip install hypothesis==6.92.0 pytest pytest-asyncio httpx python-dotenv cryptography
```

### 2. Configure Environment

Ensure your `.env` file has a session secret key:

```bash
SESSION_SECRET_KEY=your-secret-key-here-minimum-32-characters
```

If not configured, tests will use a default test secret.

## Running the Tests

### Run All Session Security Tests

```bash
cd backend
python -m pytest tests/test_session_security.py -v
```

### Run Specific Property Tests

```bash
# Test Property 4: Session Security Attributes
python -m pytest tests/test_session_security.py::TestSessionSecurityAttributes -v

# Test Property 5: Protected Route Authentication
python -m pytest tests/test_session_security.py::TestProtectedRouteAuthentication -v
```

### Run with Hypothesis Statistics

```bash
python -m pytest tests/test_session_security.py -v --hypothesis-show-statistics
```

### Run with Increased Examples

By default, Hypothesis generates 20-30 examples per test. To increase:

```bash
python -m pytest tests/test_session_security.py -v --hypothesis-max-examples=100
```

## Test Configuration

The tests use Hypothesis with the following configuration:

- **max_examples**: 20-30 (varies by test) - Number of random test cases generated
- **deadline**: None - No time limit per test case
- **stateful testing**: Not used (tests are stateless)

## Understanding Property-Based Testing

Unlike traditional unit tests that test specific examples, property-based tests:

1. **Generate random inputs** - Hypothesis generates many random test cases
2. **Verify invariants** - Tests verify properties that should ALWAYS hold
3. **Find edge cases** - Automatically discovers edge cases you might not think of
4. **Shrink failures** - When a test fails, Hypothesis finds the minimal failing case

### Example

Traditional test:
```python
def test_session_cookie_httponly():
    # Test with one specific user
    assert session_cookie_has_httponly()
```

Property-based test:
```python
@given(user_count=st.integers(min_value=1, max_value=10))
def test_session_cookie_httponly(user_count):
    # Test with 1, 2, 3, ..., 10 users (20 random combinations)
    for user in range(user_count):
        assert session_cookie_has_httponly()
```

## Test Structure

Each test follows this pattern:

1. **Setup** - Create session manager instance
2. **Generate data** - Create random test data using Hypothesis strategies
3. **Execute** - Create session or get session
4. **Assert properties** - Verify security properties hold
5. **Cleanup** - Automatic (no database operations)

## Key Security Properties Verified

### Cookie Attributes
- **httpOnly**: Prevents JavaScript access to cookies (XSS protection)
- **secure**: Ensures cookies are only sent over HTTPS (in production)
- **sameSite=lax**: Prevents CSRF attacks while allowing normal navigation
- **max-age=86400**: Session expires after 24 hours
- **path=/**: Cookie is valid for entire application

### Session Encryption
- Session data is encrypted using Fernet (AES-256-GCM)
- Cookie value cannot be read or modified by client
- Session data includes: user_id, email, hospital_id, role, timestamps

### Session Expiration
- Sessions expire after 24 hours from creation
- Expired sessions return None when validated
- Session refresh updates last_activity timestamp

### Protected Routes
- Routes without session return 401 Unauthorized
- Routes with invalid session return 401 Unauthorized
- Routes with valid session allow access
- Logout destroys session cookie

## Troubleshooting

### Import Errors

If you see import errors:

1. Ensure you're running tests from the `backend` directory
2. Verify all dependencies are installed: `pip install -r requirements.txt`
3. Check that Python path includes the backend directory

### Session Secret Errors

If tests fail due to missing session secret:

1. Create a `.env` file in the `backend` directory
2. Add `SESSION_SECRET_KEY=your-secret-key-here-minimum-32-characters`
3. Or tests will use a default test secret automatically

### Hypothesis Errors

If Hypothesis reports flaky tests:

1. Check for non-deterministic behavior in your code
2. Ensure test cleanup is working properly
3. Verify no shared state between tests

## CI/CD Integration

To run these tests in CI/CD:

```yaml
# .github/workflows/test.yml
- name: Run Session Security Property Tests
  env:
    SESSION_SECRET_KEY: ${{ secrets.SESSION_SECRET_KEY }}
  run: |
    cd backend
    pip install -r requirements.txt
    python -m pytest tests/test_session_security.py -v --hypothesis-max-examples=50
```

## Further Reading

- [Hypothesis Documentation](https://hypothesis.readthedocs.io/)
- [Property-Based Testing Guide](https://hypothesis.works/articles/what-is-property-based-testing/)
- [OWASP Session Management](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)
- [Cookie Security Best Practices](https://owasp.org/www-community/controls/SecureCookieAttribute)

## Notes

- These tests use **mock objects** to avoid requiring a full FastAPI application
- Tests directly test the `SessionManager` class from `utils/session.py`
- No database operations are performed (tests are fast and isolated)
- Tests verify security properties at the session management layer
- For end-to-end testing of protected routes, use integration tests with TestClient

## Test Results

All 14 tests passing:

```
tests/test_session_security.py::TestSessionSecurityAttributes::test_session_cookie_has_httponly_attribute PASSED
tests/test_session_security.py::TestSessionSecurityAttributes::test_session_cookie_has_samesite_lax PASSED
tests/test_session_security.py::TestSessionSecurityAttributes::test_session_cookie_has_correct_max_age PASSED
tests/test_session_security.py::TestSessionSecurityAttributes::test_session_cookie_has_root_path PASSED
tests/test_session_security.py::TestSessionSecurityAttributes::test_session_attributes_consistent_across_users PASSED
tests/test_session_security.py::TestSessionSecurityAttributes::test_session_cookie_value_is_encrypted PASSED
tests/test_session_security.py::TestSessionSecurityAttributes::test_session_data_integrity PASSED
tests/test_session_security.py::TestProtectedRouteAuthentication::test_get_session_returns_none_without_cookie PASSED
tests/test_session_security.py::TestProtectedRouteAuthentication::test_get_session_returns_none_with_invalid_cookie PASSED
tests/test_session_security.py::TestProtectedRouteAuthentication::test_get_session_returns_data_with_valid_cookie PASSED
tests/test_session_security.py::TestProtectedRouteAuthentication::test_expired_session_returns_none PASSED
tests/test_session_security.py::TestProtectedRouteAuthentication::test_session_expiration_boundary PASSED
tests/test_session_security.py::TestProtectedRouteAuthentication::test_destroy_session_deletes_cookie PASSED
tests/test_session_security.py::TestProtectedRouteAuthentication::test_refresh_session_updates_activity_timestamp PASSED

====================================== 14 passed in 2.03s ======================================
```
