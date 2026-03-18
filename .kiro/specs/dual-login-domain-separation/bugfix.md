# Documento de Requisitos de Bugfix

## Introdução

O sistema SL Academy Platform possui um único endpoint de login (`POST /api/auth/login`) que autentica tanto médicos quanto gestores sem qualquer separação por domínio ou validação de role esperado. Isso permite que um médico autentique pelo mesmo fluxo de login do gestor e vice-versa, sem redirecionamento automático por role e sem endpoints dedicados por domínio. O bug compromete a separação de contextos da plataforma, onde médicos e gestores devem operar em domínios distintos com acesso a funcionalidades diferentes.

## Análise do Bug

### Comportamento Atual (Defeito)

1.1 QUANDO um usuário com role `"doctor"` envia credenciais para `POST /api/auth/login` ENTÃO o sistema autentica com sucesso sem validar se o domínio de login corresponde ao role esperado

1.2 QUANDO um usuário com role `"manager"` envia credenciais para `POST /api/auth/login` ENTÃO o sistema autentica com sucesso sem validar se o domínio de login corresponde ao role esperado

1.3 QUANDO o login é realizado com sucesso ENTÃO o sistema não retorna um `redirect_url` baseado no role do usuário autenticado

1.4 QUANDO um médico tenta autenticar pelo domínio do gestor ENTÃO o sistema não rejeita a tentativa antes de criar a sessão

1.5 QUANDO um gestor tenta autenticar pelo domínio do médico ENTÃO o sistema não rejeita a tentativa antes de criar a sessão

### Comportamento Esperado (Correto)

2.1 QUANDO um usuário com role `"doctor"` envia credenciais para `POST /api/auth/login/medico` ENTÃO o sistema SHALL autenticar com sucesso e retornar `redirect_url` apontando para o domínio do médico

2.2 QUANDO um usuário com role `"manager"` envia credenciais para `POST /api/auth/login/gestor` ENTÃO o sistema SHALL autenticar com sucesso e retornar `redirect_url` apontando para o domínio do gestor

2.3 QUANDO um usuário com role `"manager"` envia credenciais para `POST /api/auth/login/medico` ENTÃO o sistema SHALL rejeitar a autenticação com erro 403 sem criar sessão

2.4 QUANDO um usuário com role `"doctor"` envia credenciais para `POST /api/auth/login/gestor` ENTÃO o sistema SHALL rejeitar a autenticação com erro 403 sem criar sessão

2.5 QUANDO credenciais inválidas são enviadas para qualquer endpoint de login por domínio ENTÃO o sistema SHALL retornar erro 401 sem criar sessão

### Comportamento Inalterado (Prevenção de Regressão)

3.1 QUANDO um usuário com role `"doctor"` acessa rotas protegidas por `require_role("doctor")` com sessão válida ENTÃO o sistema SHALL CONTINUE TO permitir o acesso normalmente

3.2 QUANDO um usuário com role `"manager"` acessa rotas protegidas por `require_role("manager")` com sessão válida ENTÃO o sistema SHALL CONTINUE TO permitir o acesso normalmente

3.3 QUANDO um usuário sem sessão válida acessa qualquer rota protegida ENTÃO o sistema SHALL CONTINUE TO retornar erro 401

3.4 QUANDO um usuário com role `"doctor"` tenta acessar rotas protegidas por `require_role("manager")` ENTÃO o sistema SHALL CONTINUE TO rejeitar o acesso com erro 403

3.5 QUANDO o logout é realizado ENTÃO o sistema SHALL CONTINUE TO invalidar a sessão corretamente independente do role do usuário

3.6 QUANDO credenciais corretas são fornecidas e o role corresponde ao domínio de login ENTÃO o sistema SHALL CONTINUE TO criar a sessão com os campos `user_id`, `email`, `hospital_id` e `role` no cookie criptografado
