# 🌐 Como Ver a Aplicação Rodando na Web

## Passo a Passo Completo

### 📋 Pré-requisitos Rápidos

- [ ] Python 3.9+ instalado
- [ ] Node.js 18+ instalado
- [ ] Conta Supabase criada

---

## 🚀 PARTE 1: Configurar Supabase (10 minutos)

### 1.1 Criar Projeto no Supabase

1. Acesse: https://supabase.com
2. Clique em **"Start your project"** ou **"New Project"**
3. Preencha:
   - **Name**: `sl-academy` (ou qualquer nome)
   - **Database Password**: Crie uma senha forte (anote!)
   - **Region**: Escolha o mais próximo (ex: South America)
4. Clique em **"Create new project"**
5. ⏳ Aguarde 2-3 minutos (o projeto está sendo criado)

### 1.2 Executar Migrações SQL

Quando o projeto estiver pronto:

1. No menu lateral, clique em **"SQL Editor"**
2. Clique em **"New query"**

**Execute cada migração na ordem (copie e cole cada arquivo):**

#### Migração 1: Schema Inicial
```
📁 Abra: supabase/migrations/001_initial_schema.sql
📋 Copie TODO o conteúdo
📝 Cole no SQL Editor
▶️ Clique em "Run" (canto inferior direito)
✅ Aguarde "Success. No rows returned"
```

#### Migração 2: RLS Policies (IMPORTANTE: use o arquivo _fixed)
```
📁 Abra: supabase/migrations/002_rls_policies_fixed.sql
📋 Copie TODO o conteúdo
📝 Cole no SQL Editor (nova query)
▶️ Clique em "Run"
✅ Aguarde "Success"
```

#### Migração 3: Triggers
```
📁 Abra: supabase/migrations/003_triggers.sql
📋 Copie TODO o conteúdo
📝 Cole no SQL Editor (nova query)
▶️ Clique em "Run"
✅ Aguarde "Success"
```

#### Migração 4: Dados de Teste
```
📁 Abra: supabase/migrations/004_seed_data.sql
📋 Copie TODO o conteúdo
📝 Cole no SQL Editor (nova query)
▶️ Clique em "Run"
✅ Aguarde "Success"
```

#### Migração 5: Índices de Performance
```
📁 Abra: supabase/migrations/005_performance_indexes.sql
📋 Copie TODO o conteúdo
📝 Cole no SQL Editor (nova query)
▶️ Clique em "Run"
✅ Aguarde "Success"
```

### 1.3 Copiar Credenciais do Supabase

1. No menu lateral, clique em **"Project Settings"** (ícone de engrenagem)
2. Clique em **"API"**
3. Você verá:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public**: `eyJhbGc...` (chave pública)
   - **service_role**: `eyJhbGc...` (chave secreta - clique em "Reveal")

**📝 ANOTE ESSAS 3 INFORMAÇÕES!** Você vai precisar delas.

### 1.4 Criar Usuário de Teste

1. No menu lateral, clique em **"Authentication"**
2. Clique em **"Users"**
3. Clique em **"Add user"** (botão verde)
4. Preencha:
   - **Email**: `admin@hospital.com`
   - **Password**: `Admin123!`
   - ✅ Marque: **"Auto Confirm User"**
5. Clique em **"Create user"**
6. **Copie o User UID** que aparece (algo como `a1b2c3d4-...`)

### 1.5 Criar Perfil para o Usuário

1. Volte para **"SQL Editor"**
2. Execute este SQL (substitua `USER_UID_AQUI` pelo UID copiado):

```sql
-- Criar hospital de teste primeiro
INSERT INTO hospitals (id, name) 
VALUES ('00000000-0000-0000-0000-000000000001', 'Hospital Teste')
ON CONFLICT (id) DO NOTHING;

-- Criar perfil para o usuário de teste
INSERT INTO profiles (id, hospital_id, full_name, role, is_focal_point)
VALUES (
  'c213095d-80d0-4beb-92b0-1c69b16866ce',  -- ⚠️ SUBSTITUA pelo UID do usuário
  '00000000-0000-0000-0000-000000000001',  -- Hospital de teste
  'Admin Teste',
  'manager',
  false
);
```

✅ Pronto! Supabase configurado!

---

## 💻 PARTE 2: Configurar Backend (5 minutos)

### 2.1 Abrir Terminal no Projeto

1. Abra o **PowerShell** ou **Terminal**
2. Navegue até a pasta do projeto:
   ```powershell
   cd C:\Users\pablo\OneDrive\Documentos\Oslo
   ```

### 2.2 Executar Script de Inicialização

```powershell
.\start-backend.ps1
```

**O que vai acontecer:**
1. ✅ Cria ambiente virtual Python
2. ✅ Instala dependências
3. ✅ Cria arquivo `backend/.env`
4. ⚠️ **PARA e pede para você editar o .env**

### 2.3 Editar backend/.env

1. Abra o arquivo: `backend/.env` (use Notepad ou VS Code)
2. Encontre estas linhas e **substitua** com suas credenciais do Supabase:

```bash
# Supabase (OBRIGATÓRIO - cole suas credenciais aqui)
SUPABASE_URL=https://xxxxx.supabase.co  # ⚠️ Cole seu Project URL
SUPABASE_ANON_KEY=eyJhbGc...  # ⚠️ Cole sua anon key
SUPABASE_SERVICE_KEY=eyJhbGc...  # ⚠️ Cole sua service_role key

# Session Secret (OBRIGATÓRIO - gere uma chave)
SESSION_SECRET_KEY=sua-chave-aqui  # ⚠️ Veja abaixo como gerar
```

**Para gerar SESSION_SECRET_KEY:**
```powershell
python -c "import secrets; print(secrets.token_urlsafe(32))"
```
Copie o resultado e cole no `.env`

3. **Salve o arquivo** (Ctrl+S)

### 2.4 Iniciar Backend Novamente

```powershell
.\start-backend.ps1
```

**Você deve ver:**
```
✅ Backend pronto!
🌐 Iniciando servidor em http://localhost:8000
📚 Documentação da API: http://localhost:8000/docs

INFO:     Uvicorn running on http://0.0.0.0:8000
```

✅ **Backend rodando!** Deixe este terminal aberto.

---

## 🎨 PARTE 3: Configurar Frontend (5 minutos)

### 3.1 Abrir NOVO Terminal

1. Abra um **NOVO PowerShell/Terminal** (não feche o anterior!)
2. Navegue até a pasta do projeto:
   ```powershell
   cd C:\Users\pablo\OneDrive\Documentos\Oslo
   ```

### 3.2 Executar Script de Inicialização

```powershell
.\start-frontend.ps1
```

**O que vai acontecer:**
1. ✅ Instala dependências do Node.js (pode demorar 2-3 min)
2. ✅ Cria arquivo `frontend/.env.local`
3. ⚠️ **PARA e pede para você editar o .env.local**

### 3.3 Editar frontend/.env.local

1. Abra o arquivo: `frontend/.env.local`
2. Encontre estas linhas e **substitua**:

```bash
# API Backend
NEXT_PUBLIC_API_URL=http://localhost:8000

# Supabase (mesmas credenciais do backend)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co  # ⚠️ Cole seu Project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...  # ⚠️ Cole sua anon key
```

3. **Salve o arquivo** (Ctrl+S)

### 3.4 Iniciar Frontend Novamente

```powershell
.\start-frontend.ps1
```

**Você deve ver:**
```
✅ Frontend pronto!
🌐 Iniciando servidor em http://localhost:3000

  ▲ Next.js 16.1.6
  - Local:        http://localhost:3000
  - Ready in 2.5s
```

✅ **Frontend rodando!** Deixe este terminal aberto também.

---

## 🎉 PARTE 4: Acessar a Aplicação na Web!

### 4.1 Abrir no Navegador

1. Abra seu navegador (Chrome, Edge, Firefox)
2. Acesse: **http://localhost:3000**

**Você deve ver a página de login da SL Academy! 🎊**

### 4.2 Fazer Login

1. Digite:
   - **Email**: `admin@hospital.com`
   - **Senha**: `Admin123!`
   - ✅ Marque: **"Aceito os termos de serviço e política de privacidade"**
2. Clique em **"Entrar"**

**🎉 Você está dentro!** Deve ver o dashboard da aplicação.

---

## 🧪 PARTE 5: Testar Funcionalidades

### 5.1 Criar uma Trilha

1. No menu lateral, clique em **"Gestão"** → **"Trilhas"**
2. Clique em **"Nova Trilha"** (botão no canto superior direito)
3. Preencha:
   - **Título**: `Cardiologia Básica`
   - **Descrição**: `Introdução aos conceitos de cardiologia`
4. Clique em **"Criar"**

✅ Trilha criada!

### 5.2 Criar uma Aula

1. Clique na trilha que você acabou de criar
2. Clique em **"Nova Aula"**
3. Preencha:
   - **Título**: `Anatomia do Coração`
   - **Descrição**: `Estrutura e funcionamento do coração`
   - **URL do Vídeo**: `https://www.youtube.com/watch?v=dQw4w9WgXcQ`
   - **Duração**: `600` (segundos)
   - **Ordem**: `1`
4. Clique em **"Criar"**

✅ Aula criada!

### 5.3 Explorar o Dashboard

1. Clique em **"Dashboard"** no menu lateral
2. Você verá:
   - Estatísticas gerais
   - Gráficos (se houver dados)
   - Indicadores

### 5.4 Testar Dúvidas

1. Clique em **"Dúvidas"** no menu lateral
2. Clique em **"Nova Dúvida"**
3. Preencha:
   - **Texto**: `Como funciona a circulação sanguínea?`
   - **Selecione a aula** que você criou
4. Clique em **"Enviar"**

✅ Dúvida criada!

---

## 📊 URLs Importantes

| O que é | URL | Descrição |
|---------|-----|-----------|
| **Frontend** | http://localhost:3000 | Interface da aplicação |
| **Login** | http://localhost:3000/login | Página de login |
| **Dashboard** | http://localhost:3000/dashboard | Dashboard principal |
| **Backend API** | http://localhost:8000 | API REST |
| **API Docs** | http://localhost:8000/docs | Documentação Swagger |
| **Health Check** | http://localhost:8000/health | Status do backend |

---

## 🔍 Verificar se Está Tudo Funcionando

### Backend está OK?
```powershell
# Em um novo terminal
curl http://localhost:8000/health
```

Deve retornar:
```json
{
  "status": "healthy",
  "environment": "development",
  "version": "1.0.0"
}
```

### Frontend está OK?
Abra http://localhost:3000 - deve ver a página de login.

### Supabase está OK?
Vá no Supabase Dashboard → **Table Editor** → deve ver as tabelas criadas.

---

## 🐛 Problemas Comuns

### "Cannot connect to Supabase"
- ✅ Verifique se as credenciais no `.env` estão corretas
- ✅ Verifique se o projeto Supabase está ativo (não pausado)
- ✅ Teste a URL do Supabase no navegador

### "Port 8000 already in use"
```powershell
# Encontrar processo usando a porta
netstat -ano | findstr :8000

# Matar o processo (substitua PID)
taskkill /PID <PID> /F
```

### "Port 3000 already in use"
```powershell
# Use outra porta
$env:PORT=3001; npm run dev
```

### "Login não funciona"
- ✅ Verifique se criou o perfil no SQL (Parte 1.5)
- ✅ Verifique se o User UID está correto
- ✅ Tente criar o usuário novamente no Supabase

### "Página em branco"
- ✅ Abra o DevTools (F12) e veja o Console
- ✅ Verifique se o backend está rodando
- ✅ Verifique se as credenciais do `.env.local` estão corretas

---

## 📸 Como Deve Parecer

### Página de Login
- Formulário com email e senha
- Checkbox de aceitar termos
- Botão "Entrar"

### Dashboard (após login)
- Menu lateral com navegação
- Header com nome do usuário
- Área principal com conteúdo

### Gestão de Trilhas
- Lista de trilhas
- Botão "Nova Trilha"
- Cards com informações das trilhas

---

## 🎓 Próximos Passos

Depois de ver funcionando:

1. ✅ Explore todas as páginas
2. ✅ Crie mais trilhas e aulas
3. ✅ Teste o sistema de dúvidas
4. ✅ Importe indicadores (CSV/XLSX)
5. ✅ Teste como usuário doctor (crie outro usuário)

---

## 💡 Dicas

1. **Mantenha os 2 terminais abertos** (backend e frontend)
2. **Use F12** no navegador para ver erros no console
3. **Consulte os logs** nos terminais se algo não funcionar
4. **Use o Swagger** (http://localhost:8000/docs) para testar a API
5. **Verifique o Supabase Dashboard** para ver os dados no banco

---

## 🆘 Precisa de Ajuda?

1. Consulte: [LOCALHOST_TESTING_GUIDE.md](./LOCALHOST_TESTING_GUIDE.md)
2. Consulte: [TESTING_CHECKLIST.md](./TESTING_CHECKLIST.md)
3. Veja os logs nos terminais
4. Veja o console do navegador (F12)
5. Veja os logs do Supabase Dashboard

---

## ✅ Checklist Rápido

Antes de começar:
- [ ] Supabase: Projeto criado
- [ ] Supabase: Migrações executadas (5 arquivos)
- [ ] Supabase: Usuário de teste criado
- [ ] Supabase: Perfil criado para o usuário
- [ ] Backend: `.env` configurado
- [ ] Backend: Servidor rodando em :8000
- [ ] Frontend: `.env.local` configurado
- [ ] Frontend: Servidor rodando em :3000
- [ ] Navegador: http://localhost:3000 acessível
- [ ] Login: Funcionando com admin@hospital.com

**Tudo marcado? Você está pronto! 🚀**
