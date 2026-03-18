# 📋 Comandos Prontos para Copiar e Colar

## 🔧 Gerar Session Secret

```powershell
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

---

## 🚀 Iniciar Backend

```powershell
cd C:\Users\pablo\OneDrive\Documentos\Oslo
.\start-backend.ps1
```

---

## 🎨 Iniciar Frontend (novo terminal)

```powershell
cd C:\Users\pablo\OneDrive\Documentos\Oslo
.\start-frontend.ps1
```

---

## 🗄️ SQL: Criar Perfil para Usuário

```sql
-- Substitua USER_UID_AQUI pelo UID do usuário criado no Supabase
INSERT INTO profiles (id, hospital_id, full_name, role, is_focal_point)
VALUES (
  'USER_UID_AQUI',
  '00000000-0000-0000-0000-000000000001',
  'Admin Teste',
  'manager',
  false
);
```

---

## 🗄️ SQL: Verificar Tabelas Criadas

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;
```

---

## 🗄️ SQL: Verificar Funções RLS

```sql
SELECT routine_name, routine_schema
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN ('user_hospital_id', 'user_role', 'is_manager');
```

---

## 🗄️ SQL: Verificar Policies

```sql
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

---

## 🗄️ SQL: Ver Usuários Criados

```sql
SELECT id, email, created_at
FROM auth.users
ORDER BY created_at DESC;
```

---

## 🗄️ SQL: Ver Perfis Criados

```sql
SELECT id, full_name, role, hospital_id
FROM profiles
WHERE deleted_at IS NULL;
```

---

## 🗄️ SQL: Criar Trilha de Teste

```sql
INSERT INTO tracks (hospital_id, title, description)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Cardiologia Básica',
  'Introdução aos conceitos fundamentais de cardiologia'
);
```

---

## 🗄️ SQL: Ver Trilhas Criadas

```sql
SELECT id, title, description, created_at
FROM tracks
WHERE deleted_at IS NULL
ORDER BY created_at DESC;
```

---

## 🧪 Testar Backend (novo terminal)

```powershell
# Health check
curl http://localhost:8000/health

# Ou no navegador
start http://localhost:8000/health
```

---

## 🧪 Testar API Docs

```powershell
start http://localhost:8000/docs
```

---

## 🧪 Abrir Frontend

```powershell
start http://localhost:3000
```

---

## 🐛 Matar Processo na Porta 8000

```powershell
# Encontrar PID
netstat -ano | findstr :8000

# Matar processo (substitua 1234 pelo PID)
taskkill /PID 1234 /F
```

---

## 🐛 Matar Processo na Porta 3000

```powershell
# Encontrar PID
netstat -ano | findstr :3000

# Matar processo (substitua 1234 pelo PID)
taskkill /PID 1234 /F
```

---

## 🔄 Reinstalar Dependências Backend

```powershell
cd backend
Remove-Item -Recurse -Force venv
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

---

## 🔄 Reinstalar Dependências Frontend

```powershell
cd frontend
Remove-Item -Recurse -Force node_modules, package-lock.json
npm install
```

---

## 📊 Ver Logs do Backend

```powershell
# No terminal onde o backend está rodando
# Os logs aparecem automaticamente
```

---

## 📊 Ver Logs do Frontend

```powershell
# No terminal onde o frontend está rodando
# Os logs aparecem automaticamente
```

---

## 🧹 Limpar Cache do Redis (se instalado)

```powershell
redis-cli FLUSHDB
```

---

## 🧪 Testar Redis (se instalado)

```powershell
redis-cli ping
# Deve retornar: PONG
```

---

## 📝 Editar Arquivos de Configuração

```powershell
# Backend
notepad backend\.env

# Frontend
notepad frontend\.env.local
```

---

## 🔍 Ver Estrutura do Projeto

```powershell
tree /F /A
```

---

## 📦 Verificar Versões

```powershell
# Python
python --version

# Node.js
node --version

# npm
npm --version

# Redis (se instalado)
redis-cli --version
```

---

## 🎯 URLs Importantes

```
Frontend:        http://localhost:3000
Login:           http://localhost:3000/login
Dashboard:       http://localhost:3000/dashboard

Backend API:     http://localhost:8000
API Docs:        http://localhost:8000/docs
Health Check:    http://localhost:8000/health

Supabase:        https://app.supabase.com
```

---

## 💾 Backup do Banco (Supabase Dashboard)

1. Project Settings → Database
2. Connection string → Copy
3. Use pg_dump localmente (se tiver PostgreSQL instalado)

---

## 🔐 Credenciais de Teste

```
Email:    admin@hospital.com
Senha:    Admin123!
Role:     manager
Hospital: Hospital Teste (ID: 00000000-0000-0000-0000-000000000001)
```

---

## 📚 Arquivos de Configuração

```
Backend:   backend/.env
Frontend:  frontend/.env.local
```

---

## 🗂️ Migrações SQL (ordem de execução)

```
1. supabase/migrations/001_initial_schema.sql
2. supabase/migrations/002_rls_policies_fixed.sql  ⚠️ Use o _fixed
3. supabase/migrations/003_triggers.sql
4. supabase/migrations/004_seed_data.sql
5. supabase/migrations/005_performance_indexes.sql
```
