"""
Bug Condition Exploration Test — Dual Login Domain Separation

**Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5**

OBJETIVO: Expor contraexemplos que demonstram o bug no código atual (não corrigido).

Este teste DEVE FALHAR no código não corrigido — a falha confirma que o bug existe.
NÃO tente corrigir o teste ou o código quando ele falhar.

Bug Condition (isBugCondition):
  - Endpoints /login/medico e /login/gestor não existem (404) → root cause 1
  - POST /login com credenciais de manager retorna 200 sem redirect_url → bugs 1.2 e 1.3
  - POST /login com credenciais de doctor retorna 200 sem redirect_url → bugs 1.1 e 1.3
"""

import pytest
import sys
from pathlib import Path
from unittest.mock import Mock, MagicMock, AsyncMock
from uuid import uuid4
from datetime import datetime

from starlette.middleware.base import BaseHTTPMiddleware
from fastapi.testclient import TestClient
from fastapi import FastAPI

# Add backend directory to path
backend_dir = Path(__file__).parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from dotenv import load_dotenv
env_file = backend_dir / ".env"
if env_file.exists():
    load_dotenv(env_file)


# ============================================================================
# Fixtures
# ============================================================================

class MockClientHostMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        if request.scope.get("client") is None:
            request.scope["client"] = ("127.0.0.1", 12345)
        return await call_next(request)


@pytest.fixture(scope="module")
def app():
    from api.routes import auth
    from core.database import get_db

    test_app = FastAPI()
    test_app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
    test_app.add_middleware(MockClientHostMiddleware)

    mock_db = MagicMock()
    mock_audit = MagicMock()
    test_app.dependency_overrides[get_db] = lambda: mock_db
    test_app.dependency_overrides[auth.audit_logger] = lambda: mock_audit

    return test_app


@pytest.fixture(scope="module")
def client(app):
    return TestClient(app, base_url="http://testserver")


@pytest.fixture(autouse=True)
def reset_rate_limiter():
    from utils.rate_limiter import rate_limiter
    rate_limiter._requests.clear()
    yield
    rate_limiter._requests.clear()


def _make_mock_db(role: str) -> MagicMock:
    """Build a mock Supabase client that returns a user with the given role."""
    user_id = str(uuid4())
    hospital_id = str(uuid4())
    email = f"{role}@hospital.com"

    mock_db = MagicMock()

    # Auth response
    mock_auth_resp = Mock()
    mock_auth_resp.user = Mock()
    mock_auth_resp.user.id = user_id
    mock_auth_resp.user.email = email
    mock_db.auth.sign_in_with_password.return_value = mock_auth_resp

    # Profile response
    mock_profile_resp = Mock()
    mock_profile_resp.data = {
        "id": user_id,
        "hospital_id": hospital_id,
        "role": role,
        "consent_timestamp": datetime.utcnow().isoformat(),
        "hospitals": {"name": "Test Hospital"},
    }

    mock_table = Mock()
    mock_table.select.return_value = mock_table
    mock_table.eq.return_value = mock_table
    mock_table.is_.return_value = mock_table
    mock_table.single.return_value = mock_table
    mock_table.update.return_value = mock_table
    mock_table.execute.return_value = mock_profile_resp
    mock_db.table.return_value = mock_table

    return mock_db


VALID_CREDENTIALS = {
    "email": "user@hospital.com",
    "password": "SecurePass123!",
    "accept_terms": True,
}


# ============================================================================
# Bug Condition Tests — EXPECTED TO FAIL on unfixed code
# ============================================================================

class TestBugConditionDualLoginDomainSeparation:
    """
    Testes exploratórios de bug condition.

    Cada teste codifica o comportamento ESPERADO (correto).
    No código não corrigido, esses testes FALHAM — confirmando o bug.
    Após a correção, esses testes PASSAM — confirmando o fix.
    """

    # ------------------------------------------------------------------
    # Root Cause 1 — Ausência dos endpoints por domínio
    # ------------------------------------------------------------------

    def test_endpoint_login_medico_exists(self, client):
        """
        Bug 1.4 / Root Cause 1:
        POST /api/auth/login/medico deve existir.
        No código não corrigido retorna 404 — confirma ausência do endpoint.

        Counterexample esperado: status_code == 404 (endpoint não registrado)
        """
        response = client.post("/api/auth/login/medico", json=VALID_CREDENTIALS)
        # EXPECTED (correto): 200 ou 401/403 — qualquer coisa que não seja 404
        # ATUAL (bug): 404 — endpoint não existe
        assert response.status_code != 404, (
            f"COUNTEREXAMPLE — /login/medico retornou 404: endpoint não existe. "
            f"Root cause 1 confirmado: router só registra POST /login."
        )

    def test_endpoint_login_gestor_exists(self, client):
        """
        Bug 1.5 / Root Cause 1:
        POST /api/auth/login/gestor deve existir.
        No código não corrigido retorna 404 — confirma ausência do endpoint.

        Counterexample esperado: status_code == 404 (endpoint não registrado)
        """
        response = client.post("/api/auth/login/gestor", json=VALID_CREDENTIALS)
        # EXPECTED (correto): 200 ou 401/403 — qualquer coisa que não seja 404
        # ATUAL (bug): 404 — endpoint não existe
        assert response.status_code != 404, (
            f"COUNTEREXAMPLE — /login/gestor retornou 404: endpoint não existe. "
            f"Root cause 1 confirmado: router só registra POST /login."
        )

    # ------------------------------------------------------------------
    # Bugs 1.2 + 1.3 — Manager autentica sem redirect_url
    # ------------------------------------------------------------------

    def test_manager_login_returns_redirect_url(self, app, client):
        """
        Bugs 1.2 e 1.3:
        POST /api/auth/login com credenciais de manager deve retornar redirect_url.
        No código não corrigido retorna 200 sem redirect_url.

        Counterexample esperado: response.json() não contém 'redirect_url'
        """
        from core.database import get_db

        mock_db = _make_mock_db("manager")
        app.dependency_overrides[get_db] = lambda: mock_db

        response = client.post("/api/auth/login", json=VALID_CREDENTIALS)

        assert response.status_code == 200, (
            f"Login de manager falhou inesperadamente: {response.status_code} — {response.text}"
        )

        body = response.json()
        # EXPECTED (correto): redirect_url presente e não nulo
        # ATUAL (bug): redirect_url ausente do modelo LoginResponse
        assert "redirect_url" in body and body["redirect_url"] is not None, (
            f"COUNTEREXAMPLE — Manager autenticou (200) mas redirect_url ausente na resposta. "
            f"Bugs 1.2 e 1.3 confirmados. Resposta recebida: {body}"
        )

    # ------------------------------------------------------------------
    # Bugs 1.1 + 1.3 — Doctor autentica sem redirect_url
    # ------------------------------------------------------------------

    def test_doctor_login_returns_redirect_url(self, app, client):
        """
        Bugs 1.1 e 1.3:
        POST /api/auth/login com credenciais de doctor deve retornar redirect_url.
        No código não corrigido retorna 200 sem redirect_url.

        Counterexample esperado: response.json() não contém 'redirect_url'
        """
        from core.database import get_db

        mock_db = _make_mock_db("doctor")
        app.dependency_overrides[get_db] = lambda: mock_db

        response = client.post("/api/auth/login", json=VALID_CREDENTIALS)

        assert response.status_code == 200, (
            f"Login de doctor falhou inesperadamente: {response.status_code} — {response.text}"
        )

        body = response.json()
        # EXPECTED (correto): redirect_url presente e não nulo
        # ATUAL (bug): redirect_url ausente do modelo LoginResponse
        assert "redirect_url" in body and body["redirect_url"] is not None, (
            f"COUNTEREXAMPLE — Doctor autenticou (200) mas redirect_url ausente na resposta. "
            f"Bugs 1.1 e 1.3 confirmados. Resposta recebida: {body}"
        )
