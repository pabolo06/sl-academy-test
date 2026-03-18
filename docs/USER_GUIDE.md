# 📖 Guia do Usuário - SL Academy Platform

## 🎯 Visão Geral

Bem-vindo à SL Academy! Esta plataforma foi desenvolvida para facilitar o treinamento médico através de vídeo-aulas curtas, avaliações e acompanhamento de indicadores hospitalares.

---

## 👥 Tipos de Usuário

### 👨‍⚕️ Médico (Doctor)
- Acessa trilhas e aulas educacionais
- Realiza testes pré e pós-aula
- Envia dúvidas com imagens
- Acompanha seu progresso

### 👔 Gestor (Manager)
- Todas as funcionalidades de médico
- Cria e gerencia trilhas e aulas
- Responde dúvidas dos médicos
- Importa e visualiza indicadores
- Acessa dashboards gerenciais

### 🎓 Médico Ponto Focal (Focal Point Doctor)
- Todas as funcionalidades de médico
- Acesso a materiais de apoio exclusivos

---

## 🚀 Primeiros Passos

### 1. Acessar a Plataforma

```
URL: https://slacademy.com
```

### 2. Fazer Login

1. Digite seu **email** e **senha**
2. Marque **"Aceito os termos de serviço e política de privacidade"**
3. Clique em **"Entrar"**

**Problemas com login?**
- Verifique se o email está correto
- Verifique se a senha está correta (case-sensitive)
- Aguarde 15 minutos se excedeu 5 tentativas

### 3. Navegar pela Plataforma

Após o login, você verá:
- **Menu lateral**: Navegação principal
- **Header**: Seu nome e opções de perfil
- **Área principal**: Conteúdo da página atual

---

## 📚 Guia para Médicos

### Ver Trilhas Disponíveis

1. Clique em **"Trilhas"** no menu lateral
2. Veja a lista de trilhas do seu hospital
3. Clique em uma trilha para ver as aulas

### Assistir uma Aula

#### Fluxo Completo de Aprendizado

1. **Pré-Teste** (obrigatório)
   - Responda todas as questões
   - Clique em **"Enviar Respostas"**
   - Veja sua pontuação

2. **Vídeo-Aula**
   - Assista ao vídeo completo
   - Use os controles para pausar/avançar
   - Seu progresso é salvo automaticamente

3. **Pós-Teste** (obrigatório)
   - Responda todas as questões
   - Clique em **"Enviar Respostas"**
   - Veja sua pontuação e melhoria

4. **Recomendações** (se aplicável)
   - Se sua melhoria for baixa, receberá recomendações de IA
   - Veja aulas sugeridas para complementar seu aprendizado

### Enviar Dúvidas

1. Durante ou após uma aula, clique em **"Enviar Dúvida"**
2. Digite sua dúvida (mínimo 10 caracteres)
3. **Opcional**: Anexe uma imagem
   - Clique em **"Escolher Arquivo"**
   - Selecione imagem (JPEG, PNG, WebP)
   - Máximo 5 MB
4. Clique em **"Enviar"**

### Ver Suas Dúvidas

1. Clique em **"Dúvidas"** no menu lateral
2. Veja suas dúvidas:
   - **Pendentes**: Aguardando resposta
   - **Respondidas**: Com resposta do gestor
3. Clique em uma dúvida para ver detalhes

### Acompanhar Progresso

1. Clique em **"Dashboard"** no menu lateral
2. Veja:
   - Aulas completadas
   - Pontuações médias
   - Progresso por trilha
   - Dúvidas enviadas

---

## 👔 Guia para Gestores

### Criar Trilha

1. Clique em **"Gestão"** → **"Trilhas"** no menu lateral
2. Clique em **"Nova Trilha"** (botão superior direito)
3. Preencha:
   - **Título**: Nome da trilha
   - **Descrição**: Descrição detalhada
4. Clique em **"Criar"**

### Editar/Excluir Trilha

1. Na lista de trilhas, clique no ícone de **editar** ou **excluir**
2. Para editar: Altere os campos e clique em **"Salvar"**
3. Para excluir: Confirme a exclusão (soft delete)

### Criar Aula

1. Clique em uma trilha
2. Clique em **"Nova Aula"**
3. Preencha:
   - **Título**: Nome da aula
   - **Descrição**: Descrição detalhada
   - **URL do Vídeo**: Link do YouTube ou Vimeo
   - **Duração**: Em segundos (ex: 600 = 10 minutos)
   - **Ordem**: Posição na trilha (1, 2, 3...)
4. Clique em **"Criar"**

**Dica**: A ordem determina a sequência das aulas na trilha.

### Gerenciar Dúvidas

#### Ver Quadro Kanban

1. Clique em **"Gestão"** → **"Dúvidas"** no menu lateral
2. Veja o quadro com duas colunas:
   - **Pendentes**: Dúvidas aguardando resposta
   - **Respondidas**: Dúvidas já respondidas

#### Responder Dúvida

1. Clique em uma dúvida pendente
2. Leia a dúvida e veja a imagem (se houver)
3. Digite sua resposta no campo **"Resposta"**
4. Clique em **"Responder"**
5. A dúvida move automaticamente para **"Respondidas"**

**Dica**: Se houver resumo de IA, use-o como contexto adicional.

### Importar Indicadores

#### Preparar Arquivo

Crie um arquivo CSV ou XLSX com as colunas:
```csv
name,category,value,unit,reference_date
Taxa de Infecção,Segurança,2.5,%,2024-01-01
Tempo de Espera,Eficiência,45,minutos,2024-01-01
```

**Formato de Data**: YYYY-MM-DD

#### Importar

1. Clique em **"Gestão"** → **"Indicadores"** → **"Importar"**
2. Clique em **"Escolher Arquivo"** ou arraste o arquivo
3. Veja a prévia dos dados
4. Clique em **"Importar"**
5. Veja o resultado:
   - **Sucesso**: Número de indicadores importados
   - **Erros**: Lista de erros por linha

**Limites**:
- Máximo 10 MB
- Máximo 10.000 linhas
- 1 importação por minuto

### Ver Dashboard Gerencial

1. Clique em **"Gestão"** → **"Dashboard"**
2. Veja:
   - **Indicadores**: Gráficos de tendência
   - **Desempenho de Testes**: Pontuações médias
   - **Conclusão de Aulas**: Taxa de conclusão por trilha
   - **Dúvidas**: Estatísticas de dúvidas

#### Filtrar Dados

- **Por Data**: Selecione intervalo de datas
- **Por Categoria**: Filtre indicadores por categoria
- **Por Trilha**: Filtre desempenho por trilha

---

## 🎓 Guia para Médicos Ponto Focal

### Acessar Materiais de Apoio

1. Acesse uma aula
2. Role até a seção **"Materiais de Apoio"**
3. Veja materiais exclusivos para pontos focais
4. Baixe ou visualize os materiais

**Nota**: Esta seção só aparece para médicos designados como ponto focal.

---

## 📱 Usar no Celular (PWA)

### Instalar App

#### Android (Chrome)
1. Acesse https://slacademy.com
2. Toque no menu (⋮)
3. Toque em **"Instalar app"** ou **"Adicionar à tela inicial"**
4. Confirme a instalação

#### iOS (Safari)
1. Acesse https://slacademy.com
2. Toque no ícone de compartilhar (□↑)
3. Toque em **"Adicionar à Tela de Início"**
4. Toque em **"Adicionar"**

### Usar Offline

- O app funciona offline para:
  - Ver trilhas e aulas já carregadas
  - Ver dúvidas já carregadas
  - Navegar entre páginas
- Quando reconectar:
  - Dados são sincronizados automaticamente
  - Ações pendentes são enviadas

**Indicador de Offline**: Banner amarelo aparece quando desconectado.

---

## 🔒 Privacidade e Dados

### Exportar Seus Dados

1. Clique no seu nome no header
2. Clique em **"Exportar Meus Dados"**
3. Aguarde o download do arquivo JSON
4. O arquivo contém:
   - Perfil
   - Tentativas de teste
   - Dúvidas
   - Histórico de vídeos

### Excluir Sua Conta

1. Clique no seu nome no header
2. Clique em **"Excluir Minha Conta"**
3. **ATENÇÃO**: Esta ação é permanente e irreversível
4. Confirme a exclusão
5. Todos os seus dados serão removidos

### Política de Privacidade

- Seus dados são protegidos por criptografia
- Apenas seu hospital tem acesso aos seus dados
- Dados são isolados por hospital (multi-tenant)
- Veja a [Política de Privacidade](https://slacademy.com/privacy) completa

---

## ⚠️ Solução de Problemas

### Não Consigo Fazer Login

**Problema**: Email ou senha incorretos
- Verifique se o email está correto
- Verifique se a senha está correta (case-sensitive)
- Contate o gestor para resetar senha

**Problema**: "Muitas tentativas"
- Aguarde 15 minutos
- Tente novamente

### Vídeo Não Carrega

**Problema**: Erro ao carregar vídeo
- Verifique sua conexão com internet
- Recarregue a página (F5)
- Tente outro navegador
- Contate o gestor se o problema persistir

### Não Consigo Enviar Dúvida

**Problema**: "Texto muito curto"
- Digite pelo menos 10 caracteres

**Problema**: "Imagem muito grande"
- Reduza o tamanho da imagem (máximo 5 MB)
- Use formato JPEG, PNG ou WebP

**Problema**: "Muitas requisições"
- Aguarde 1 hora (limite: 10 dúvidas por hora)

### Não Consigo Importar Indicadores

**Problema**: "Arquivo muito grande"
- Reduza o tamanho (máximo 10 MB)
- Divida em múltiplos arquivos

**Problema**: "Muitas linhas"
- Máximo 10.000 linhas por arquivo
- Divida em múltiplos arquivos

**Problema**: "Formato inválido"
- Use CSV ou XLSX
- Verifique as colunas obrigatórias
- Verifique formato de data (YYYY-MM-DD)

### Página em Branco

**Problema**: Página não carrega
- Recarregue a página (F5)
- Limpe cache do navegador
- Tente outro navegador
- Contate suporte se persistir

### Session Expirou

**Problema**: "Sua sessão expirou"
- Faça login novamente
- Sessões expiram após 24 horas de inatividade

---

## 💡 Dicas e Boas Práticas

### Para Médicos

1. **Complete o fluxo**: Sempre faça pré-teste → vídeo → pós-teste
2. **Assista completo**: Assista o vídeo até o final para melhor aprendizado
3. **Envie dúvidas**: Não hesite em enviar dúvidas com imagens
4. **Use offline**: Instale o app para usar sem internet
5. **Acompanhe progresso**: Verifique seu dashboard regularmente

### Para Gestores

1. **Organize trilhas**: Crie trilhas temáticas e bem estruturadas
2. **Ordene aulas**: Use ordem lógica (básico → avançado)
3. **Responda rápido**: Responda dúvidas em até 24 horas
4. **Importe regularmente**: Importe indicadores semanalmente
5. **Monitore dashboard**: Verifique métricas semanalmente
6. **Use categorias**: Categorize indicadores para melhor análise

---

## 📞 Suporte

### Contato

- **Email**: suporte@slacademy.com
- **Telefone**: (11) 1234-5678
- **Horário**: Segunda a Sexta, 9h às 18h

### Recursos Adicionais

- [Perguntas Frequentes](https://slacademy.com/faq)
- [Tutoriais em Vídeo](https://slacademy.com/tutorials)
- [Política de Privacidade](https://slacademy.com/privacy)
- [Termos de Serviço](https://slacademy.com/terms)

---

## 📝 Glossário

- **Trilha**: Conjunto de aulas sobre um tema
- **Aula**: Vídeo educacional com testes
- **Pré-Teste**: Avaliação antes do vídeo
- **Pós-Teste**: Avaliação após o vídeo
- **Melhoria**: Diferença entre pós-teste e pré-teste
- **Dúvida**: Pergunta enviada por médico
- **Indicador**: Métrica hospitalar (ex: taxa de infecção)
- **Dashboard**: Painel com estatísticas e gráficos
- **PWA**: Progressive Web App (app instalável)
- **Offline**: Modo sem conexão com internet

---

**Última Atualização:** 14 de março de 2026
**Versão:** 1.0.0
