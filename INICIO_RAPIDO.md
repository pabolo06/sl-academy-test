# ⚡ Início Rápido - 3 Passos

## 1️⃣ Supabase (10 min)

### Criar e Configurar

1. **Criar projeto**: https://supabase.com → New Project
2. **Executar SQL**: SQL Editor → Copiar e executar cada arquivo:
   - `001_initial_schema.sql`
   - `002_rls_policies_fixed.sql` ⚠️
   - `003_triggers.sql`
   - `004_seed_data.sql`
   - `005_performance_indexes.sql`

3. **Criar usuário**: Authentication → Users → Add user
   - Email: `admin@hospital.com`
   - Password: `Admin123!`
   - ✅ Auto Confirm User

4. **Criar perfil**: SQL Editor → Execute:
   ```sql
   INSERT INTO profiles (id, hospital_id, full_name, role, is_focal_point)
   VALUES (
     'COLE_O_USER_UID_AQUI',
     '00000000-0000-0000-0000-000000000001',
     'Admin Teste',
     'manager',
     false
   );
   ```

5. **Copiar credenciais**: Project Settings → API
   - Project URL
   - anon key
   - service_role key

---

## 2️⃣ Backend (2 min)

```powershell
# Terminal 1
.\start-backend.ps1

# Edite backend/.env com suas credenciais
# Execute novamente
.\start-backend.ps1
```

**Deve ver**: `Uvicorn running on http://0.0.0.0:8000`

---

## 3️⃣ Frontend (2 min)

```powershell
# Terminal 2 (novo)
.\start-frontend.ps1

# Edite frontend/.env.local com suas credenciais
# Execute novamente
.\start-frontend.ps1
```

**Deve ver**: `Local: http://localhost:3000`

---

## 🎉 Pronto!

**Acesse**: http://localhost:3000

**Login**:
- Email: `admin@hospital.com`
- Senha: `Admin123!`
- ✅ Aceitar termos

---

## 📚 Guias Completos

- **Detalhado**: [COMO_RODAR_NA_WEB.md](./COMO_RODAR_NA_WEB.md)
- **Troubleshooting**: [LOCALHOST_TESTING_GUIDE.md](./LOCALHOST_TESTING_GUIDE.md)
- **Checklist**: [TESTING_CHECKLIST.md](./TESTING_CHECKLIST.md)
