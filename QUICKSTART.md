# SL Academy Platform - Guia de Início Rápido

Este guia ajudará você a configurar e executar a plataforma SL Academy em minutos.

## 📋 Pré-requisitos

- **Node.js** 18+ e npm 9+
- **Python** 3.11+
- **Conta Supabase** (gratuita)
- **Chave API OpenAI** (opcional, para recursos de IA)

## 🚀 Configuração Rápida

### 1. Clone o Repositório

```bash
git clone <repository-url>
cd sl-academy-platform
```

### 2. Configure o Banco de Dados (Supabase)

1. Crie um projeto no [Supabase](https://supabase.com)
2. Vá para **SQL Editor** no dashboard
3. Execute as migrações na ordem:
   - `supabase/migrations/001_init_schema.sql`
   - `supabase/migrations/002_add_consent_timestamp.sql`
   - `supabase/migrations/002_rls_policies.sql`
   - `supabase/migrations/003_triggers.sql`
   - `supabase/migrations/004_audit_logs.sql`

4. Copie suas credenciais:
   - **Project URL**: Settings → API → Project URL
   - **Anon Key**: Settings → API → anon/public key
   - **Service Key**: Settings → API → service_role key

### 3. Configure o Backend

```bash
cd backend

# Crie ambiente virtual
python -m venv venv

# Ative o ambiente (Windows)
venv\Scripts\activate
# Ou no macOS/Linux:
# source venv/bin/activate

# Instale dependências
pip install -r requirements.txt

# Configure variáveis de ambiente
cp .env.example .env
```

Edite `backend/.env`:
```env
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_ANON_KEY=sua-anon-key
SUPABASE_SERVICE_KEY=sua-service-key
SESSION_SECRET_KEY=gere-uma-chave-aleatoria-de-32-caracteres
OPENAI_API_KEY=sk-sua-chave-openai  # Opcional
CORS_ORIGINS=http://localhost:3000
```

```bash
# Inicie o servidor
python main.py
```

✅ Backend rodando em: http://localhost:8000
📚 Documentação da API: http://localhost:8000/docs

### 4. Configure o Frontend

```bash
cd frontend

# Instale dependências
npm install

# Configure variáveis de ambiente
cp .env.example .env.local
```

Edite `frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key
```

```bash
# Inicie o servidor de desenvolvimento
npm run dev
```

✅ Frontend rodando em: http://localhost:3000

## 👥 Criando Usuários de Teste

### Via Supabase Dashboard

1. Vá para **Authentication** → **Users**
2. Clique em **Add user** → **Create new user**
3. Preencha:
   - Email: `gestor@hospital.com`
   - Password: `senha123`
   - Auto Confirm User: ✅

4. Vá para **Table Editor** → **profiles**
5. Encontre o perfil criado automaticamente
6. Edite e defina:
   - `role`: `manager`
   - `hospital_id`: (copie o UUID do hospital)

Repita para criar um médico com `role: doctor`

### Via SQL (Mais Rápido)

Execute no SQL Editor:

```sql
-- Criar hospital
INSERT INTO hospitals (name, cnpj) 
VALUES ('Hospital Teste', '12345678000190')
RETURNING id;

-- Copie o ID do hospital retornado e use abaixo

-- Criar usuário gestor
-- Primeiro crie via Auth UI, depois:
UPDATE profiles 
SET role = 'manager', 
    hospital_id = 'cole-o-id-do-hospital-aqui'
WHERE email = 'gestor@hospital.com';

-- Criar usuário médico
UPDATE profiles 
SET role = 'doctor', 
    hospital_id = 'cole-o-id-do-hospital-aqui'
WHERE email = 'medico@hospital.com';
```

## 🎯 Testando a Plataforma

### Como Gestor

1. Acesse http://localhost:3000/login
2. Login: `gestor@hospital.com` / `senha123`
3. Explore:
   - ✅ Dashboard gerencial com estatísticas
   - ✅ Criar trilhas e aulas
   - ✅ Importar indicadores (CSV/XLSX)
   - ✅ Responder dúvidas no Kanban
   - ✅ Visualizar gráficos e relatórios

### Como Médico

1. Acesse http://localhost:3000/login
2. Login: `medico@hospital.com` / `senha123`
3. Explore:
   - ✅ Ver trilhas disponíveis
   - ✅ Completar workflow: pré-teste → vídeo → pós-teste
   - ✅ Enviar dúvidas com imagens
   - ✅ Ver recomendações de IA
   - ✅ Acompanhar progresso

## 📱 Testando PWA

1. Abra o Chrome/Edge
2. Acesse http://localhost:3000
3. Clique no ícone de instalação na barra de endereço
4. Ou vá em Menu → Instalar SL Academy
5. Teste offline:
   - Desconecte a internet
   - Veja o banner de offline
   - Navegue pelas páginas em cache

## 🔧 Comandos Úteis

### Backend

```bash
# Ativar ambiente virtual
cd backend
venv\Scripts\activate  # Windows
source venv/bin/activate  # macOS/Linux

# Rodar servidor
python main.py

# Verificar dependências
pip list

# Atualizar dependências
pip install -r requirements.txt --upgrade
```

### Frontend

```bash
cd frontend

# Desenvolvimento
npm run dev

# Build de produção
npm run build

# Rodar produção localmente
npm run start

# Verificar tipos TypeScript
npm run type-check

# Lint
npm run lint
```

## 🐛 Solução de Problemas

### Backend não inicia

```bash
# Verifique se o ambiente virtual está ativo
which python  # Deve apontar para venv/

# Reinstale dependências
pip install -r requirements.txt --force-reinstall

# Verifique variáveis de ambiente
cat .env  # Linux/Mac
type .env  # Windows
```

### Frontend não conecta ao backend

1. Verifique se o backend está rodando em http://localhost:8000
2. Confirme `NEXT_PUBLIC_API_URL` em `.env.local`
3. Verifique CORS no backend (deve incluir http://localhost:3000)

### Erro de autenticação

1. Verifique se as migrações foram aplicadas
2. Confirme que o usuário existe em Authentication → Users
3. Verifique se o perfil foi criado automaticamente em profiles
4. Confirme que `hospital_id` e `role` estão definidos

### Erro de RLS (Row Level Security)

```sql
-- Verifique se RLS está habilitado
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- Deve mostrar rowsecurity = true para todas as tabelas

-- Verifique políticas
SELECT * FROM pg_policies WHERE schemaname = 'public';
```

## 🔄 CI/CD e Testes

### Executar Testes Localmente

```bash
# Backend
cd backend
pytest tests/ --cov=. --cov-report=term

# Frontend - Testes unitários
cd frontend
npm run test

# Frontend - Testes E2E
npm run test:e2e

# Verificar qualidade do código
npm run lint
npm run type-check
```

### Pipeline Automatizado

O projeto inclui GitHub Actions para:
- ✅ Testes automáticos em cada PR
- ✅ Verificação de segurança diária
- ✅ Deploy automático para staging/produção
- ✅ Testes E2E antes do deploy

Veja `docs/CI_CD_QUICKSTART.md` para mais detalhes.

## 📚 Próximos Passos

1. **Adicione Dados de Teste**
   - Crie trilhas e aulas
   - Adicione questões de pré e pós-teste
   - Importe indicadores de exemplo

2. **Explore a API**
   - Acesse http://localhost:8000/docs
   - Teste endpoints interativamente
   - Veja exemplos de request/response

3. **Personalize**
   - Ajuste cores em `tailwind.config.ts`
   - Modifique manifest.json para seu hospital
   - Adicione logo e ícones personalizados

4. **Configure CI/CD**
   - Adicione secrets no GitHub
   - Configure ambientes de staging/produção
   - Veja `docs/CI_CD_PIPELINE.md`

5. **Deploy**
   - Configure Railway/Render para backend
   - Configure Vercel/Netlify para frontend
   - Configure domínio personalizado

## 🆘 Suporte

- **Documentação**: Veja `PROJECT_STATUS.md` para status completo
- **Especificações**: `.kiro/specs/sl-academy-platform/`
- **Issues**: Reporte problemas no repositório

## ✅ Checklist de Verificação

- [ ] Banco de dados configurado (5 migrações aplicadas)
- [ ] Backend rodando em http://localhost:8000
- [ ] Frontend rodando em http://localhost:3000
- [ ] Usuário gestor criado e testado
- [ ] Usuário médico criado e testado
- [ ] Trilha de teste criada
- [ ] Aula de teste criada com vídeo
- [ ] Workflow completo testado
- [ ] PWA instalado e testado
- [ ] Consent checkbox testado no login

---

**Tempo estimado de configuração**: 15-20 minutos

**Dificuldade**: ⭐⭐ Intermediário

Boa sorte! 🚀
