# Design Document: Dual Login Landing Page

## Overview

Esta funcionalidade modifica a página inicial (landing page) da plataforma SL Academy para substituir o botão único de "Login" por dois botões separados: "Login Gestor" e "Login Médico". O botão de "Documentação" será completamente removido. Esta mudança visa melhorar a experiência do usuário ao direcionar cada tipo de usuário para seu fluxo de autenticação específico desde o primeiro ponto de contato com a plataforma.

A implementação será feita através da modificação do componente React existente em `frontend/app/page.tsx`, mantendo a arquitetura Next.js App Router já estabelecida no projeto.

## Architecture

### Component Structure

A landing page é implementada como um Server Component do Next.js localizado em `frontend/app/page.tsx`. A arquitetura segue o padrão de componentes do Next.js 14 com App Router:

```
frontend/app/
  └── page.tsx (Landing Page - Server Component)
```

### Navigation Flow

```mermaid
graph TD
    A[Landing Page /] --> B[Login Gestor Button]
    A --> C[Login Médico Button]
    B --> D[/login?role=manager]
    C --> E[/login?role=doctor]
    D --> F[Login Page Component]
    E --> F
```

### Styling Architecture

O projeto utiliza:
- **Tailwind CSS**: Framework de utilidades CSS para estilização
- **CSS Variables**: Sistema de design tokens definido em `globals.css`
- **Responsive Design**: Breakpoints do Tailwind (sm: 640px)

## Components and Interfaces

### Landing Page Component

**File**: `frontend/app/page.tsx`

**Component Type**: React Server Component (Next.js 14)

**Props**: None (root page component)

**Structure**:
```typescript
export default function Home() {
  return (
    <main className="...">
      <div className="...">
        <h1>SL Academy Platform</h1>
        <p>B2B Hospital Education and Management Platform</p>
        <div className="...">
          <a href="/login?role=manager" aria-label="Login para Gestores">
            Login Gestor
          </a>
          <a href="/login?role=doctor" aria-label="Login para Médicos">
            Login Médico
          </a>
        </div>
      </div>
    </main>
  )
}
```

### Button Elements

**Element Type**: Anchor tags (`<a>`) styled as buttons

**Rationale**: Using anchor tags instead of button elements because they perform navigation, not form submission or client-side actions. This is semantically correct and provides better SEO and accessibility.

**Styling Classes**:
- Base: `px-6 py-3 rounded-lg transition-opacity`
- Color: `bg-primary text-primary-foreground`
- Hover: `hover:opacity-90`
- Focus: `focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2`

**Responsive Layout**:
- Mobile (< 640px): `flex flex-col gap-4`
- Desktop (≥ 640px): `flex flex-row gap-4`

## Data Models

Esta funcionalidade não introduz novos modelos de dados. Ela apenas modifica a interface do usuário para navegação.

### Navigation Parameters

**Query Parameter**: `role`

**Values**:
- `manager`: Indica fluxo de login para gestores
- `doctor`: Indica fluxo de login para médicos

**Usage**: Passado via query string para a página de login (`/login?role=manager` ou `/login?role=doctor`)

**Note**: A página de login existente (`frontend/app/login/page.tsx`) precisará ser modificada em uma funcionalidade futura para processar este parâmetro e ajustar o fluxo de autenticação conforme o tipo de usuário.

## Correctness Properties

*Uma propriedade é uma característica ou comportamento que deve ser verdadeiro em todas as execuções válidas de um sistema - essencialmente, uma declaração formal sobre o que o sistema deve fazer. As propriedades servem como ponte entre especificações legíveis por humanos e garantias de correção verificáveis por máquina.*

### Property 1: Botões de Login Presentes

*Para qualquer* renderização da landing page, ambos os botões "Login Gestor" e "Login Médico" devem estar presentes e visíveis no DOM.

**Validates: Requirements 1.1, 1.2**

### Property 2: Navegação Correta por Tipo de Usuário

*Para qualquer* botão de login (Gestor ou Médico), o atributo href deve apontar para a rota `/login` com o parâmetro `role` correspondente ao tipo de usuário (`manager` para Gestor, `doctor` para Médico).

**Validates: Requirements 2.1, 3.1**

### Property 3: Ausência de Botão de Documentação

*Para qualquer* renderização da landing page, não deve existir nenhum elemento com texto "Documentation" ou "Documentação", e nenhum link deve apontar para a rota `/docs`.

**Validates: Requirements 4.1, 4.2, 4.3**

### Property 4: Títulos Preservados

*Para qualquer* renderização da landing page, o título "SL Academy Platform" e o subtítulo "B2B Hospital Education and Management Platform" devem estar presentes.

**Validates: Requirements 1.4, 1.5**

### Property 5: Layout Responsivo

*Para qualquer* largura de viewport, quando a largura é menor que 640px, os botões devem estar empilhados verticalmente (flex-col), e quando a largura é 640px ou maior, os botões devem estar posicionados horizontalmente (flex-row).

**Validates: Requirements 5.1, 5.2**

### Property 6: Acessibilidade dos Botões

*Para qualquer* botão de login, deve existir um atributo `aria-label` com valor descritivo ("Login para Gestores" ou "Login para Médicos"), e o elemento deve ser focável via teclado (Tab) e ativável via Enter ou Space.

**Validates: Requirements 6.1, 6.2, 6.3, 6.5**

### Property 7: Indicador Visual de Foco

*Para qualquer* botão de login quando focado via teclado, deve existir um indicador visual de foco (ring) que seja claramente visível.

**Validates: Requirements 6.4**

### Property 8: Estilização Consistente

*Para qualquer* botão de login, deve usar o esquema de cores primário da plataforma (bg-primary, text-primary-foreground) e deve ter efeito hover (opacity-90).

**Validates: Requirements 2.2, 2.3, 3.2, 3.3**

## Error Handling

Esta funcionalidade é puramente de apresentação e navegação, portanto não há cenários de erro complexos a serem tratados. No entanto, considerações importantes incluem:

### Navigation Fallback

Se o JavaScript falhar ou estiver desabilitado, os links ainda funcionarão como âncoras HTML padrão, garantindo que a navegação básica permaneça funcional.

### Accessibility Fallback

Os atributos `aria-label` fornecem contexto adicional para leitores de tela, mas o texto visível dos botões também é descritivo o suficiente para ser compreendido sem tecnologias assistivas.

### Responsive Design Fallback

O layout usa classes Tailwind que degradam graciosamente. Se o CSS não carregar, os elementos ainda estarão presentes e clicáveis, apenas sem estilização.

## Testing Strategy

### Unit Testing

**Framework**: Jest com React Testing Library

**Test File**: `frontend/__tests__/page.test.tsx`

**Test Cases**:

1. **Renderização de Elementos**
   - Verifica presença do título "SL Academy Platform"
   - Verifica presença do subtítulo
   - Verifica presença dos dois botões de login
   - Verifica ausência do botão de documentação

2. **Navegação**
   - Verifica href do botão "Login Gestor" aponta para `/login?role=manager`
   - Verifica href do botão "Login Médico" aponta para `/login?role=doctor`
   - Verifica que não existe link para `/docs`

3. **Acessibilidade**
   - Verifica aria-label do botão gestor
   - Verifica aria-label do botão médico
   - Verifica que botões são focáveis
   - Verifica presença de classes de foco

4. **Estilização**
   - Verifica classes de cor primária nos botões
   - Verifica classes de hover
   - Verifica classes de layout responsivo

### Property-Based Testing

**Framework**: fast-check (JavaScript property-based testing library)

**Configuration**: Minimum 100 iterations per property test

**Test File**: `frontend/__tests__/page.properties.test.tsx`

**Property Tests**:

1. **Property 1: Botões de Login Presentes**
   ```typescript
   // Feature: dual-login-landing-page, Property 1: Botões de Login Presentes
   ```
   - Gera diferentes estados de renderização
   - Verifica que ambos os botões sempre existem

2. **Property 2: Navegação Correta por Tipo de Usuário**
   ```typescript
   // Feature: dual-login-landing-page, Property 2: Navegação Correta por Tipo de Usuário
   ```
   - Verifica que hrefs sempre contêm role correto

3. **Property 3: Ausência de Botão de Documentação**
   ```typescript
   // Feature: dual-login-landing-page, Property 3: Ausência de Botão de Documentação
   ```
   - Verifica que documentação nunca aparece

4. **Property 4: Títulos Preservados**
   ```typescript
   // Feature: dual-login-landing-page, Property 4: Títulos Preservados
   ```
   - Verifica que títulos sempre estão presentes

5. **Property 5: Layout Responsivo**
   ```typescript
   // Feature: dual-login-landing-page, Property 5: Layout Responsivo
   ```
   - Gera diferentes larguras de viewport
   - Verifica layout correto para cada breakpoint

6. **Property 6: Acessibilidade dos Botões**
   ```typescript
   // Feature: dual-login-landing-page, Property 6: Acessibilidade dos Botões
   ```
   - Verifica aria-labels e focabilidade

7. **Property 7: Indicador Visual de Foco**
   ```typescript
   // Feature: dual-login-landing-page, Property 7: Indicador Visual de Foco
   ```
   - Verifica presença de classes de foco

8. **Property 8: Estilização Consistente**
   ```typescript
   // Feature: dual-login-landing-page, Property 8: Estilização Consistente
   ```
   - Verifica classes de cor e hover

### End-to-End Testing

**Framework**: Playwright

**Test File**: `frontend/e2e/landing-page.spec.ts`

**Test Scenarios**:

1. **Navegação Completa - Gestor**
   - Acessa landing page
   - Clica em "Login Gestor"
   - Verifica redirecionamento para `/login?role=manager`

2. **Navegação Completa - Médico**
   - Acessa landing page
   - Clica em "Login Médico"
   - Verifica redirecionamento para `/login?role=doctor`

3. **Responsividade Mobile**
   - Define viewport mobile (375x667)
   - Verifica layout vertical dos botões
   - Verifica que botões são clicáveis

4. **Responsividade Desktop**
   - Define viewport desktop (1920x1080)
   - Verifica layout horizontal dos botões

5. **Acessibilidade com Teclado**
   - Navega com Tab
   - Verifica foco nos botões
   - Ativa botão com Enter
   - Verifica navegação

### Test Coverage Goals

- **Unit Tests**: 100% de cobertura do componente page.tsx
- **Property Tests**: 100 iterações mínimas por propriedade
- **E2E Tests**: Cobertura dos fluxos principais de navegação e responsividade

### Continuous Integration

Todos os testes devem ser executados no pipeline de CI antes de merge:
```bash
# Unit and Property Tests
npm test

# E2E Tests
npm run test:e2e
```
