# Deploy Checklist — SL Academy Platform

## Visão Geral

| Serviço | URL atual |
|---|---|
| Supabase | https://joewhfllvdaygffsosor.supabase.co |
| Backend | https://api-v2.appdeploy.ai/app/4d051fe4c40741ad8b |
| Frontend | (a definir após deploy no Vercel) |

---

## FASE 1 — Supabase: Aplicar Migrations

Acesse: **https://supabase.com/dashboard/project/joewhfllvdaygffsosor/sql**

Execute os arquivos SQL abaixo em ordem (copie e cole cada um no SQL Editor):

- [ ] **1.** `supabase/migrations/001_init_schema.sql`
- [ ] **2.** `supabase/migrations/002_rls_policies_fixed.sql` ← usar este (não o sem _fixed)
- [ ] **3.** `supabase/migrations/002_add_consent_timestamp.sql`
- [ ] **4.** `supabase/migrations/003_triggers.sql`
- [ ] **5.** `supabase/migrations/004_audit_logs.sql`
- [ ] **6.** `supabase/migrations/005_performance_indexes.sql`
- [ ] **7.** `supabase/migrations/006_test_helper_functions.sql`
- [ ] **8.** `supabase/migrations/007_indicators_unique_constraint.sql`

---

## FASE 2 — Supabase: Configurar Auth e Storage

### Auth (Authentication → Settings)
- [ ] Email provider: **habilitado**
- [ ] Confirm email: desabilitar para testes iniciais
- [ ] Site URL: `https://<seu-app>.vercel.app`
- [ ] Redirect URLs: adicionar `https://<seu-app>.vercel.app/**`

### Storage (Storage → New Bucket)
- [ ] Criar bucket `doubt-images` — privado
- [ ] Criar bucket `indicator-files` — privado

### Coletar chaves (Settings → API)
- [ ] Copiar `SUPABASE_SERVICE_ROLE_KEY` (só para o backend — nunca expor no frontend)
- [ ] Copiar `DATABASE_URL` (Session Pooler → Connection String)

---

## FASE 3 — Backend: Configurar Variáveis de Ambiente

No painel de deploy do backend (`appdeploy.ai`), configurar:

```
SUPABASE_URL=https://joewhfllvdaygffsosor.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpvZXdoZmxsdmRheWdmZnNvc29yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1MDQ1MTUsImV4cCI6MjA4OTA4MDUxNX0.r7UVrbONJGipYyvDgB5jHA4SA1jtgs0Vl9NEQbw8Nc4
SUPABASE_SERVICE_KEY=<service role key — pegar no Supabase Settings → API>
DATABASE_URL=<connection string — pegar no Supabase Settings → Database>
SESSION_SECRET_KEY=<gerar string aleatória 32+ chars>
CORS_ORIGINS=https://<seu-app>.vercel.app
OPENAI_API_KEY=<sua chave OpenAI>
ENVIRONMENT=production
DEBUG=false
SECURE_COOKIES=true
LOG_LEVEL=INFO
```

> Para gerar SESSION_SECRET_KEY: `python -c "import secrets; print(secrets.token_hex(32))"`

- [ ] Variáveis configuradas
- [ ] Backend reiniciado
- [x] Verificar: `GET https://api-v2.appdeploy.ai/app/4d051fe4c40741ad8b/health` → retorna `{"status":"healthy","version":"1.0.0"}` ✓

---

## FASE 4 — Frontend: Deploy no Vercel

### Opção A — Via GitHub (recomendado)
1. Acesse https://vercel.com/new
2. Importe o repositório
3. Configure:
   - **Framework**: Next.js
   - **Root directory**: `frontend`
   - **Build command**: `npm run build`
   - **Output directory**: `out`
4. Adicione as variáveis de ambiente:

```
NEXT_PUBLIC_API_URL=https://api-v2.appdeploy.ai/app/4d051fe4c40741ad8b
NEXT_PUBLIC_SUPABASE_URL=https://joewhfllvdaygffsosor.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpvZXdoZmxsdmRheWdmZnNvc29yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1MDQ1MTUsImV4cCI6MjA4OTA4MDUxNX0.r7UVrbONJGipYyvDgB5jHA4SA1jtgs0Vl9NEQbw8Nc4
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpvZXdoZmxsdmRheWdmZnNvc29yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1MDQ1MTUsImV4cCI6MjA4OTA4MDUxNX0.r7UVrbONJGipYyvDgB5jHA4SA1jtgs0Vl9NEQbw8Nc4
SESSION_SECRET_KEY=<mesma string usada no backend>
SESSION_MAX_AGE=86400
NODE_ENV=production
NEXT_PUBLIC_PWA_ENABLED=true
NEXT_PUBLIC_ENABLE_OFFLINE=true
```

5. Clique em **Deploy**

### Opção B — Via CLI
```bash
cd frontend
npx vercel --prod
```

- [ ] Deploy realizado
- [ ] URL do Vercel obtida (ex: `sl-academy-xyz.vercel.app`)

---

## FASE 5 — Pós-Deploy: Atualizar URLs

Após obter a URL do Vercel:

- [ ] Atualizar `CORS_ORIGINS` no backend com a URL do Vercel
- [ ] Atualizar Site URL e Redirect URLs no Supabase Auth
- [ ] Reiniciar o backend

---

## FASE 6 — Criar Primeiro Hospital e Usuário

Siga as instruções em `supabase/seed.sql`:

1. [ ] Criar usuário manager no Supabase Dashboard (Authentication → Users → Add User)
2. [ ] Executar o SQL do seed para criar o hospital
3. [ ] Vincular o manager ao hospital (UPDATE no profiles)
4. [ ] Testar login com o manager

---

## FASE 7 — Validação End-to-End

- [ ] `GET /health` retorna 200 no backend
- [ ] Login com manager funciona
- [ ] Dashboard do gestor carrega
- [ ] Criar trilha e aula
- [ ] Login com médico funciona
- [ ] Médico vê trilhas do hospital (isolamento RLS funcionando)
- [ ] Fluxo pré-teste → vídeo → pós-teste completo
- [ ] PWA instalável no mobile
