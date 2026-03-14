# PRD do Backend — SL Academy

Este documento detalha a arquitetura, regras de negócio e estrutura do backend para a SL Academy.

## 1. Resumo do Produto
- **Visão**: Plataforma híbrida (educação + gestão) para hospitais, focada em aulas curtas (5-15 min) e acompanhamento de indicadores para melhorar a adesão a protocolos e segurança do paciente.
- **Público**: Médicos (Alunos) e Gestores/Diretoria (Gestão).
- **Monetização**: Venda única — contrato fechado por projeto/pacote de treinamento por hospital.
- **Stack Backend**: FastAPI (Python) + Supabase (PostgreSQL, Auth, Storage, RLS).

## 2. Requisitos Funcionais (Backend)
- **Autenticação**: Integrar com Auth do Supabase. Sessão gerenciada via cookies encriptados no Frontend (iron-session), repassando o JWT/Context para o FastAPI.
- **Controle de Acesso**: Suporte a RBAC (Manager vs Doctor) e isolamento Muti-Tenant obrigatório (por `hospital_id`).
- **Core de Dados**: CRUD completo para Trilhas (`tracks`), Aulas (`lessons`), Questões (`questions`), Tentativas de Teste (`test_attempts`), e Dúvidas (`doubts`).
- **Indicadores**: Rotas para leitura de indicadores (`indicators`) e importação em lote a partir do Google Sheets/Drive ou planilhas enviadas pelos gestores.
- **Integração de IA**: Chamadas diretas (ex: OpenAI API) em rotas do FastAPI para sugerir aulas e resumir dúvidas; sem uso de frameworks pesados (como LangGraph) no MVP.

## 3. Database Schema (PostgreSQL via Supabase)

### Tabelas Principais
- **hospitals**: `id (uuid)`, `name (text)`, `created_at`, `deleted_at`.
- **profiles**: `id (uuid, FK auth.users)`, `hospital_id (FK hospitals)`, `full_name (text)`, `role (enum: manager, doctor)`, `is_focal_point (bool)`, `created_at`, `deleted_at`.
- **tracks**: `id (uuid)`, `title (text)`, `description (text)`, `hospital_id (FK hospitals)`, `created_at`, `deleted_at`.
- **lessons**: `id (uuid)`, `track_id (FK tracks)`, `title (text)`, `description (text)`, `video_url (text)`, `duration_seconds (int)`, `order (int)`, `created_at`, `deleted_at`.
- **questions**: `id (uuid)`, `lesson_id (FK lessons)`, `type (enum: pre, post)`, `question_text (text)`, `options (jsonb)`, `correct_option_index (int)`, `created_at`, `deleted_at`.
- **test_attempts**: `id (uuid)`, `profile_id (FK profiles)`, `lesson_id (FK lessons)`, `type (enum: pre, post)`, `score (numeric)`, `answers (jsonb)`, `started_at`, `completed_at`.
- **doubts**: `id (uuid)`, `profile_id (FK profiles)`, `lesson_id (FK lessons)`, `text (text)`, `status (enum: pending, answered)`, `answer (text)`, `answered_by (FK profiles)`, `ai_summary (text)`, `created_at`, `deleted_at`.
- **indicators**: `id (uuid)`, `hospital_id (FK hospitals)`, `name (text)`, `value (numeric)`, `category (text)`, `reference_date (date)`, `created_at`, `deleted_at`.

### Integridade e Segurança de Dados (Database)
- **RLS (Row Level Security)**: Todas as tabelas têm políticas que filtram pelo `hospital_id` vinculado ao usuário logado, proibindo estritamente acesso cruzado.
- **Triggers**:
  - `updated_at` atualizado em todas as modificações.
  - Automático: criar registro em `profiles` pós criação no `auth.users`.
- **Soft Delete**: Adicionar views ou regras globais nas queries para suprimir dados com `deleted_at IS NOT NULL`.

## 4. Arquitetura de Endpoints (FastAPI)

### Aulas e Trilhas
- `GET /api/tracks`: Lista trilhas visíveis ao usuário logado.
- `GET /api/tracks/{id}/lessons`: Lista aulas associadas a uma trilha.
- `GET /api/lessons/{id}`: Detalhe da aula.
- `GET /api/lessons/{id}/questions`: Busca o array de questões pré ou pós-aula.

### Interação
- `POST /api/test-attempts`: Salva nota e histórico de respostas (`answers` em JSON) da tentativa do aluno.
- `GET /api/doubts`: Lista as dúvidas. Para gestores = Kanban board; para médicos = histórico próprio.
- `POST /api/doubts`: Médico envia dúvida (pode conter upload de URL do Storage).
- `PATCH /api/doubts/{id}`: Gestor envia a resposta (preenche `answer`, `answered_by` e `status`).

### Gestão
- `GET /api/indicators`: Resgata indicadores gráficos.
- `POST /api/indicators/import`: Recebe payload mapeado para injeção bulk de indicadores (origem CSV/Google Sheets).

### Inteligência Artificial
- `POST /api/generate-recommendations`: Calcula score das respostas e pede recomendação de aulas à LLM.

## 5. Security Checklist (Backend)
- [ ] Validar e aplicar `RlS Policies` de multi-tenancy em TODAS as migrations do Supabase.
- [ ] Validar DTOs de Request de Entradas via **Pydantic** para impedir injeções manuais e sujeira de dados.
- [ ] Criação de buckets isolados no Supabase Storage: bucket de dúvidas com restrição de visibilidade de imagens. O backend não recebe a imagem crua, apenas valida permissão ou salva a URL referenciada.
- [ ] O backend **nunca confia no front**; sempre decodifica o auth user_id do token/header passado e varre base com ele ativo no contexto (set local do postgREST via cliente local).

## 6. Stack e Dependências (requirements.txt base)
- `fastapi`
- `uvicorn`
- `pydantic`
- `supabase`
- `openai` (ou equivalentes genéricos de api rest LLM)
- `python-dotenv`
