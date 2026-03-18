"""
Script de teste manual para verificar os novos endpoints de login por domínio.
"""
import sys
from pathlib import Path

# Add backend to path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

from fastapi.testclient import TestClient
from unittest.mock import MagicMock, Mock
from uuid import uuid4
from datetime import datetime

# Import app
from main import app
from core.database import get_db
from api.routes import auth

# Create test client
client = TestClient(app)

# Mock database
def _make_mock_db(role: str):
    """Create mock Supabase client for testing."""
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

# Test credentials
CREDENTIALS = {
    "email": "test@hospital.com",
    "password": "SecurePass123!",
    "accept_terms": True
}

print("=" * 70)
print("TESTES MANUAIS - DUAL LOGIN DOMAIN SEPARATION")
print("=" * 70)

# Test 1: Endpoint /login/medico exists
print("\n[TEST 1] Verificando se endpoint /login/medico existe...")
response = client.post("/api/auth/login/medico", json=CREDENTIALS)
print(f"Status: {response.status_code}")
if response.status_code == 404:
    print("❌ FALHOU: Endpoint não existe")
else:
    print("✅ PASSOU: Endpoint existe")

# Test 2: Endpoint /login/gestor exists
print("\n[TEST 2] Verificando se endpoint /login/gestor existe...")
response = client.post("/api/auth/login/gestor", json=CREDENTIALS)
print(f"Status: {response.status_code}")
if response.status_code == 404:
    print("❌ FALHOU: Endpoint não existe")
else:
    print("✅ PASSOU: Endpoint existe")

# Test 3: Doctor login via /login/medico with correct role
print("\n[TEST 3] Doctor fazendo login em /login/medico (role correto)...")
mock_db = _make_mock_db("doctor")
app.dependency_overrides[get_db] = lambda: mock_db
app.dependency_overrides[auth.audit_logger] = lambda: MagicMock()

response = client.post("/api/auth/login/medico", json=CREDENTIALS)
print(f"Status: {response.status_code}")
if response.status_code == 200:
    body = response.json()
    print(f"Response: {body}")
    if "redirect_url" in body and body["redirect_url"]:
        print(f"✅ PASSOU: redirect_url presente = {body['redirect_url']}")
    else:
        print("❌ FALHOU: redirect_url ausente ou nulo")
else:
    print(f"❌ FALHOU: Status esperado 200, recebido {response.status_code}")

# Test 4: Manager login via /login/medico (wrong role - should fail)
print("\n[TEST 4] Manager tentando login em /login/medico (role errado)...")
mock_db = _make_mock_db("manager")
app.dependency_overrides[get_db] = lambda: mock_db

response = client.post("/api/auth/login/medico", json=CREDENTIALS)
print(f"Status: {response.status_code}")
if response.status_code == 403:
    print("✅ PASSOU: Acesso negado corretamente (403)")
else:
    print(f"❌ FALHOU: Status esperado 403, recebido {response.status_code}")

# Test 5: Manager login via /login/gestor (correct role)
print("\n[TEST 5] Manager fazendo login em /login/gestor (role correto)...")
mock_db = _make_mock_db("manager")
app.dependency_overrides[get_db] = lambda: mock_db

response = client.post("/api/auth/login/gestor", json=CREDENTIALS)
print(f"Status: {response.status_code}")
if response.status_code == 200:
    body = response.json()
    print(f"Response: {body}")
    if "redirect_url" in body and body["redirect_url"]:
        print(f"✅ PASSOU: redirect_url presente = {body['redirect_url']}")
    else:
        print("❌ FALHOU: redirect_url ausente ou nulo")
else:
    print(f"❌ FALHOU: Status esperado 200, recebido {response.status_code}")

# Test 6: Doctor login via /login/gestor (wrong role - should fail)
print("\n[TEST 6] Doctor tentando login em /login/gestor (role errado)...")
mock_db = _make_mock_db("doctor")
app.dependency_overrides[get_db] = lambda: mock_db

response = client.post("/api/auth/login/gestor", json=CREDENTIALS)
print(f"Status: {response.status_code}")
if response.status_code == 403:
    print("✅ PASSOU: Acesso negado corretamente (403)")
else:
    print(f"❌ FALHOU: Status esperado 403, recebido {response.status_code}")

# Test 7: Original /login endpoint still works (backward compatibility)
print("\n[TEST 7] Endpoint /login original (compatibilidade retroativa)...")
mock_db = _make_mock_db("doctor")
app.dependency_overrides[get_db] = lambda: mock_db

response = client.post("/api/auth/login", json=CREDENTIALS)
print(f"Status: {response.status_code}")
if response.status_code == 200:
    body = response.json()
    print(f"Response: {body}")
    if "redirect_url" in body and body["redirect_url"]:
        print(f"✅ PASSOU: redirect_url presente = {body['redirect_url']}")
    else:
        print("⚠️  AVISO: redirect_url ausente (esperado para endpoint legado)")
else:
    print(f"❌ FALHOU: Status esperado 200, recebido {response.status_code}")

print("\n" + "=" * 70)
print("TESTES CONCLUÍDOS")
print("=" * 70)
