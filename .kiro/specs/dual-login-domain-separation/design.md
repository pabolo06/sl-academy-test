# Dual Login Domain Separation — Design do Bugfix

## Overview

O endpoint único `POST /api/auth/login` autentica qualquer role sem validar o domínio de acesso,
permitindo que médicos e gestores se autentiquem pelo mesmo fluxo sem separação de contexto.

A correção é cirúrgica: adicionar dois novos endpoints em `backend/api/routes/auth.py`
(`/login/medico` e `/login/gestor`) que reutilizam a lógica de autenticação existente e
acrescentam validação de role por domínio antes de criar a sessão. O endpoint original
`/login` é mantido para compatibilidade retroativa, mas marcado como depreciado.

## Glossary

- **Bug_Condition (C)**: A condição que dispara o bug — quando um usuário autentica em um
  endpoint de domínio cujo `expected_role` não corresponde ao `role` retornado pelo Supabase
- **Property (P)**: O comportamento correto — autenticação bem-sucedida retorna `redirect_url`
  do domínio correspondente; role incompatível retorna 403 sem criar sessão
- **Preservation**: O comportamento do middleware `require_role`, do `SessionValidationMiddleware`,
  do logout e da estrutura do cookie que não deve ser alterado pela correção
- **login_domain**: O segmento de URL que identifica o domínio de login (`medico` ou `gestor`)
- **expected_role**: O role que o domínio de login exige (`doctor` para `/medico`, `manager` para `/gestor`)
- **redirect_url**: Campo novo na resposta de login que aponta para o frontend do domínio correto
- **session_manager**: Utilitário em `utils/session.py` que cria/destrói o cookie criptografado
- **isBugCondition**: Função pseudocódigo que identifica entradas que disparam o bug

## Bug Details

### Bug Condition

O bug se manifesta quando qualquer usuário autentica via `POST /api/auth/login` — o sistema
não valida se o role do usuário corresponde ao domínio de login pretendido, não rejeita
acessos cruzados entre domínios e não retorna `redirect_url` na resposta.

**Formal Specification:**
```
FUNCTION isBugCondition(input)
  INPUT: input = { credentials, login_domain }
         credentials = { email, password, accept_terms }
         login_domain IN ['medico', 'gestor']
  OUTPUT: boolean

  authenticated_role := authenticate(credentials)  -- role retornado pelo Supabase

  expected_role := IF login_domain == 'medico' THEN 'doctor'
                   ELSE IF login_domain == 'gestor' THEN 'manager'

  -- Bug ocorre quando o role não corresponde ao domínio E o sistema não rejeita
  RETURN authenticated_role != expected_role
         AND session_was_created()

  -- Também ocorre quando role corresponde mas redirect_url não é retornado
  OR (authenticated_role == expected_role AND redirect_url NOT IN response)
END FUNCTION
```

### Examples

- **Doctor em `/login/medico`** → atual: autentica sem `redirect_url` | esperado: autentica e retorna `redirect_url: "http://medico.slacademy.com"`
- **Manager em `/login/gestor`** → atual: autentica sem `redirect_url` | esperado: autentica e retorna `redirect_url: "http://gestor.slacademy.com"`
- **Manager em `/login/medico`** → atual: autentica com sucesso (bug) | esperado: 403 sem criar sessão
- **Doctor em `/login/gestor`** → atual: autentica com sucesso (bug) | esperado: 403 sem criar sessão
- **Credenciais inválidas em qualquer domínio** → atual: 401 | esperado: 401 (comportamento correto, sem regressão)

## Expected Behavior

### Preservation Requirements

**Comportamentos inalterados:**
- Acesso a rotas protegidas por `require_role("doctor")` com sessão válida de doctor continua funcionando
- Acesso a rotas protegidas por `require_role("manager")` com sessão válida de manager continua funcionando
- Usuários sem sessão válida continuam recebendo 401 em rotas protegidas
- Doctor tentando acessar rotas de manager continua recebendo 403
- Logout continua invalidando a sessão corretamente para qualquer role
- O cookie criptografado continua sendo criado com os campos `user_id`, `email`, `hospital_id` e `role`

**Escopo:**
Todas as entradas que NÃO envolvem os novos endpoints de domínio devem ser completamente
inalteradas. Isso inclui:
- O endpoint `/login` original (mantido, apenas depreciado)
- O middleware `SessionValidationMiddleware` (sem alterações)
- A função `require_role` (sem alterações)
- Os endpoints `/logout` e `/me` (sem alterações)

## Hypothesized Root Cause

1. **Ausência de endpoints por domínio**: O router só registra `POST /login` — não existem
   rotas `/login/medico` ou `/login/gestor`, portanto nenhuma validação de domínio é possível

2. **Ausência de validação de role pós-autenticação**: O fluxo atual autentica no Supabase e
   cria a sessão imediatamente, sem checar se o role do perfil corresponde ao domínio pretendido

3. **Ausência do campo `redirect_url` no modelo de resposta**: `LoginResponse` em
   `backend/models/auth.py` não possui o campo `redirect_url`, então mesmo que a lógica
   fosse adicionada, o modelo não suportaria retorná-lo

4. **Middleware não cobre os novos endpoints**: `PUBLIC_ROUTES` em `backend/middleware/auth.py`
   lista apenas `/api/auth/login` — os novos endpoints precisam ser adicionados à lista pública
   para não exigirem sessão antes do login

## Correctness Properties

Property 1: Bug Condition — Validação de Role por Domínio

_For any_ requisição onde `isBugCondition` retorna verdadeiro (role do usuário autenticado
não corresponde ao `expected_role` do domínio de login), o endpoint corrigido SHALL retornar
HTTP 403 sem invocar `session_manager.create_session`, garantindo que nenhuma sessão seja criada.

**Validates: Requirements 2.3, 2.4**

Property 2: Bug Condition — Redirect URL no Login Bem-Sucedido

_For any_ requisição onde o role do usuário corresponde ao `expected_role` do domínio de login
e as credenciais são válidas, o endpoint corrigido SHALL retornar HTTP 200 com o campo
`redirect_url` preenchido com a URL do domínio correto e SHALL invocar `session_manager.create_session`.

**Validates: Requirements 2.1, 2.2**

Property 3: Preservation — Comportamento do Middleware e Proteção de Rotas

_For any_ requisição a rotas protegidas com sessão válida, o sistema corrigido SHALL produzir
exatamente o mesmo resultado que o sistema original — permitindo acesso quando o role bate com
`require_role` e rejeitando com 403 quando não bate — preservando todo o comportamento de
autorização existente.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6**

## Fix Implementation

### Changes Required

**Arquivo 1**: `backend/models/auth.py`

**Alteração**: Adicionar campo `redirect_url` opcional ao `LoginResponse`

```python
class LoginResponse(BaseModel):
    success: bool
    message: str
    user: Optional[dict] = None
    redirect_url: Optional[str] = None  # NOVO
```

---

**Arquivo 2**: `backend/api/routes/auth.py`

**Função**: Adicionar dois novos endpoints e um helper de validação de domínio

**Specific Changes**:

1. **Helper `_domain_login`**: Extrair a lógica comum de login em uma função interna que
   recebe `expected_role: str` e `redirect_url: str` como parâmetros adicionais. Após
   autenticar no Supabase e buscar o perfil, verificar se `profile["role"] == expected_role`.
   Se não corresponder, retornar 403 imediatamente sem chamar `session_manager.create_session`.

2. **Endpoint `POST /login/medico`**: Chama `_domain_login` com
   `expected_role="doctor"` e `redirect_url=settings.doctor_frontend_url`.

3. **Endpoint `POST /login/gestor`**: Chama `_domain_login` com
   `expected_role="manager"` e `redirect_url=settings.manager_frontend_url`.

4. **Endpoint `POST /login` (original)**: Mantido sem alterações para compatibilidade
   retroativa. Adicionar docstring indicando depreciação.

5. **Ordem dos endpoints**: Os novos endpoints `/login/medico` e `/login/gestor` devem ser
   registrados ANTES do endpoint `/login` para evitar conflito de rota no FastAPI.

---

**Arquivo 3**: `backend/core/config.py`

**Alteração**: Adicionar as URLs dos frontends por domínio

```python
doctor_frontend_url: str = Field(
    default="http://localhost:3000", env="DOCTOR_FRONTEND_URL"
)
manager_frontend_url: str = Field(
    default="http://localhost:3001", env="MANAGER_FRONTEND_URL"
)
```

---

**Arquivo 4**: `backend/middleware/auth.py`

**Alteração**: Adicionar os novos endpoints à lista `PUBLIC_ROUTES`

```python
PUBLIC_ROUTES = [
    "/",
    "/health",
    "/docs",
    "/openapi.json",
    "/api/auth/login",
    "/api/auth/login/medico",   # NOVO
    "/api/auth/login/gestor",   # NOVO
]
```

### Pseudocode do Helper `_domain_login`

```
FUNCTION _domain_login(request, response, credentials, db, logger_service,
                        expected_role, redirect_url)

  await check_login_rate_limit(request)

  IF NOT credentials.accept_terms THEN
    RAISE HTTP 400 "You must accept the terms..."
  END IF

  auth_response := db.auth.sign_in_with_password(credentials)

  IF NOT auth_response.user THEN
    await logger_service.log_auth_failure(...)
    RAISE HTTP 401 "Invalid email or password"
  END IF

  profile := db.table("profiles").select(...).eq("id", user.id).single()

  IF NOT profile THEN
    RAISE HTTP 401 "User profile not found"
  END IF

  -- VALIDAÇÃO DE DOMÍNIO (correção do bug)
  IF profile["role"] != expected_role THEN
    RAISE HTTP 403 "Access denied for this login domain"
    -- session_manager.create_session NÃO é chamado
  END IF

  session_manager.create_session(response, user_id, email, hospital_id, role)

  await logger_service.log_auth_success(...)

  RETURN LoginResponse(
    success=True,
    message="Login successful",
    user={...},
    redirect_url=redirect_url   -- NOVO campo
  )
END FUNCTION
```

## Testing Strategy

### Validation Approach

A estratégia segue duas fases: primeiro, executar testes exploratórios no código **não corrigido**
para confirmar o root cause; depois, verificar que a correção satisfaz as propriedades de
fix checking e preservation checking.

### Exploratory Bug Condition Checking

**Goal**: Demonstrar o bug no código não corrigido e confirmar a hipótese de root cause.

**Test Plan**: Simular chamadas HTTP aos endpoints de domínio (que ainda não existem) e ao
endpoint `/login` existente, verificando ausência de validação de role e de `redirect_url`.

**Test Cases**:
1. **Manager em domínio médico**: POST `/api/auth/login` com credenciais de manager — verificar
   que retorna 200 sem `redirect_url` (confirma bug 1.2 e 1.3)
2. **Doctor em domínio gestor**: POST `/api/auth/login` com credenciais de doctor — verificar
   que retorna 200 sem `redirect_url` (confirma bug 1.1 e 1.3)
3. **Ausência dos endpoints**: Verificar que `/login/medico` e `/login/gestor` retornam 404
   (confirma root cause 1 — ausência de endpoints por domínio)

**Expected Counterexamples**:
- Endpoint `/login` retorna 200 para qualquer role válido sem `redirect_url`
- Endpoints `/login/medico` e `/login/gestor` não existem (404)

### Fix Checking

**Goal**: Verificar que para todas as entradas onde `isBugCondition` é verdadeiro, o endpoint
corrigido produz o comportamento esperado.

**Pseudocode:**
```
FOR ALL input WHERE isBugCondition(input) DO
  result := domain_login_fixed(input)
  ASSERT result.status_code == 403
  ASSERT session_was_NOT_created()
END FOR

FOR ALL input WHERE role_matches_domain(input) AND credentials_valid(input) DO
  result := domain_login_fixed(input)
  ASSERT result.status_code == 200
  ASSERT result.body.redirect_url IS NOT NULL
  ASSERT session_was_created()
END FOR
```

### Preservation Checking

**Goal**: Verificar que para todas as entradas onde `isBugCondition` é falso, o sistema
corrigido produz o mesmo resultado que o sistema original.

**Pseudocode:**
```
FOR ALL input WHERE NOT isBugCondition(input) DO
  ASSERT original_system(input) == fixed_system(input)
END FOR
```

**Testing Approach**: Property-based testing com Hypothesis é recomendado para preservation
checking porque:
- Gera automaticamente muitos casos de teste no domínio de entrada
- Captura edge cases que testes unitários manuais podem perder
- Fornece garantias fortes de que o comportamento é inalterado para entradas não-bugadas

**Test Cases**:
1. **Preservação do middleware**: Gerar sessões válidas de doctor e manager e verificar que
   `require_role` continua aceitando/rejeitando corretamente após a correção
2. **Preservação do logout**: Verificar que logout invalida sessão independente do role
3. **Preservação do cookie**: Verificar que os campos `user_id`, `email`, `hospital_id`, `role`
   continuam presentes no cookie após login pelos novos endpoints

### Unit Tests

- Testar `_domain_login` com role correto → espera 200 + `redirect_url`
- Testar `_domain_login` com role incorreto → espera 403 sem criar sessão
- Testar credenciais inválidas em `/login/medico` e `/login/gestor` → espera 401
- Testar `accept_terms=False` nos novos endpoints → espera 400
- Testar que `/login` original continua funcionando sem alteração de comportamento

### Property-Based Tests (Hypothesis)

```python
# Property 1 — Validação de role por domínio
@given(
    role=st.sampled_from(["doctor", "manager"]),
    domain=st.sampled_from(["medico", "gestor"])
)
def test_domain_role_mismatch_returns_403(role, domain):
    """
    Para qualquer combinação onde role não corresponde ao domínio,
    o endpoint deve retornar 403 sem criar sessão.
    """
    expected_role = "doctor" if domain == "medico" else "manager"
    assume(role != expected_role)
    # Mockar Supabase retornando `role` para as credenciais
    response = client.post(f"/api/auth/login/{domain}", json=valid_credentials)
    assert response.status_code == 403
    assert "Set-Cookie" not in response.headers

# Property 2 — Redirect URL no login bem-sucedido
@given(domain=st.sampled_from(["medico", "gestor"]))
def test_matching_role_returns_redirect_url(domain):
    """
    Para qualquer domínio com role correspondente e credenciais válidas,
    a resposta deve conter redirect_url não nulo.
    """
    role = "doctor" if domain == "medico" else "manager"
    # Mockar Supabase retornando `role` correto
    response = client.post(f"/api/auth/login/{domain}", json=valid_credentials)
    assert response.status_code == 200
    assert response.json()["redirect_url"] is not None

# Property 3 — Preservação do require_role
@given(
    session_role=st.sampled_from(["doctor", "manager"]),
    required_role=st.sampled_from(["doctor", "manager"])
)
def test_require_role_preservation(session_role, required_role):
    """
    Para qualquer combinação de session_role e required_role,
    o middleware deve se comportar identicamente ao sistema original.
    """
    expected_status = 200 if session_role == required_role else 403
    response = make_request_with_session(session_role, required_role)
    assert response.status_code == expected_status
```

### Integration Tests

- Fluxo completo: doctor faz login em `/login/medico` → acessa rota protegida → faz logout
- Fluxo completo: manager faz login em `/login/gestor` → acessa rota de admin → faz logout
- Tentativa cruzada: manager tenta `/login/medico` → recebe 403 → verifica que nenhuma sessão foi criada
- Tentativa cruzada: doctor tenta `/login/gestor` → recebe 403 → verifica que nenhuma sessão foi criada
- Compatibilidade retroativa: endpoint `/login` original continua retornando 200 para ambos os roles
