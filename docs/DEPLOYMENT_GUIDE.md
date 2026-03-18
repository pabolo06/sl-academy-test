# 🚀 Deployment Guide - SL Academy Platform

## 📋 Overview

Este guia cobre o deployment completo da plataforma SL Academy em ambientes de staging e produção.

---

## 🏗️ Arquitetura de Deployment

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend                             │
│                    (Vercel/Netlify)                         │
│                  Next.js 14 App Router                      │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTPS
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                         Backend                              │
│                   (Railway/Render)                          │
│                      FastAPI + Uvicorn                      │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                        Database                              │
│                        Supabase                              │
│                  PostgreSQL + RLS + Storage                 │
└─────────────────────────────────────────────────────────────┘
```

---

## 📦 Requisitos de Infraestrutura

### Backend
- **CPU**: 1 vCPU mínimo (2 vCPU recomendado)
- **RAM**: 512 MB mínimo (1 GB recomendado)
- **Storage**: 1 GB
- **Python**: 3.9+
- **Network**: HTTPS obrigatório em produção

### Frontend
- **Node.js**: 18+
- **Build Time**: ~2-3 minutos
- **Storage**: 100 MB para build
- **CDN**: Recomendado para assets estáticos

### Database
- **Supabase**: Plano Free ou Pro
- **Storage**: 500 MB mínimo (1 GB recomendado)
- **Connections**: 10 conexões simultâneas mínimo

---

## 🔧 Configuração de Ambientes

### Ambientes Recomendados

1. **Development** (Local)
   - Backend: http://localhost:8000
   - Frontend: http://localhost:3000
   - Database: Supabase (projeto de dev)

2. **Staging**
   - Backend: https://api-staging.slacademy.com
   - Frontend: https://staging.slacademy.com
   - Database: Supabase (projeto de staging)

3. **Production**
   - Backend: https://api.slacademy.com
   - Frontend: https://slacademy.com
   - Database: Supabase (projeto de produção)

---

## 📝 Pré-requisitos

### 1. Criar Projetos Supabase

```bash
# Staging
1. Acesse https://supabase.com
2. Crie projeto: "sl-academy-staging"
3. Anote: Project URL, anon key, service_role key

# Production
1. Crie projeto: "sl-academy-production"
2. Anote: Project URL, anon key, service_role key
```

### 2. Executar Migrações

```bash
# Para cada projeto Supabase (staging e production):
1. Vá em SQL Editor
2. Execute as migrações na ordem:
   - 001_initial_schema.sql
   - 002_rls_policies_fixed.sql
   - 003_triggers.sql
   - 004_seed_data.sql (opcional em produção)
   - 005_performance_indexes.sql
```

### 3. Configurar Secrets

```bash
# Gerar session secret
python -c "import secrets; print(secrets.token_urlsafe(32))"

# Gerar para staging e production (diferentes!)
```

---

## 🚀 Deploy do Backend

### Opção 1: Railway (Recomendado)

#### 1. Criar Conta e Projeto
```bash
1. Acesse https://railway.app
2. Crie conta (GitHub login recomendado)
3. Crie novo projeto: "SL Academy Backend"
```

#### 2. Conectar Repositório
```bash
1. New → GitHub Repo
2. Selecione seu repositório
3. Configure root directory: "backend"
```

#### 3. Configurar Variáveis de Ambiente
```bash
# No Railway Dashboard → Variables
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_KEY=eyJhbGc...
SESSION_SECRET_KEY=<gerar-novo>
OPENAI_API_KEY=sk-...
CORS_ORIGINS=https://slacademy.com
ENVIRONMENT=production
DEBUG=false
API_HOST=0.0.0.0
API_PORT=8000
```

#### 4. Configurar Build
```bash
# Railway detecta automaticamente Python
# Certifique-se que requirements.txt está na raiz do backend
```

#### 5. Configurar Start Command
```bash
# No Railway → Settings → Deploy
Start Command: uvicorn main:app --host 0.0.0.0 --port $PORT
```

#### 6. Deploy
```bash
# Railway faz deploy automático em cada push
# Ou clique em "Deploy" manualmente
```

#### 7. Configurar Domínio Customizado
```bash
1. Settings → Networking
2. Generate Domain ou Add Custom Domain
3. Configure DNS: CNAME para railway.app
```

---

### Opção 2: Render

#### 1. Criar Web Service
```bash
1. Acesse https://render.com
2. New → Web Service
3. Conecte repositório GitHub
4. Root Directory: backend
```

#### 2. Configurar Service
```bash
Name: sl-academy-backend
Environment: Python 3
Build Command: pip install -r requirements.txt
Start Command: uvicorn main:app --host 0.0.0.0 --port $PORT
```

#### 3. Adicionar Variáveis de Ambiente
```bash
# Mesmas variáveis do Railway
```

#### 4. Deploy
```bash
# Render faz deploy automático
```

---

## 🎨 Deploy do Frontend

### Opção 1: Vercel (Recomendado)

#### 1. Instalar Vercel CLI
```bash
npm install -g vercel
```

#### 2. Login
```bash
vercel login
```

#### 3. Deploy
```bash
cd frontend
vercel --prod
```

#### 4. Configurar Variáveis de Ambiente
```bash
# No Vercel Dashboard → Settings → Environment Variables
NEXT_PUBLIC_API_URL=https://api.slacademy.com
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
```

#### 5. Configurar Domínio
```bash
# Vercel Dashboard → Domains
# Adicione: slacademy.com
# Configure DNS: CNAME para cname.vercel-dns.com
```

---

### Opção 2: Netlify

#### 1. Conectar Repositório
```bash
1. Acesse https://netlify.com
2. New site from Git
3. Selecione repositório
4. Base directory: frontend
```

#### 2. Configurar Build
```bash
Build command: npm run build
Publish directory: .next
```

#### 3. Adicionar Variáveis de Ambiente
```bash
# Netlify Dashboard → Site settings → Environment variables
# Mesmas variáveis do Vercel
```

#### 4. Deploy
```bash
# Netlify faz deploy automático
```

---

## 🔐 Configuração de Secrets (Produção)

### AWS Secrets Manager (Recomendado)

#### 1. Criar Secrets
```bash
aws secretsmanager create-secret \
  --name sl-academy/production/supabase-service-key \
  --secret-string "eyJhbGc..."

aws secretsmanager create-secret \
  --name sl-academy/production/session-secret \
  --secret-string "seu-secret-aqui"

aws secretsmanager create-secret \
  --name sl-academy/production/openai-key \
  --secret-string "sk-..."
```

#### 2. Configurar IAM Role
```bash
# Criar role com permissão secretsmanager:GetSecretValue
# Anexar role ao serviço de backend
```

#### 3. Atualizar Backend
```bash
# Backend já está configurado para usar AWS Secrets Manager
# Ver backend/core/secrets.py
```

---

## 📊 Monitoramento

### Sentry (Error Tracking)

#### 1. Criar Projeto Sentry
```bash
1. Acesse https://sentry.io
2. Crie projeto para backend (Python)
3. Crie projeto para frontend (Next.js)
```

#### 2. Configurar Backend
```bash
# Adicionar variável de ambiente
SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
```

#### 3. Configurar Frontend
```bash
# Adicionar variável de ambiente
NEXT_PUBLIC_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
```

---

## 🔄 CI/CD Pipeline

### GitHub Actions (Já Configurado)

#### Workflows Existentes

1. **`.github/workflows/ci.yml`**
   - Roda em cada PR
   - Executa testes backend e frontend
   - Verifica linting e tipos

2. **`.github/workflows/security-scan.yml`**
   - Roda diariamente
   - Scan de vulnerabilidades
   - Atualiza dependências

#### Configurar Secrets no GitHub

```bash
# GitHub Repo → Settings → Secrets and variables → Actions

# Backend
SUPABASE_URL_STAGING
SUPABASE_SERVICE_KEY_STAGING
SUPABASE_URL_PRODUCTION
SUPABASE_SERVICE_KEY_PRODUCTION

# Frontend
VERCEL_TOKEN
VERCEL_ORG_ID
VERCEL_PROJECT_ID
```

---

## 🔙 Backup e Recovery

### Backup Automático (Já Configurado)

#### 1. Configurar Cron Job
```bash
# No servidor de backend
crontab -e

# Adicionar (backup diário às 2 AM)
0 2 * * * /path/to/backend/scripts/setup_backup_cron.sh
```

#### 2. Verificar Backups
```bash
# Backups são salvos em:
/var/backups/sl-academy/

# Retenção: 30 dias
```

### Restore Manual

```bash
# Ver docs/BACKUP_AND_RECOVERY.md para procedimentos completos
cd backend/scripts
python restore_database.py
```

---

## 🧪 Validação de Deploy

### Checklist Pós-Deploy

#### Backend
```bash
# 1. Health check
curl https://api.slacademy.com/health

# Deve retornar:
# {"status": "healthy", "environment": "production"}

# 2. API docs
curl https://api.slacademy.com/docs
# Deve retornar HTML do Swagger

# 3. Teste de autenticação
curl -X POST https://api.slacademy.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@hospital.com","password":"Test123!"}'
```

#### Frontend
```bash
# 1. Acessar homepage
curl https://slacademy.com

# 2. Verificar assets
curl https://slacademy.com/_next/static/...

# 3. Teste de login
# Abrir navegador e testar login manual
```

#### Database
```bash
# 1. Verificar conexões
# Supabase Dashboard → Database → Connection pooling

# 2. Verificar RLS
# Supabase Dashboard → Authentication → Policies

# 3. Verificar storage
# Supabase Dashboard → Storage → Buckets
```

---

## 🐛 Troubleshooting

### Backend não inicia

**Problema**: Erro ao iniciar uvicorn
```bash
# Verificar logs
railway logs  # ou render logs

# Verificar variáveis de ambiente
railway variables  # ou render env

# Verificar requirements.txt
pip install -r requirements.txt
```

### Frontend build falha

**Problema**: Erro no build do Next.js
```bash
# Verificar logs de build
vercel logs  # ou netlify logs

# Verificar variáveis de ambiente
vercel env ls

# Build local para debug
npm run build
```

### Erro de CORS

**Problema**: Frontend não consegue acessar backend
```bash
# Verificar CORS_ORIGINS no backend
# Deve incluir URL do frontend

# Staging
CORS_ORIGINS=https://staging.slacademy.com

# Production
CORS_ORIGINS=https://slacademy.com
```

### Erro de conexão com Supabase

**Problema**: Backend não conecta ao Supabase
```bash
# Verificar credenciais
# SUPABASE_URL deve ser https://xxx.supabase.co
# SUPABASE_SERVICE_KEY deve ser válida

# Testar conexão
python -c "from supabase import create_client; client = create_client('URL', 'KEY'); print(client.table('hospitals').select('*').execute())"
```

### Session não persiste

**Problema**: Usuário é deslogado constantemente
```bash
# Verificar SESSION_SECRET_KEY
# Deve ser o mesmo no backend e frontend

# Verificar cookies
# Devem ter httpOnly, secure (prod), sameSite=lax
```

---

## 📈 Scaling

### Horizontal Scaling

#### Backend
```bash
# Railway/Render: Aumentar número de instâncias
# Settings → Scaling → Replicas: 2-5

# Load balancer é automático
```

#### Database
```bash
# Supabase: Upgrade para plano Pro
# Aumenta conexões e performance
```

### Vertical Scaling

#### Backend
```bash
# Railway/Render: Aumentar recursos
# Settings → Resources
# CPU: 2-4 vCPU
# RAM: 2-4 GB
```

---

## 🔄 Rollback Procedures

### Backend Rollback

#### Railway
```bash
# Dashboard → Deployments
# Clique em deployment anterior
# Clique em "Redeploy"
```

#### Render
```bash
# Dashboard → Deploys
# Clique em "Rollback" no deploy anterior
```

### Frontend Rollback

#### Vercel
```bash
# Dashboard → Deployments
# Clique em deployment anterior
# Clique em "Promote to Production"
```

#### Netlify
```bash
# Dashboard → Deploys
# Clique em "Publish deploy" no deploy anterior
```

### Database Rollback

```bash
# Ver docs/BACKUP_AND_RECOVERY.md
cd backend/scripts
python restore_database.py --backup-file=<file>
```

---

## 📞 Suporte

### Recursos
- [Railway Docs](https://docs.railway.app)
- [Render Docs](https://render.com/docs)
- [Vercel Docs](https://vercel.com/docs)
- [Netlify Docs](https://docs.netlify.com)
- [Supabase Docs](https://supabase.com/docs)

### Contato
- Email: dev@slacademy.com
- Slack: #sl-academy-ops

---

**Última Atualização:** 14 de março de 2026
**Versão:** 1.0.0
