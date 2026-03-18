# Plano de Implementação

- [x] 1. Escrever teste exploratório de bug condition
  - **Property 1: Bug Condition** - Ausência de Separação por Domínio de Login
  - **CRÍTICO**: Este teste DEVE FALHAR no código não corrigido — a falha confirma que o bug existe
  - **NÃO tente corrigir o teste ou o código quando ele falhar**
  - **NOTA**: Este teste codifica o comportamento esperado — ele validará a correção quando passar após a implementação
  - **OBJETIVO**: Expor contraexemplos que demonstram o bug no código atual
  - **Abordagem PBT Escopada**: Para bugs determinísticos, escopar a propriedade aos casos concretos de falha para garantir reprodutibilidade
  - Verificar que `POST /api/auth/login/medico` retorna 404 (endpoint não existe — confirma root cause 1)
  - Verificar que `POST /api/auth/login/gestor` retorna 404 (endpoint não existe — confirma root cause 1)
  - Verificar que `POST /api/auth/login` com credenciais de manager retorna 200 sem `redirect_url` (confirma bugs 1.2 e 1.3)
  - Verificar que `POST /api/auth/login` com credenciais de doctor retorna 200 sem `redirect_url` (confirma bugs 1.1 e 1.3)
  - Executar no código NÃO CORRIGIDO
  - **RESULTADO ESPERADO**: Testes FALHAM (isso é correto — prova que o bug existe)
  - Documentar contraexemplos encontrados para entender o root cause
  - Marcar task como completa quando o teste estiver escrito, executado e a falha documentada
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 2. Escrever testes de preservation (ANTES de implementar a correção)
  - **Property 2: Preservation** - Comportamento do Middleware e Proteção de Rotas
  - **IMPORTANTE**: Seguir metodologia observation-first
  - Observar: `require_role("doctor")` com sessão válida de doctor retorna 200 no código não corrigido
  - Observar: `require_role("manager")` com sessão válida de manager retorna 200 no código não corrigido
  - Observar: `require_role("doctor")` com sessão de manager retorna 403 no código não corrigido
  - Observar: `require_role("manager")` com sessão de doctor retorna 403 no código não corrigido
  - Observar: logout invalida sessão corretamente para qualquer role no código não corrigido
  - Observar: cookie criptografado contém campos `user_id`, `email`, `hospital_id`, `role` no código não corrigido
  - Escrever testes property-based com Hypothesis capturando os padrões de comportamento observados (ver Property 3 no design)
  - Executar testes no código NÃO CORRIGIDO
  - **RESULTADO ESPERADO**: Testes PASSAM (confirma comportamento baseline a preservar)
  - Marcar task como completa quando os testes estiverem escritos, executados e passando no código não corrigido
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

- [x] 3. Correção do bug de separação por domínio de login

  - [x] 3.1 Adicionar campo `redirect_url` ao `LoginResponse` em `backend/models/auth.py`
    - Adicionar `redirect_url: Optional[str] = None` ao modelo `LoginResponse`
    - Garantir que o campo é opcional para não quebrar o endpoint `/login` original
    - _Bug_Condition: isBugCondition(input) onde `redirect_url NOT IN response` mesmo com role correto_
    - _Expected_Behavior: LoginResponse inclui `redirect_url` preenchido com a URL do domínio correto_
    - _Preservation: Campo opcional não altera o contrato do endpoint `/login` original_
    - _Requirements: 2.1, 2.2_

  - [x] 3.2 Adicionar URLs de frontend por domínio em `backend/core/config.py`
    - Adicionar `doctor_frontend_url: str = Field(default="http://localhost:3000", env="DOCTOR_FRONTEND_URL")`
    - Adicionar `manager_frontend_url: str = Field(default="http://localhost:3001", env="MANAGER_FRONTEND_URL")`
    - _Requirements: 2.1, 2.2_

  - [x] 3.3 Adicionar novos endpoints e helper `_domain_login` em `backend/api/routes/auth.py`
    - Implementar helper `_domain_login(request, response, credentials, db, logger_service, expected_role, redirect_url)`
    - Após autenticar no Supabase e buscar o perfil, verificar `profile["role"] == expected_role`
    - Se role não corresponder: retornar HTTP 403 sem chamar `session_manager.create_session`
    - Se role corresponder: criar sessão e retornar `LoginResponse` com `redirect_url` preenchido
    - Adicionar endpoint `POST /login/medico` chamando `_domain_login` com `expected_role="doctor"` e `redirect_url=settings.doctor_frontend_url`
    - Adicionar endpoint `POST /login/gestor` chamando `_domain_login` com `expected_role="manager"` e `redirect_url=settings.manager_frontend_url`
    - Registrar os novos endpoints ANTES do endpoint `/login` original para evitar conflito de rota no FastAPI
    - Adicionar docstring de depreciação ao endpoint `/login` original (sem alterar seu comportamento)
    - _Bug_Condition: isBugCondition(input) onde `profile["role"] != expected_role` AND `session_was_created()`_
    - _Expected_Behavior: HTTP 403 sem sessão quando role não corresponde; HTTP 200 + redirect_url quando corresponde_
    - _Preservation: Endpoint `/login` original mantido sem alterações de comportamento_
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [x] 3.4 Adicionar novos endpoints à `PUBLIC_ROUTES` em `backend/middleware/auth.py`
    - Adicionar `"/api/auth/login/medico"` à lista `PUBLIC_ROUTES`
    - Adicionar `"/api/auth/login/gestor"` à lista `PUBLIC_ROUTES`
    - _Preservation: SessionValidationMiddleware não é alterado — apenas a lista de rotas públicas é expandida_
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3_

  - [x] 3.5 Verificar que o teste exploratório de bug condition agora passa
    - **Property 1: Expected Behavior** - Separação por Domínio de Login
    - **IMPORTANTE**: Re-executar o MESMO teste da task 1 — NÃO escrever um novo teste
    - O teste da task 1 codifica o comportamento esperado
    - Quando este teste passar, confirma que o comportamento esperado foi satisfeito
    - Executar o teste exploratório de bug condition da task 1
    - **RESULTADO ESPERADO**: Teste PASSA (confirma que o bug foi corrigido)
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [x] 3.6 Verificar que os testes de preservation ainda passam
    - **Property 2: Preservation** - Comportamento do Middleware e Proteção de Rotas
    - **IMPORTANTE**: Re-executar os MESMOS testes da task 2 — NÃO escrever novos testes
    - Executar os testes property-based de preservation da task 2
    - **RESULTADO ESPERADO**: Testes PASSAM (confirma ausência de regressões)
    - Confirmar que todos os testes passam após a correção

- [x] 4. Checkpoint — Garantir que todos os testes passam
  - Executar a suíte completa de testes (exploratório + preservation + unitários + integração)
  - Verificar que os testes de integração cobrem os fluxos completos descritos no design
  - Confirmar que o endpoint `/login` original continua funcionando para compatibilidade retroativa
  - Perguntar ao usuário se surgirem dúvidas
