# Plano de Implementação — SL Academy

Este documento divide o desenvolvimento da SL Academy em tarefas de 5-15 minutos organizadas por batch, prontas para serem executadas por agentes (ex: Cline) ou desenvolvedores.

---

## Batch 1: Infraestrutura e Setup Inicial
- **Task 1.1: Inicialização do Repositório Frontend** 
  - **Ação**: Criar projeto Next.js 16 (App Router) com TypeScript e Tailwind. Configurar PWA.
  - **Arquivos**: `package.json`, `next.config.mjs`, `app/layout.tsx`.
  - **Verificação**: Rodar `npm run dev` e verificar se a tela inicial padrão renderiza em `localhost:3000`.

- **Task 1.2: Inicialização do Repositório Backend**
  - **Ação**: Criar projeto FastAPI base. Configurar CORS para o Frontend, carregar variáveis de ambiente (Supabase URL/Key).
  - **Arquivos**: `main.py`, `core/config.py`, `requirements.txt`.
  - **Verificação**: Acessar `localhost:8000/docs` e ver o Swagger rodando limpo.

- **Task 1.3: Setup do Supabase e migrations base**
  - **Ação**: Criar projeto no Supabase, pegar chaves e rodar SQL (via interface ou migração local) criando as tabelas `hospitals` e `profiles`.
  - **Arquivos**: `supabase/migrations/001_init.sql`.
  - **Verificação**: Verificar pelo Dashboard do Supabase se as tabelas existem.

## Batch 2: Database Schema e Segurança (RLS)
- **Task 2.1: Criar tabelas core (Tracks, Lessons, Tests, Doubts, Indicators)**
  - **Ação**: Executar script SQL definindo PKs, FKs e os campos mapeados no PRD.
  - **Arquivos**: `supabase/migrations/002_core_tables.sql`.
  - **Verificação**: Popular uma trilha e aula manualmente direto no banco.

- **Task 2.2: Adicionar RLS e Triggers**
  - **Ação**: Adicionar as Policies no Postgres validando o acesso exato por ID de Hospital na role do médico/gestor. Criar os de soft delete (deleted_at IS NULL).
  - **Arquivos**: `supabase/migrations/003_rls_policies.sql`.
  - **Verificação**: Tentar acessar uma linha de um hospital "X" logado no hospital "Y" e garantir que retorne vazio.

## Batch 3: Backend Auth e API de Treinamentos
- **Task 3.1: Middleware de Autenticação FastAPI**
  - **Ação**: Criar dependência `get_current_user` que lê a JWT injetada pelo iron-session e varre a sessão em rotas protegidas.
  - **Arquivos**: `api/deps.py`, `api/routes/auth.py`.
  - **Verificação**: Rota `/api/me` deve devolver 401 sem header/cookie válido e 200 com token de teste injetado.

- **Task 3.2: CRUD e Listagem de Aulas (Visão Médico)**
  - **Ação**: Endpoint para listagem do catálogo de `/api/tracks` e detalhe contendo metadados do vídeo em `/api/lessons/{id}`.
  - **Arquivos**: `api/routes/tracks.py`, `api/routes/lessons.py`.
  - **Verificação**: GET via Swagger e conferir output JSON com as aulas instanciadas na Task 2.1.

## Batch 4: Backend Interação (Provas e Suporte)
- **Task 4.1: Endpoints do Teste (Pré e Pós)**
  - **Ação**: Criar `POST /api/test-attempts` e `GET /api/lessons/{id}/questions` lendo os bancos.
  - **Arquivos**: `api/routes/tests.py`.
  - **Verificação**: Enviar POST com body falso de respostas e conferir no banco se pontuação foi salva.

- **Task 4.2: Gestão de Dúvidas (Dúvidas DB e Kanban estático)**
  - **Ação**: Criar rota `POST /api/doubts` e `PATCH /api/doubts/{id}` simulando a pipeline da abertura ao fechamento com resposta via Suporte Médico/Gestão.
  - **Arquivos**: `api/routes/doubts.py`.
  - **Verificação**: Enviar dúvida via Postman/Swagger e marcá-la como `answered`.

## Batch 5: Frontend Design System & Auth
- **Task 5.1: Layout Base**
  - **Ação**: Criar Sidebar principal responsiva (visível só logado) e Navbar Top. Instalar os cards primários e botões via shadcn/ui. (UI/UX Stitch).
  - **Arquivos**: `app/layout.tsx`, `components/sidebar.tsx`, `tailwind.config.ts`.
  - **Verificação**: Navegar visualmente pelos blocos criados vazios e validar o "Dark Mode".

- **Task 5.2: Tela de Login e Controle Iron Session**
  - **Ação**: Action/Route em Node de `/api/auth/login` validando Supabase e criando o Cookie Server-Side.
  - **Arquivos**: `app/login/page.tsx`, `lib/session.ts`, `app/api/auth/login/route.ts`.
  - **Verificação**: Logar com user de teste e verificar a persistência pós refresh nativo.

## Batch 6: Frontend Pages (Aulas)
- **Task 6.1: Tela de Trilhas (Catálogo)**
  - **Ação**: Página `/tracks` buscando as trilhas, desenhando Cards estilo vitrine via grid CSS.
  - **Arquivos**: `app/tracks/page.tsx`, `components/track-card.tsx`.
  - **Verificação**: Fazer mock fetch simples dos DTOs se API estiver OFF ou plugar na `/api/tracks` e visualizar na tela.

- **Task 6.2: Player e View Imersiva da Aula**
  - **Ação**: Tela `lessons/[id]` renderizando Player Video Padrão full width, adicionando Tabs embaixo para Materiais vs Fórum de Dúvida.
  - **Arquivos**: `app/lessons/[id]/page.tsx`, `components/video-player.tsx`, `components/tabs.tsx`.
  - **Verificação**: Dar Play e preencher o Input Text de Enviar Dúvida (ainda estático, testar apenas mount).

## Batch 7: Integração Front-Backend Avançada (Testes e Dúvidas)
- **Task 7.1: Teste (UI de Múltipla Escolha) e Dúvidas**
  - **Ação**: Acoplar `POST` da aula e testes conectando aos state handlers globais (React Context) se necessário. Criar layout do Kanban board de gestor.
  - **Arquivos**: `app/tests/[id]/page.tsx`, `app/doubts/page.tsx`.
  - **Verificação**: Fazer o fluxo do médico (ver aula -> test -> doubt) na tela real observando os retornos reais (HTTP 201) no Network do DevTools.

## Batch 8: Uploads, Dashboards e Funcionalidade Gestor
- **Task 8.1: Dashboards Resumo e Importação XLS/CSV**
  - **Ação**: View `/dashboard` chamando `/api/indicators` no ServerSide e montando 3 gráficos no `recharts`. Componente extra de "Upload File" pra injetar métricas.
  - **Arquivos**: `app/dashboard/page.tsx`, `components/charts/performance-chart.tsx`.
  - **Verificação**: Logado como Manager (Role de banco Gestor), visualizar o gráfico de métricas "falsas" crescendo após um inject.
- **Task 8.2: Upload Imagens das Dúvidas e Bucket**
  - **Ação**: Configurar o Front pra aceitar foto até 5MB, mandar na API pra assinar no Server Upload no Supabase e atar a URL na `doubts`.
  - **Verificação**: Simular Envio de um arquivo `.png` pelo dev tools, e atestar carregamento da foto na box/kanban de perguntas.

## Batch 9: (Opcional MVP+) IA complementar
- **Task 9.1: Sugestões e IA Resumo de Chat**
  - **Ação**: Ligar o controller da OpenAI (ou Claude) nas chamadas do FastAPI que processam a listagem de recomendações, usando a nota do exame.
  - **Arquivos**: `api/services/ai_service.py`.
  - **Verificação**: Disparar um teste onde o médico erra muito, e notar na devolução JSON que a aula base foi remendada nas "Recomendações Próximos Passos".
