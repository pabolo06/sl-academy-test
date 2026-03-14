# PRD do Frontend — SL Academy

Este documento detalha a arquitetura, interface e regras de UI/UX do frontend da plataforma SL Academy.

## 1. Resumo do Produto
- **Visão**: Plataforma híbrida focada em ensino médico e gestão de indicadores hospitalares.
- **Públicos e Perfis**: Médicos (Treinamentos, Testes e Dúvidas) e Gestores (Dashboards, Kanban de Suporte e Admin).
- **Stack Frontend**: Next.js 16 (App Router), React, Tailwind CSS, shadcn/ui.
- **Design System/Componentização**: Utilização intensa do Stitch para interface moderna. Padrão "dark mode" para área médica (foco imersivo nas aulas) e padrão "clean/analítico" nos dashboards dos gestores (Power BI style).

## 2. Requisitos de UI / UX
- **Responsividade e Distribuição**: PWA configurado (Mobile First). Funciona perfeitamente em telas pequenas para que médicos consumam os vídeos rápido.
- **Estrutura Geral**: Sidebar fixa à esquerda contendo a navegação principal, liberando a área direita (ampla) para visualização do conteúdo ou dashboard. Opcional (Fullscreen) ativado ao entrar na aula gravada.
- **Autenticação**: Formulário de login isolado e seguro repassando tokens (Cookies `httpOnly` via Iron-Session).
- **Sem Landing Page**: Foco 100% no MVP em aplicação acessada pós-login.

## 3. Mapa de Páginas e Rotas (App Router)

### Rotas Públicas
- `/login`: Tela gráfica simples com acesso à plataforma (E-mail e Senha ou Single Sign-on restrito).

### Rotas Autenticadas (Médicos e Gestores)
- `/tracks` (Visão Médico Principal): Lista as trilhas de aprendizado em Cards (Thumbnails estilo Netflix/Hotmart).
- `/lessons/[id]`: Tela imersiva do player de aula.
  - Abas (Tabs UI): Onde o usuário transita entre *Materiais*, *Fórum/Dúvidas rápidas* e *Informações do Treinamento*.
- `/tests/[id]`: Tela de testes pré/pós aula limpo com Múltipla Escolha e pontuação final.
- `/doubts`: Tela para as dúvidas respondidas e abertas da visao do paciente/medico.

### Rotas Autenticadas (Gestores)
- `/dashboard`: Dashboards analíticos consumindo a API de `indicators`. Deve suportar exibição de múltiplos gráficos (Barras, Linhas, e Scorecards) da performance da implantação dos treinamentos na ponta.
- `/doubts` (Gestão): Kanban board usando uma lib drag-n-drop para categorizar dúvidas de "Abertas", "Em Andamento", "Respondidas".
- `/settings`: Área de cadastro de equipe médica (Gerência dos "Pontos Focais" e Perfilamento do Hospital). Módulo de importação de planilhas.

## 4. Componentes Especiais 
- **Player de Vídeo**: Player customizado Tailwind focado em velocidade; sem distração no modal/página da lição. Funcional na versão PWA offscreen.
- **Kanban Board**: Componente de estados (React-beautiful-dnd ou dnd-kit adaptado ao shadcn) exibindo o Card das Dúvidas e permitindo o Gestor adicionar o "answer" (texto). Permite ver anexo da dúvida se houver imagem (Modal lightbox).
- **File Uploader**: Dropzone para receber planilhas em `/settings` (para o gestor) ou enviar imagens na abertura de dúvidas em `/lessons` (para o médico). Tamanho visualizado e validações em input rodando local e server.
- **Gráficos**: Uso de Recharts ou Tremor (base shadcn) nos Dashboards da home `/dashboard`.

## 5. Security Checklist (Frontend)
- [ ] Cookies protegidos (`httpOnly`, `Secure`, `SameSite=lax`) geridos no roteamento Next.js API Routes / Server Actions.
- [ ] Validação rigorosa do Contexto do Usuário logado antes de montar a Sidebar e Menu Híbrido. Proteção de Rotas com base em `role`.
- [ ] Validações de Formulário em tempo real via Zod + React Hook Form impedindo submissão de lixo para a API.
- [ ] Sanitização e Escape em listagens de texto curadoria (Ex: respostas das dúvidas, links em materiais) impedindo ataques XSS.

## 6. Stack e Dependências (package.json base)
- `next`, `react`, `react-dom`
- `tailwindcss`, `postcss`, `autoprefixer`
- Dependências essenciais UX Shadcn/ui: `lucide-react`, `radix-ui`, `class-variance-authority`, `clsx`, `tailwind-merge`
- `iron-session`
- Gráficos: `recharts`
- Formulários: `react-hook-form`, `zod`, `@hookform/resolvers`
