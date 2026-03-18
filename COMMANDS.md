# 🚀 Comandos Essenciais - SL Academy Platform

## 📋 Índice Rápido
- [Iniciar Aplicação](#iniciar-aplicação)
- [Configuração Inicial](#configuração-inicial)
- [Comandos SQL](#comandos-sql)
- [Testes e Debug](#testes-e-debug)
- [Troubleshooting](#troubleshooting)

---

## 🎯 Iniciar Aplicação

### Backend
```powershell
cd C:\Users\pablo\OneDrive\Documentos\Oslo
.\start-backend.ps1
```

### Frontend (novo terminal)
```powershell
cd C:\Users\pablo\OneDrive\Documentos\Oslo
.\start-frontend.ps1
```

### Acessar no Navegador
```
http://localhost:3000
```

**Login:**
- Email: `admin@hospital.com`
- Senha: `Admin123!`

---

## ⚙️ Configuração Inicial

### 1. Gerar Session Secret
```powershell
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

### 2. Configurar Backend
Edite `backend/.env`:
```bash
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_KEY=eyJhbGc...
SESSION_SECRET_KEY=cole-o-secret-gerado-acima
```

### 3. Configurar Frontend
Edite `frontend/.env.local`:
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
```

---

## 🗄️ Comandos SQL

### Criar Perfil para Usuário
```sql
INSERT INTO hospitals (id, name) 
VALUES ('00000000-0000-0000-0000-000000000001', 'Hospital Teste')
ON CONFLICT (id) DO NOTHING;

INSERT INTO profiles (id, hospital_id, full_name, role, is_focal_point)
VALUES (
  'COLE_O_USER_UID_AQUI',
  '00000000-0000-0000-0000-000000000001',
  'Admin Teste',
  'manager',
  false
);
```

### Verificar Tabelas
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;
```

### Ver Usuários
```sql
SELECT id, email, created_at
FROM auth.users
ORDER BY created_at DESC;
```

### Ver Perfis
```sql
SELECT id, full_name, role, hospital_id
FROM profiles
WHERE deleted_at IS NULL;
```

### Ver Trilhas
```sql
SELECT id, title, description, created_at
FROM tracks
WHERE deleted_at IS NULL
ORDER BY created_at DESC;
```

---

## 🧪 Testes e Debug

### Health Check Backend
```powershell
curl http://localhost:8000/health
```

### Abrir API Docs
```powershell
start http://localhost:8000/docs
```

### Abrir Frontend
```powershell
start http://localhost:3000
```

### Ver Logs
Os logs aparecem automaticamente nos terminais onde backend e frontend estão rodando.

---

## 🐛 Troubleshooting

### Porta 8000 em Uso
```powershell
# Encontrar processo
netstat -ano | findstr :8000

# Matar processo (substitua 1234 pelo PID)
taskkill /PID 1234 /F
```

### Porta 3000 em Uso
```powershell
# Encontrar processo
netstat -ano | findstr :3000

# Matar processo (substitua 1234 pelo PID)
taskkill /PID 1234 /F
```

### Reinstalar Dependências Backend
```powershell
cd backend
Remove-Item -Recurse -Force venv
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

### Reinstalar Dependências Frontend
```powershell
cd frontend
Remove-Item -Recurse -Force node_modules, package-lock.json
npm install
```

---

## 📊 URLs Importantes

| Serviço | URL | Descrição |
|---------|-----|-----------|
| **Frontend** | http://localhost:3000 | Interface da aplicação |
| **Login** | http://localhost:3000/login | Página de login |
| **Dashboard** | http://localhost:3000/dashboard | Dashboard principal |
| **Backend API** | http://localhost:8000 | API REST |
| **API Docs** | http://localhost:8000/docs | Documentação Swagger |
| **Health Check** | http://localhost:8000/health | Status do backend |
| **Supabase** | https://app.supabase.com | Dashboard do Supabase |

---

## 📚 Guias Completos

- **Início Rápido**: [INICIO_RAPIDO.md](./INICIO_RAPIDO.md)
- **Guia Completo Web**: [COMO_RODAR_NA_WEB.md](./COMO_RODAR_NA_WEB.md)
- **Guia Localhost**: [LOCALHOST_TESTING_GUIDE.md](./LOCALHOST_TESTING_GUIDE.md)
- **Checklist de Testes**: [TESTING_CHECKLIST.md](./TESTING_CHECKLIST.md)
- **Comandos Prontos**: [COMANDOS_PRONTOS.md](./COMANDOS_PRONTOS.md)

---

## 🔐 Credenciais de Teste

```
Email:    admin@hospital.com
Senha:    Admin123!
Role:     manager
Hospital: Hospital Teste
```

---

## 📦 Verificar Versões

```powershell
python --version  # Deve ser 3.9+
node --version    # Deve ser 18+
npm --version
```

---

## 🗂️ Migrações SQL (Ordem de Execução)

Execute no Supabase SQL Editor, nesta ordem:

1. ✅ `001_initial_schema.sql`
2. ✅ `002_rls_policies_fixed.sql` ⚠️ **Use o _fixed**
3. ✅ `003_triggers.sql`
4. ✅ `004_seed_data.sql`
5. ✅ `005_performance_indexes.sql`

---

## ✅ Checklist Rápido

Antes de começar:
- [ ] Python 3.9+ instalado
- [ ] Node.js 18+ instalado
- [ ] Projeto Supabase criado
- [ ] Migrações SQL executadas (5 arquivos)
- [ ] Usuário de teste criado no Supabase
- [ ] Perfil criado para o usuário (SQL)
- [ ] `backend/.env` configurado
- [ ] `frontend/.env.local` configurado
- [ ] Backend rodando em :8000
- [ ] Frontend rodando em :3000
- [ ] Login funcionando

**Tudo OK? Você está pronto! 🎉**
