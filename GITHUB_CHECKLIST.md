# Checklist de Configuração do GitHub

Siga este passo a passo no painel do GitHub antes de ativar o pipeline CI/CD.

---

## 1. Criar os Environments

Acesse: **Settings → Environments → New environment**

Crie dois environments:

| Nome | Propósito |
|------|-----------|
| `staging` | Branch `staging` — deploy automático após testes |
| `production` | Branch `main` — deploy manual com aprovação |

**Para o environment `production`:**
- Ative **Required reviewers** e adicione você como revisor obrigatório
- Ative **Prevent self-review** (opcional)
- Em **Deployment branches**, selecione **Selected branches** e adicione `main`

---

## 2. Criar os Secrets (Settings → Secrets and variables → Actions → Secrets)

### Secrets de Teste (usados no job `backend-test`)

| Nome do Secret | Descrição |
|----------------|-----------|
| `SUPABASE_URL_TEST` | URL do projeto Supabase de teste |
| `SUPABASE_ANON_KEY_TEST` | Chave anônima do Supabase de teste |
| `SUPABASE_SERVICE_KEY_TEST` | Chave de serviço do Supabase de teste |
| `SESSION_SECRET_KEY_TEST` | Chave secreta para sessões em teste (mínimo 32 chars) |
| `OPENAI_API_KEY_TEST` | Chave da OpenAI para ambiente de teste |

### Secrets do Frontend (usados no build)

| Nome do Secret | Descrição |
|----------------|-----------|
| `NEXT_PUBLIC_API_URL_TEST` | URL da API backend em teste (ex: `https://staging.railway.app`) |
| `NEXT_PUBLIC_SUPABASE_URL_TEST` | URL do Supabase de teste |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY_TEST` | Chave anônima do Supabase de teste |

### Secrets de Deploy — Vercel (Frontend)

| Nome do Secret | Como obter |
|----------------|-----------|
| `VERCEL_TOKEN` | Vercel → Settings → Tokens → Create Token |
| `VERCEL_ORG_ID` | Vercel → Settings → General → Team ID (ou User ID) |
| `VERCEL_PROJECT_ID` | Vercel → Projeto → Settings → General → Project ID |

### Secrets de Deploy — Railway (Backend)

| Nome do Secret | Como obter |
|----------------|-----------|
| `RAILWAY_TOKEN` | Railway → Account Settings → Tokens → New Token |
| `RAILWAY_SERVICE_ID_STAGING` | Railway → Projeto staging → Service → Settings → Service ID |
| `RAILWAY_SERVICE_ID_PRODUCTION` | Railway → Projeto production → Service → Settings → Service ID |
| `RAILWAY_ENVIRONMENT_ID_STAGING` | Railway → Projeto staging → Settings → Environment ID |
| `RAILWAY_ENVIRONMENT_ID_PRODUCTION` | Railway → Projeto production → Settings → Environment ID |

### Secrets de Banco de Dados

| Nome do Secret | Descrição |
|----------------|-----------|
| `DATABASE_URL_STAGING` | Connection string PostgreSQL do Supabase (staging) |
| `DATABASE_URL_PRODUCTION` | Connection string PostgreSQL do Supabase (production) |
| `SUPABASE_ACCESS_TOKEN` | Token pessoal do Supabase CLI (`supabase login`) |
| `SUPABASE_PROJECT_ID_STAGING` | ID do projeto Supabase de staging |
| `SUPABASE_PROJECT_ID_PRODUCTION` | ID do projeto Supabase de production |

### Secrets de Monitoramento e Qualidade

| Nome do Secret | Como obter |
|----------------|-----------|
| `CODECOV_TOKEN` | codecov.io → Seu repositório → Settings → Token |
| `SNYK_TOKEN` | app.snyk.io → Account Settings → Auth Token |
| `SONAR_TOKEN` | sonarcloud.io → Account → Security → Generate Tokens |

---

## 3. Criar as Variables (Settings → Secrets and variables → Actions → Variables)

| Nome da Variable | Exemplo de Valor |
|-----------------|------------------|
| `SONAR_ORGANIZATION` | `minha-org` (nome da org no SonarCloud) |
| `STAGING_URL` | `https://staging.seuapp.vercel.app` |
| `PRODUCTION_URL` | `https://seuapp.vercel.app` |

> **Atenção:** Variables são visíveis (não criptografadas). Use apenas para valores não sensíveis.

---

## 4. Configurar o SonarCloud (se aplicável)

1. Acesse [sonarcloud.io](https://sonarcloud.io) e crie uma conta
2. Importe o repositório
3. Copie o **Organization Key** para a variable `SONAR_ORGANIZATION`
4. Gere um token e salve como secret `SONAR_TOKEN`

---

## 5. Configurar o Codecov

1. Acesse [codecov.io](https://codecov.io) com sua conta GitHub
2. Adicione o repositório
3. Copie o **Upload Token** para o secret `CODECOV_TOKEN`

---

## 6. Verificar o pipeline após configuração

Depois de configurar todos os secrets e variables:

1. Faça um push para a branch `staging`
2. Acesse **Actions** e verifique se todos os jobs passam
3. Confirme que o deploy de staging foi realizado com sucesso
4. Acesse `$STAGING_URL/ping` para validar o backend

---

## Resumo de Secrets necessários (total: 20 secrets + 3 variables)

```
Secrets (20):
  SUPABASE_URL_TEST
  SUPABASE_ANON_KEY_TEST
  SUPABASE_SERVICE_KEY_TEST
  SESSION_SECRET_KEY_TEST
  OPENAI_API_KEY_TEST
  NEXT_PUBLIC_API_URL_TEST
  NEXT_PUBLIC_SUPABASE_URL_TEST
  NEXT_PUBLIC_SUPABASE_ANON_KEY_TEST
  VERCEL_TOKEN
  VERCEL_ORG_ID
  VERCEL_PROJECT_ID
  RAILWAY_TOKEN
  RAILWAY_SERVICE_ID_STAGING
  RAILWAY_SERVICE_ID_PRODUCTION
  RAILWAY_ENVIRONMENT_ID_STAGING
  RAILWAY_ENVIRONMENT_ID_PRODUCTION
  DATABASE_URL_STAGING
  DATABASE_URL_PRODUCTION
  SUPABASE_ACCESS_TOKEN
  SUPABASE_PROJECT_ID_STAGING
  SUPABASE_PROJECT_ID_PRODUCTION
  CODECOV_TOKEN
  SNYK_TOKEN
  SONAR_TOKEN

Variables (3):
  SONAR_ORGANIZATION
  STAGING_URL
  PRODUCTION_URL
```
