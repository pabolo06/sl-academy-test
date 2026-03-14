# Discovery Notes — SL Academy
> Arquivo gerado automaticamente durante o workflow /build-saas.
> Fonte de verdade para geração dos PRDs. Não edite manualmente.

## Visão
- **Problema**: Hospitais enfrentam riscos de segurança do paciente, dificuldade em atingir indicadores e falhas na acreditação devido à baixa adesão a protocolos por profissionais de saúde (muitas vezes médicos pouco treinados).
- **Proposta de Valor**: Plataforma híbrida (educação + gestão) com aulas curtas (5-15 min), treinamento prático in loco com materiais do dia a dia, acompanhamento de indicadores (antes x depois) e formação de médicos líderes ("pontos focais") como replicadores.
- **Público-alvo**: Médicos e equipe clínica (treinamentos), Gestores e diretores hospitalares (gestão e indicadores).
- **Referência**: Sistema de aulas estilo plataforma de cursos online (vídeos com módulos focados) para os médicos, e dashboard de gestão estilo Power BI para os diretores acompanharem consumo e indicadores.
- **Pitch**: Uma plataforma de educação e resultados hospitalares para médicos e gestores que entrega excelência.
## Funcionalidades
- **Core Features**:
  1. Testes de Conhecimento: Avaliações antes e depois de cada aula para medir evolução.
  2. Consumo de Conteúdo: Assistir às aulas que fazem parte de uma trilha guiada de desenvolvimento.
  3. Interação/Suporte: Chat ou envio de dúvidas focadas em como aplicar a teoria na prática médica diária.
- **Uso de IA**: Sim, como complemento (ex: recomendação de aulas, curadoria de dúvidas, etc).
- **Uploads**: Integração com Google Sheets e Google Drive do usuário + opção de upload manual de planilhas.
- **Integrações externas**: Nenhuma no MVP inicial (sem WhatsApp, email marketing, ERP hospitalar por enquanto).
## Monetização
- **Modelo**: Venda única — contrato fechado por projeto/pacote de treinamento por hospital.
- **Faixa de preço**: Média de R$ 20.000 por projeto completo de acreditação/treinamento (*Observação: valor inicial de exemplo, sujeito a alterações*).
## Técnico
- **Stack**: Next.js + FastAPI + Supabase (recomendação padrão robusta).
- **Plataforma**: Web + PWA (Progressive Web App).
## Contexto
- **Visual**: Utilizar as imagens de referência como base. O desenvolvimento e personalização da UI/UX devem ser feitos via **Stitch**.
- **Prazo**: Sem prazo definido.
- **Uso**: Interno (SL Academy).
## PRD — User Stories
- **US1**: Como **Médico**, quero **acessar aulas curtas (5-15 min)** para **aprender protocolos sem interromper minha rotina por muito tempo**.
- **US2**: Como **Médico**, quero **realizar um teste antes e depois da aula** para **visualizar minha própria evolução de conhecimento**.
- **US3**: Como **Médico**, quero **enviar dúvidas práticas por texto** para **entender como aplicar a teoria no material que uso no dia a dia**.
- **US4**: Como **Gestor**, quero **visualizar dashboards de consumo de aulas e indicadores** para **medir a adesão da equipe e garantir a segurança do paciente/acreditação**.
- **US5**: Como **Gestor**, quero **importar dados do Google Sheets/Drive** para **manter os indicadores atualizados sem redigitação**.
- **US6**: Como **Ponto Focal (Médico Líder)**, quero **ter acesso a materiais de apoio** para **ser um replicador eficiente dos treinamentos in loco**.

## PRD — Requisitos Funcionais

### 1. Autenticação e Perfis
- **RF1.1**: O sistema deve permitir o login de usuários (Médicos e Gestores) com controle de acesso (RBAC).
- **RF1.2**: O sistema deve permitir que o Gestor cadastre novos médicos e defina quem são os "Pontos Focais".

### 2. Treinamentos (Visão Médico)
- **RF2.1**: O sistema deve listar as aulas disponíveis organizadas por trilhas de desenvolvimento.
- **RF2.2**: O sistema deve permitir a reprodução de vídeos curtos (5-15 min).
- **RF2.3**: O sistema deve aplicar um formulário de teste (múltipla escolha) antes de iniciar o vídeo e outro após o término.
- **RF2.4**: O sistema deve permitir que o médico envie dúvidas em formato de texto vinculadas a uma aula específica.

### 3. Gestão e Indicadores (Visão Gestor)
- **RF3.1**: O sistema deve apresentar dashboards com gráficos de consumo de aulas e evolução dos testes individuais e por equipe.
- **RF3.2**: O sistema deve permitir a importação de dados de planilhas locais ou diretamente do Google Sheets/Google Drive.
- **RF3.3**: O sistema deve permitir associar indicadores hospitalares externos aos resultados de treinamento na plataforma para correlação.

### 4. Inteligência Artificial (Complemento)
- **RF4.1**: O sistema deve usar IA para sugerir aulas complementares baseadas no desempenho dos testes pŕe/pós.
- **RF4.2**: O sistema deve usar IA para agrupar e resumir dúvidas frequentes enviadas pelos médicos para facilitar a resposta da equipe de suporte.

## PRD — Requisitos Não-Funcionais

### 1. Segurança
- **Segurança de Dados**: Implementação de Row Level Security (RLS) no Supabase para garantir que hospitais e usuários só acessem seus próprios dados.
- **Autenticação**: Sessões seguras via iron-session com cookies encriptados (httpOnly, Secure).
- **Validação**: Todas as entradas de dados devem ser validadas via Pydantic (backend) e Zod (frontend).

### 2. Performance
- **Latência**: Respostas de API (FastAPI) devem ser processadas em menos de 500ms para operações comuns.
- **Vídeo**: Utilizar players otimizados para garantir baixo carregamento em redes móveis (hospitalares).
- **Escalabilidade**: Arquitetura preparada para suportar múltiplos hospitais (multi-tenant) simultâneos.

### 3. UX / Design
- **Estética**: Design premium "dark mode" baseado na referência TES, utilizando Tailwind + shadcn/ui.
- **Mobile First**: Interface totalmente responsiva e instalável como PWA para facilidade de acesso.
- **Acessibilidade**: Cumprir padrões básicos de contraste e navegação por teclado.

## Database — Entidades e Relações

### Tabelas
- **hospitals**: `id (uuid)`, `name (text)`, `created_at`, `deleted_at`.
- **profiles**: `id (uuid, FK auth.users)`, `hospital_id (FK hospitals)`, `full_name (text)`, `role (enum: manager, doctor)`, `is_focal_point (bool)`, `created_at`, `deleted_at`.
- **tracks**: `id (uuid)`, `title (text)`, `description (text)`, `hospital_id (FK hospitals)`, `created_at`, `deleted_at`.
- **lessons**: `id (uuid)`, `track_id (FK tracks)`, `title (text)`, `description (text)`, `video_url (text)`, `duration_seconds (int)`, `order (int)`, `created_at`, `deleted_at`.
- **questions**: `id (uuid)`, `lesson_id (FK lessons)`, `type (enum: pre, post)`, `question_text (text)`, `options (jsonb)`, `correct_option_index (int)`, `created_at`, `deleted_at`.
- **test_attempts**: `id (uuid)`, `profile_id (FK profiles)`, `lesson_id (FK lessons)`, `type (enum: pre, post)`, `score (numeric)`, `answers (jsonb)`, `started_at`, `completed_at`.
- **doubts**: `id (uuid)`, `profile_id (FK profiles)`, `lesson_id (FK lessons)`, `text (text)`, `status (enum: pending, answered)`, `answer (text)`, `answered_by (FK profiles)`, `ai_summary (text)`, `created_at`, `deleted_at`.
- **indicators**: `id (uuid)`, `hospital_id (FK hospitals)`, `name (text)`, `value (numeric)`, `category (text)`, `reference_date (date)`, `created_at`, `deleted_at`.

### Segurança (RLS)
- Todas as tabelas possuem `hospital_id` (direto ou via relação).
- **Políticas**:
  - `SELECT`: Médicos acessam dados do seu próprio hospital. Gestores acessam tudo do hospital.
  - `INSERT/UPDATE`: Apenas gestores podem modificar trilhas e aulas. Médicos apenas criam tentativas de testes e dúvidas.

### Triggers & Automations
- **updated_at**: Atualização automática do timestamp.
- **on_auth_user_created**: Cria automaticamente o registro em `profiles` quando um usuário é criado no Supabase Auth.
- **soft_delete**: Filtro global (ou via view) para ignorar registros onde `deleted_at` não é nulo.

## Backend — Endpoints e Integrações

- **Arquitetura Base**: FastAPI (REST) conectando diretamente ao Supabase via cliente Python.
- **Autenticação**: Middleware validando o cookie de sessão via iron-session e repassando o contexto do usuário.
- **Integrações Externas**: Nenhuma integração de terceiros no MVP (sem disparo de e-mails ou mensagens externas, tudo interno na plataforma SL Academy).
- **Inteligência Artificial**: Chamadas diretas (sem framework de agentes pesados como LangGraph) feitas nas próprias rotas do FastAPI (ex: OpenAI API) para gerar as sugestões e resumos de dúvidas.

### Lista Base de Endpoints:
- `GET /api/tracks`: Lista as trilhas do hospital.
- `GET /api/tracks/{id}/lessons`: Lista aulas de uma trilha.
- `GET /api/lessons/{id}`: Detalhe de uma aula (com vídeo).
- `GET /api/lessons/{id}/questions`: Busca as questões pré ou pós aula.
- `POST /api/test-attempts`: Envia as respostas de um teste.
- `GET /api/doubts` & `POST /api/doubts`: Controle das dúvidas (envio pelos alunos, listagem pelos gestores/time).
- `PATCH /api/doubts/{id}`: Gestor responde à dúvida.
- `GET /api/indicators`: Busca os indicadores para o dashboard do hospital.
- `POST /api/indicators/import`: Rota para receber os dados importados do Sheets/Drive.
- `POST /api/generate-recommendations`: Rota que usa IA para sugerir as próximas aulas com base nos testes.

## Backend — Agent Graph
## Frontend — Páginas e Componentes

- **Layout Base**: Sidebar fixa à esquerda + conteúdo à direita (Dashboard/Settings) e Layout focado (Fullscreen/Imersivo) na área de Aulas.
- **Escopo MVP**: Apenas a aplicação logada (o SaaS em si). Sem Landing Page por enquanto.
- **Componentes Especiais**: 
  - Kanban Board para gestão e resposta de Dúvidas (fluxo de atendimento para a equipe/suporte).
  - Player de vídeo otimizado.
  - Gráficos avançados estilo Power BI para os dashboards.

### Mapa de Páginas (Next.js App Router):
- `/login`: Tela de autenticação centralizada.
- `/dashboard`: Visão do gestor com gráficos de indicadores integrados.
- `/tracks`: Listagem das trilhas de desenvolvimento (Visão Médico).
- `/lessons/[id]`: Tela imersiva de aula (Vídeo estilo TES), abas para material complementar e testes.
- `/tests/[id]`: Formulários de teste pré e pós aula.
- `/doubts`: Kanban board para o suporte (visão da equipe/gestor) e envio simples (visão médico na aula).
- `/settings`: Gestão de usuários e pontos focais (Apenas gestor).

## Frontend — Design System
- **Estilo Geral**: Design premium, "dark mode" imersivo para os médicos (foco no conteúdo) e visual analítico/limpo para os gestores.
- **Ferramental**: Next.js 16 + Tailwind CSS + shadcn/ui.
- **Desenvolvimento Visual**: Uso extensivo do Stitch para personalização avançada de UI/UX, gráficos e componentes.

## Security — Decisões
- **Sessão**: Autenticação via `iron-session` com cookies encriptados (`httpOnly`, `Secure`, `SameSite=Lax`).
- **Isolamento de Dados**: Obrigatório o uso de Row Level Security (RLS) no banco (Supabase) pra garantir o multi-tenant (Isolamento por Hospital).
- **Uploads / Arquivos**:
  - Dúvidas: Médicos podem fazer upload de imagens (ex: fotos de casos clínicos junto com o texto). Sugerido limite de 5MB por imagem.
  - Gestão: Importação de planilhas locais (CSV/XLSX) limitado a 10MB ou via link do Sheets.
  - Armazenamento: Supabase Storage com RLS ativado (somente o hospital dono vê a imagem/planilha).
- **Validações**: `Zod` no frontend e `Pydantic` no backend como barreira explícita de sanitize.
