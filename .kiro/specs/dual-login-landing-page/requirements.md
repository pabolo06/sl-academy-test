# Requirements Document

## Introduction

Esta especificação define os requisitos para modificar a página inicial (landing page) da plataforma SL Academy, substituindo o botão único de "Login" por dois botões separados ("Login Gestor" e "Login Médico") e removendo completamente o botão de "Documentação". Esta mudança visa melhorar a experiência do usuário ao direcionar cada tipo de usuário para seu fluxo de autenticação específico desde o primeiro ponto de contato com a plataforma.

## Glossary

- **Landing_Page**: A página inicial da plataforma SL Academy acessada na rota raiz ("/")
- **Manager_Login_Button**: Botão que direciona gestores para o fluxo de autenticação de gestores
- **Doctor_Login_Button**: Botão que direciona médicos para o fluxo de autenticação de médicos
- **Documentation_Button**: Botão que anteriormente direcionava para a documentação (será removido)
- **User_Interface**: A interface visual apresentada ao usuário na Landing_Page

## Requirements

### Requirement 1: Exibir Botões de Login Separados

**User Story:** Como um usuário da plataforma (gestor ou médico), eu quero ver botões de login separados na página inicial, para que eu possa acessar diretamente o fluxo de autenticação apropriado para meu tipo de usuário.

#### Acceptance Criteria

1. THE Landing_Page SHALL display a Manager_Login_Button with the text "Login Gestor"
2. THE Landing_Page SHALL display a Doctor_Login_Button with the text "Login Médico"
3. THE Landing_Page SHALL position the Manager_Login_Button and Doctor_Login_Button horizontally adjacent to each other
4. THE Landing_Page SHALL maintain the existing title "SL Academy Platform"
5. THE Landing_Page SHALL maintain the existing subtitle "B2B Hospital Education and Management Platform"

### Requirement 2: Navegação do Botão Login Gestor

**User Story:** Como um gestor, eu quero clicar no botão "Login Gestor", para que eu seja direcionado para a página de login de gestores.

#### Acceptance Criteria

1. WHEN a user clicks the Manager_Login_Button, THE Landing_Page SHALL navigate to the "/login?role=manager" route
2. THE Manager_Login_Button SHALL display a visual hover effect when the user's cursor is over it
3. THE Manager_Login_Button SHALL use the primary color scheme of the platform

### Requirement 3: Navegação do Botão Login Médico

**User Story:** Como um médico, eu quero clicar no botão "Login Médico", para que eu seja direcionado para a página de login de médicos.

#### Acceptance Criteria

1. WHEN a user clicks the Doctor_Login_Button, THE Landing_Page SHALL navigate to the "/login?role=doctor" route
2. THE Doctor_Login_Button SHALL display a visual hover effect when the user's cursor is over it
3. THE Doctor_Login_Button SHALL use the primary color scheme of the platform

### Requirement 4: Remover Botão de Documentação

**User Story:** Como um administrador da plataforma, eu quero que o botão de documentação seja removido da página inicial, para que a interface fique mais focada nos fluxos de login.

#### Acceptance Criteria

1. THE Landing_Page SHALL NOT display the Documentation_Button
2. THE Landing_Page SHALL NOT include any link or reference to the "/docs" route
3. THE User_Interface SHALL display only the two login buttons (Manager_Login_Button and Doctor_Login_Button) in the action area

### Requirement 5: Responsividade da Interface

**User Story:** Como um usuário acessando de diferentes dispositivos, eu quero que a página inicial seja responsiva, para que eu possa visualizar e interagir com os botões de login em qualquer tamanho de tela.

#### Acceptance Criteria

1. WHEN the viewport width is less than 640 pixels, THE Landing_Page SHALL stack the Manager_Login_Button and Doctor_Login_Button vertically
2. WHEN the viewport width is 640 pixels or greater, THE Landing_Page SHALL display the Manager_Login_Button and Doctor_Login_Button horizontally
3. THE Landing_Page SHALL maintain proper spacing and alignment of all elements across different viewport sizes
4. THE Landing_Page SHALL ensure both buttons remain fully visible and clickable on mobile devices

### Requirement 6: Acessibilidade dos Botões

**User Story:** Como um usuário com necessidades de acessibilidade, eu quero que os botões de login sejam acessíveis, para que eu possa navegar pela plataforma usando tecnologias assistivas.

#### Acceptance Criteria

1. THE Manager_Login_Button SHALL include an aria-label attribute with the value "Login para Gestores"
2. THE Doctor_Login_Button SHALL include an aria-label attribute with the value "Login para Médicos"
3. WHEN a user navigates using keyboard, THE Landing_Page SHALL allow focus on both login buttons using the Tab key
4. WHEN a button has keyboard focus, THE Landing_Page SHALL display a visible focus indicator
5. WHEN a user presses Enter or Space on a focused button, THE Landing_Page SHALL trigger the button's navigation action
