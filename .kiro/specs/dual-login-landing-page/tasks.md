# Implementation Plan: Dual Login Landing Page

## Overview

Esta implementação modifica a landing page existente em `frontend/app/page.tsx` para substituir o botão único de "Login" por dois botões separados ("Login Gestor" e "Login Médico") e remove completamente o botão de "Documentação". A implementação usa Next.js 14 Server Components com TypeScript e Tailwind CSS, seguindo a arquitetura já estabelecida no projeto.

## Tasks

- [x] 1. Modificar o componente da landing page
  - [x] 1.1 Atualizar frontend/app/page.tsx com os dois botões de login
    - Substituir o botão único "Login" por dois botões: "Login Gestor" e "Login Médico"
    - Remover completamente o botão "Documentation" e qualquer referência a /docs
    - Implementar navegação com hrefs: /login?role=manager e /login?role=doctor
    - Usar anchor tags (<a>) ao invés de buttons para navegação semântica
    - Aplicar classes Tailwind para estilização: bg-primary, text-primary-foreground, px-6, py-3, rounded-lg
    - Adicionar efeitos hover (hover:opacity-90) e transições (transition-opacity)
    - Preservar título "SL Academy Platform" e subtítulo existentes
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 3.1, 3.2, 3.3, 4.1, 4.2, 4.3_

  - [x] 1.2 Implementar layout responsivo
    - Adicionar container flex com gap-4
    - Aplicar flex-col para mobile (< 640px)
    - Aplicar flex-row para desktop (≥ 640px) usando breakpoint sm: do Tailwind
    - Garantir espaçamento e alinhamento adequados
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

  - [x] 1.3 Adicionar atributos de acessibilidade
    - Adicionar aria-label="Login para Gestores" no botão gestor
    - Adicionar aria-label="Login para Médicos" no botão médico
    - Implementar classes de foco: focus:outline-none, focus:ring-2, focus:ring-ring, focus:ring-offset-2
    - Garantir que elementos sejam focáveis via Tab e ativáveis via Enter/Space
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 2. Configurar ambiente de testes
  - [x] 2.1 Configurar Jest e React Testing Library
    - Verificar se jest.config.js existe e está configurado para Next.js
    - Instalar dependências se necessário: @testing-library/react, @testing-library/jest-dom
    - Criar diretório frontend/__tests__ se não existir
    - _Requirements: Todos (infraestrutura de testes)_

  - [x] 2.2 Configurar fast-check para property-based testing
    - Instalar fast-check como dev dependency
    - Configurar integração com Jest
    - Definir configuração mínima de 100 iterações por propriedade
    - _Requirements: Todos (infraestrutura de testes)_

  - [x] 2.3 Configurar Playwright para testes E2E
    - Verificar se playwright.config.ts existe
    - Instalar Playwright se necessário
    - Criar diretório frontend/e2e se não existir
    - Configurar viewports para testes responsivos (mobile: 375x667, desktop: 1920x1080)
    - _Requirements: Todos (infraestrutura de testes)_

- [x] 3. Implementar testes unitários
  - [x] 3.1 Criar frontend/__tests__/page.test.tsx
    - Escrever teste para renderização do título "SL Academy Platform"
    - Escrever teste para renderização do subtítulo
    - Escrever teste para presença dos dois botões de login
    - Escrever teste para ausência do botão de documentação
    - _Requirements: 1.1, 1.2, 1.4, 1.5, 4.1, 4.2, 4.3_

  - [x] 3.2 Adicionar testes de navegação
    - Testar href do botão "Login Gestor" aponta para /login?role=manager
    - Testar href do botão "Login Médico" aponta para /login?role=doctor
    - Testar que não existe link para /docs
    - _Requirements: 2.1, 3.1, 4.2_

  - [x] 3.3 Adicionar testes de acessibilidade
    - Testar aria-label do botão gestor
    - Testar aria-label do botão médico
    - Testar que botões são focáveis
    - Testar presença de classes de foco
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

  - [x] 3.4 Adicionar testes de estilização
    - Testar classes de cor primária nos botões
    - Testar classes de hover
    - Testar classes de layout responsivo (flex-col, flex-row)
    - _Requirements: 2.2, 2.3, 3.2, 3.3, 5.1, 5.2_

- [ ]* 4. Implementar property-based tests
  - [ ]* 4.1 Criar frontend/__tests__/page.properties.test.tsx
    - Configurar arquivo de testes com fast-check
    - Importar componente Home e utilitários de teste
    - _Requirements: Todos (infraestrutura)_

  - [ ]* 4.2 Implementar Property 1: Botões de Login Presentes
    - **Property 1: Botões de Login Presentes**
    - **Validates: Requirements 1.1, 1.2**
    - Gerar diferentes estados de renderização
    - Verificar que ambos os botões sempre existem no DOM
    - _Requirements: 1.1, 1.2_

  - [ ]* 4.3 Implementar Property 2: Navegação Correta por Tipo de Usuário
    - **Property 2: Navegação Correta por Tipo de Usuário**
    - **Validates: Requirements 2.1, 3.1**
    - Verificar que href do gestor sempre contém role=manager
    - Verificar que href do médico sempre contém role=doctor
    - _Requirements: 2.1, 3.1_

  - [ ]* 4.4 Implementar Property 3: Ausência de Botão de Documentação
    - **Property 3: Ausência de Botão de Documentação**
    - **Validates: Requirements 4.1, 4.2, 4.3**
    - Verificar que texto "Documentation" nunca aparece
    - Verificar que link para /docs nunca existe
    - _Requirements: 4.1, 4.2, 4.3_

  - [ ]* 4.5 Implementar Property 4: Títulos Preservados
    - **Property 4: Títulos Preservados**
    - **Validates: Requirements 1.4, 1.5**
    - Verificar que título e subtítulo sempre estão presentes
    - _Requirements: 1.4, 1.5_

  - [ ]* 4.6 Implementar Property 5: Layout Responsivo
    - **Property 5: Layout Responsivo**
    - **Validates: Requirements 5.1, 5.2**
    - Gerar diferentes larguras de viewport
    - Verificar flex-col para < 640px
    - Verificar flex-row para ≥ 640px
    - _Requirements: 5.1, 5.2_

  - [ ]* 4.7 Implementar Property 6: Acessibilidade dos Botões
    - **Property 6: Acessibilidade dos Botões**
    - **Validates: Requirements 6.1, 6.2, 6.3, 6.5**
    - Verificar aria-labels corretos
    - Verificar focabilidade via teclado
    - _Requirements: 6.1, 6.2, 6.3, 6.5_

  - [ ]* 4.8 Implementar Property 7: Indicador Visual de Foco
    - **Property 7: Indicador Visual de Foco**
    - **Validates: Requirements 6.4**
    - Verificar presença de classes focus:ring quando focado
    - _Requirements: 6.4_

  - [ ]* 4.9 Implementar Property 8: Estilização Consistente
    - **Property 8: Estilização Consistente**
    - **Validates: Requirements 2.2, 2.3, 3.2, 3.3**
    - Verificar classes bg-primary e text-primary-foreground
    - Verificar classe hover:opacity-90
    - _Requirements: 2.2, 2.3, 3.2, 3.3_

- [x] 5. Checkpoint - Executar testes unitários e property-based
  - Executar npm test para validar implementação
  - Verificar cobertura de 100% do componente page.tsx
  - Garantir que todas as propriedades passam com 100 iterações
  - Perguntar ao usuário se há dúvidas ou ajustes necessários

- [ ]* 6. Implementar testes E2E
  - [ ]* 6.1 Criar frontend/e2e/landing-page.spec.ts
    - Configurar arquivo de testes Playwright
    - Importar utilitários necessários
    - _Requirements: Todos (infraestrutura E2E)_

  - [ ]* 6.2 Implementar teste de navegação completa - Gestor
    - Acessar landing page (/)
    - Clicar em "Login Gestor"
    - Verificar redirecionamento para /login?role=manager
    - _Requirements: 2.1_

  - [ ]* 6.3 Implementar teste de navegação completa - Médico
    - Acessar landing page (/)
    - Clicar em "Login Médico"
    - Verificar redirecionamento para /login?role=doctor
    - _Requirements: 3.1_

  - [ ]* 6.4 Implementar teste de responsividade mobile
    - Definir viewport mobile (375x667)
    - Verificar layout vertical dos botões
    - Verificar que botões são clicáveis
    - _Requirements: 5.1, 5.4_

  - [ ]* 6.5 Implementar teste de responsividade desktop
    - Definir viewport desktop (1920x1080)
    - Verificar layout horizontal dos botões
    - _Requirements: 5.2_

  - [ ]* 6.6 Implementar teste de acessibilidade com teclado
    - Navegar com Tab entre elementos
    - Verificar foco visual nos botões
    - Ativar botão com Enter
    - Verificar navegação ocorre corretamente
    - _Requirements: 6.3, 6.4, 6.5_

- [x] 7. Checkpoint final - Validação completa
  - Executar todos os testes: npm test && npm run test:e2e
  - Verificar que a landing page funciona corretamente no navegador
  - Testar manualmente responsividade e acessibilidade
  - Garantir que não há regressões em outras partes da aplicação
  - Perguntar ao usuário se há ajustes finais necessários

## Notes

- Tasks marcadas com `*` são opcionais e podem ser puladas para um MVP mais rápido
- Cada task referencia requisitos específicos para rastreabilidade
- Checkpoints garantem validação incremental
- Property tests validam propriedades universais de correção
- Testes unitários validam exemplos específicos e casos extremos
- Testes E2E validam fluxos completos de usuário
- A implementação mantém compatibilidade com a arquitetura Next.js 14 existente
