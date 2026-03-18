# Guia de Teste em Localhost - SL Academy Platform

## Pré-requisitos

### 1. Software Necessário

- **Python 3.9+**: `python --version`
- **Node.js 18+**: `node --version`
- **npm 9+**: `npm --version`
- **Redis** (opcional, para caching): `redis-cli ping`
- **Conta Supabase**: https://supabase.com (gratuita)

### 2. Instalar Redis (Opcional)

```bash
# Ubuntu/Debian
sudo apt-get install redis-server
sudo systemctl start redis

# macOS
brew install redis
brew services start redis

# Windows (via WSL)
wsl sudo apt-get install redis-server
wsl sudo service redis-server start

# Verificar
redis-cli ping
# Deve retornar: PONG
```

## Configuração Inicial

### 1. Configurar Supabase

1. Acesse https://supabase.com e crie uma conta
2. Crie um novo projeto
3. Aguarde a criação do projeto (2-3 minutos)
4. Vá em **Project Settings > API**
5. Copie:
   - Project URL
   - anon/public key
   - service_role key (mantenha secreto!)

### 2. Executar Migrações do Banco de Dados

1. Vá em **SQL Editor** no Supabase Dashboard
2. Execute as migrações na ordem:
   ```
   supabase/migrations/001_initial_schema.sql
   supabase/migrations/002_rls_policies_fixed.sql  ⚠️ Use o arquivo _fixed
   supabase/migrations/003_triggers.sql
   supabase/migrations/004_seed_data.sql
   supabase/migrations/005_performance_indexes.sql
   ```

**⚠️ IMPORTANTE**: Use o arquivo `002_rls_policies_fixed.sql` em vez do `002_rls_policies.sql` para evitar o erro "permission denied for schema auth". Veja [SUPABASE_RLS_FIX.md](./SUPABASE_RLS_FIX.md) para detalhes.

3. Verifique se as tabelas foram criadas:
   ```sql
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public';
   ```

### 3. Configurar Backend

```bash
# Navegar para o diretório backend
cd backend

# Criar ambiente virtual Python
python -m venv venv

# Ativar ambiente virtual
# Windows (PowerShell)
.\venv\Scripts\Activate.ps1

# Windows (CMD)
.\venv\Scripts\activate.bat

# Linux/macOS
source venv/bin/activate

# Instalar dependências
pip install -r requirements.txt

# Copiar arquivo de configuração
cp .env.example .env

# Editar .env com suas credenciais do Supabase
# Use um editor de texto (notepad, vim, nano, etc.)
```

### 4. Editar backend/.env

Abra `backend/.env` e configure:

```bash
# Supabase (obrigatório)
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_ANON_KEY=sua-anon-key
SUPABASE_SERVICE_KEY=sua-service-role-key

# Session Secret (gerar novo)
# Execute: python -c "import secrets; print(secrets.token_urlsafe(32))"
SESSION_SECRET_KEY=sua-chave-secreta-gerada

# OpenAI (opcional - deixe vazio se não tiver)
OPENAI_API_KEY=

# Redis (opcional - deixe padrão se instalou Redis)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Resto pode deixar como está
```

### 5. Configurar Frontend

```bash
# Navegar para o diretório frontend
cd ../frontend

# Instalar dependências
npm install

# Copiar arquivo de configuração
cp .env.example .env.local

# Editar .env.local
```

### 6. Editar frontend/.env.local

Abra `frontend/.env.local` e configure:

```bash
# API Backend
NEXT_PUBLIC_API_URL=http://localhost:8000

# Supabase (mesmas credenciais do backend)
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key
```

## Iniciar Aplicação

### Opção 1: Iniciar Manualmente (Recomendado para Teste)

**Terminal 1 - Backend:**
```bash
cd backend
# Ativar venv se não estiver ativo
source venv/bin/activate  # Linux/macOS
# ou
.\venv\Scripts\Activate.ps1  # Windows

# Iniciar servidor
python main.py
```

Você deve ver:
```
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

Você deve ver:
```
  ▲ Next.js 16.1.6
  - Local:        http://localhost:3000
  - Ready in 2.5s
```

### Opção 2: Usar Scripts de Inicialização

Vou criar scripts para facilitar:



## Testar a Aplicação

### 1. Verificar Backend

Abra o navegador em: http://localhost:8000

Você deve ver:
```json
{
  "message": "SL Academy Platform API",
  "version": "1.0.0",
  "docs": "/docs"
}
```

**Testar documentação da API:**
- Acesse: http://localhost:8000/docs
- Você verá a documentação interativa do Swagger

**Testar health check:**
```bash
curl http://localhost:8000/health
```

### 2. Verificar Frontend

Abra o navegador em: http://localhost:3000

Você deve ver a página de login da SL Academy Platform.

### 3. Criar Usuário de Teste

**Opção A: Via Supabase Dashboard**

1. Vá em **Authentication > Users** no Supabase Dashboard
2. Clique em **Add User**
3. Preencha:
   - Email: `admin@hospital.com`
   - Password: `Admin123!`
   - Auto Confirm User: ✓ (marque)
4. Clique em **Create User**

**Opção B: Via SQL**

Execute no SQL Editor do Supabase:

```sql
-- Criar hospital de teste
INSERT INTO hospitals (id, name) 
VALUES ('00000000-0000-0000-0000-000000000001', 'Hospital Teste')
ON CONFLICT (id) DO NOTHING;

-- Criar usuário no Supabase Auth (você precisa fazer isso via Dashboard)
-- Depois, criar perfil:
INSERT INTO profiles (id, hospital_id, full_name, role, is_focal_point)
VALUES (
  'user-id-do-supabase-auth',  -- Substitua pelo ID do usuário criado
  '00000000-0000-0000-0000-000000000001',
  'Admin Teste',
  'manager',
  false
);
```

### 4. Fazer Login

1. Acesse http://localhost:3000/login
2. Digite:
   - Email: `admin@hospital.com`
   - Password: `Admin123!`
   - Marque: ✓ Aceito os termos
3. Clique em **Entrar**

Se tudo estiver correto, você será redirecionado para o dashboard!

### 5. Testar Funcionalidades

#### 5.1 Criar Track

1. Vá em **Gestão > Trilhas**
2. Clique em **Nova Trilha**
3. Preencha:
   - Título: "Cardiologia Básica"
   - Descrição: "Introdução à cardiologia"
4. Clique em **Criar**

#### 5.2 Criar Lesson

1. Clique na trilha criada
2. Clique em **Nova Aula**
3. Preencha:
   - Título: "Anatomia do Coração"
   - Descrição: "Estrutura básica do coração"
   - URL do Vídeo: `https://www.youtube.com/watch?v=dQw4w9WgXcQ`
   - Duração: 600 (segundos)
   - Ordem: 1
4. Clique em **Criar**

#### 5.3 Testar Cache (se Redis estiver rodando)

```bash
# Verificar cache stats
curl http://localhost:8000/api/admin/cache/stats \
  -H "Cookie: session=sua-session-cookie"

# Ou acesse via navegador (precisa estar logado como manager)
# http://localhost:8000/api/admin/cache/stats
```

#### 5.4 Testar Dúvidas

1. Vá em **Minhas Dúvidas**
2. Clique em **Nova Dúvida**
3. Preencha:
   - Texto: "Como funciona a circulação sanguínea?"
   - Selecione uma aula
4. Clique em **Enviar**

## Troubleshooting

### Backend não inicia

**Erro: "ModuleNotFoundError"**
```bash
# Certifique-se de que o venv está ativo
source venv/bin/activate  # Linux/macOS
.\venv\Scripts\Activate.ps1  # Windows

# Reinstale as dependências
pip install -r requirements.txt
```

**Erro: "Connection refused" (Supabase)**
```bash
# Verifique se as credenciais estão corretas no .env
# Verifique se o projeto Supabase está ativo
```

**Erro: "Redis connection failed"**
```bash
# Se não quiser usar Redis, comente as linhas no backend/core/cache.py
# Ou inicie o Redis:
redis-server

# Ou desabilite o cache no .env:
CACHE_ENABLED=false
```

### Frontend não inicia

**Erro: "Module not found"**
```bash
# Limpe e reinstale
rm -rf node_modules package-lock.json
npm install
```

**Erro: "Port 3000 already in use"**
```bash
# Use outra porta
PORT=3001 npm run dev
```

### Login não funciona

**Erro: "Invalid credentials"**
- Verifique se o usuário foi criado no Supabase Auth
- Verifique se o perfil foi criado na tabela `profiles`
- Verifique se o `hospital_id` está correto

**Erro: "CORS error"**
- Verifique se `CORS_ORIGINS` no backend/.env inclui `http://localhost:3000`
- Reinicie o backend após alterar .env

### Cache não funciona

```bash
# Verificar se Redis está rodando
redis-cli ping
# Deve retornar: PONG

# Se não estiver, inicie:
redis-server

# Verificar logs do backend para erros de Redis
```

## Comandos Úteis

### Backend

```bash
# Iniciar backend
cd backend
python main.py

# Rodar testes
pytest

# Rodar testes de cache
pytest backend/tests/test_cache.py -v

# Ver logs em tempo real
tail -f logs/app.log
```

### Frontend

```bash
# Iniciar frontend
cd frontend
npm run dev

# Build para produção
npm run build

# Iniciar produção
npm start

# Rodar linter
npm run lint

# Type check
npm run type-check
```

### Redis

```bash
# Iniciar Redis
redis-server

# Conectar ao Redis CLI
redis-cli

# Ver todas as chaves
redis-cli KEYS "*"

# Ver estatísticas
redis-cli INFO stats

# Limpar cache
redis-cli FLUSHDB
```

### Supabase

```bash
# Ver logs em tempo real (no Dashboard)
# Logs > Postgres Logs

# Executar query
# SQL Editor > New Query
```

## Próximos Passos

Após testar localmente:

1. **Adicionar dados de teste**:
   - Criar mais trilhas e aulas
   - Criar questões de pré e pós-teste
   - Importar indicadores

2. **Testar fluxo completo**:
   - Fazer pré-teste
   - Assistir vídeo
   - Fazer pós-teste
   - Ver recomendações de IA (se configurou OpenAI)

3. **Testar como diferentes roles**:
   - Criar usuário doctor
   - Criar usuário manager
   - Testar permissões

4. **Monitorar performance**:
   - Ver cache hit rate
   - Ver tempo de resposta das APIs
   - Ver uso de memória

## Recursos Adicionais

- **Documentação da API**: http://localhost:8000/docs
- **Supabase Dashboard**: https://app.supabase.com
- **Redis Commander** (GUI para Redis): `npm install -g redis-commander && redis-commander`

## Suporte

Se encontrar problemas:

1. Verifique os logs do backend
2. Verifique o console do navegador (F12)
3. Verifique os logs do Supabase Dashboard
4. Consulte a documentação em `docs/`
