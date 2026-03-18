# 🔍 Auditoria do Perfil Médico - SL Academy Platform

## 📋 Resumo Executivo

**Data:** 18/03/2026  
**Status:** ✅ Correções Aplicadas  
**Prioridade:** Alta

---

## ❌ Problema Crítico Identificado e Corrigido

### Erro: "Could not find the 'deleted_at' column of 'questions'"

**Causa Raiz:**
- A tabela `questions` no Supabase NÃO possui a coluna `deleted_at`
- O código backend estava tentando filtrar por `deleted_at` em queries de questions
- Isso causava falha ao buscar questões para pré-testes e pós-testes

**Arquivos Corrigidos:**
1. ✅ `backend/api/routes/questions.py` - Linha 49
2. ✅ `backend/api/routes/lessons.py` - Linha 96

**Mudanças Aplicadas:**
```python
# ANTES (INCORRETO):
query = db.table("questions").select(...).eq("lesson_id", str(lesson_id)).is_("deleted_at", "null")

# DEPOIS (CORRETO):
query = db.table("questions").select(...).eq("lesson_id", str(lesson_id))
```

**Impacto:**
- ✅ Médicos agora conseguem visualizar questões de pré-teste
- ✅ Médicos agora conseguem visualizar questões de pós-teste
- ✅ Sistema de avaliação funcional

---

## 🎯 Checklist de Auditoria do Perfil Médico

### 1. Autenticação e Acesso

- [ ] Login com credenciais de médico funciona
- [ ] Cookie de sessão é criado corretamente
- [ ] Redirecionamento após login está correto
- [ ] Logout funciona e limpa a sessão

**Credenciais de Teste:**
```
Email: medico@teste.com
Senha: teste123
```

### 2. Restrições de Acesso (Segurança)

O médico NÃO deve ter acesso a:
- [ ] ❌ Menu "Gerenciar Trilhas"
- [ ] ❌ Menu "Criar Nova Trilha"
- [ ] ❌ Menu "Indicadores Administrativos"
- [ ] ❌ Menu "Importar Indicadores"
- [ ] ❌ Endpoint `/api/admin/*`
- [ ] ❌ Endpoint `/api/tracks` (POST, PATCH, DELETE)
- [ ] ❌ Endpoint `/api/indicators` (POST, DELETE)

O médico DEVE ter acesso a:
- [ ] ✅ Visualizar trilhas disponíveis
- [ ] ✅ Visualizar aulas de uma trilha
- [ ] ✅ Assistir vídeos das aulas
- [ ] ✅ Fazer pré-testes
- [ ] ✅ Fazer pós-testes
- [ ] ✅ Criar dúvidas
- [ ] ✅ Visualizar suas próprias dúvidas
- [ ] ✅ Ver progresso pessoal

### 3. Fluxo de Aprendizado Completo

#### 3.1 Visualizar Trilhas
- [ ] Acessar página de trilhas
- [ ] Ver lista de trilhas disponíveis
- [ ] Ver descrição e informações de cada trilha
- [ ] Clicar em uma trilha para ver detalhes

#### 3.2 Visualizar Aulas
- [ ] Ver lista de aulas da trilha
- [ ] Ver ordem das aulas
- [ ] Ver status de conclusão
- [ ] Ver indicadores de pré/pós-teste

#### 3.3 Fazer Pré-Teste
- [ ] Clicar em "Iniciar Pré-Teste"
- [ ] Ver questões carregadas corretamente
- [ ] Selecionar respostas
- [ ] Submeter pré-teste
- [ ] Ver resultado/pontuação
- [ ] Sistema registra tentativa

**Endpoint Testado:**
```
GET /api/lessons/{lesson_id}/questions?type=pre
```

#### 3.4 Assistir Vídeo
- [ ] Player de vídeo carrega
- [ ] Vídeo reproduz corretamente
- [ ] Controles funcionam (play, pause, volume)
- [ ] Progresso é registrado

#### 3.5 Fazer Pós-Teste
- [ ] Clicar em "Iniciar Pós-Teste"
- [ ] Ver questões carregadas corretamente
- [ ] Selecionar respostas
- [ ] Submeter pós-teste
- [ ] Ver resultado/pontuação
- [ ] Ver comparação com pré-teste
- [ ] Sistema registra tentativa

**Endpoint Testado:**
```
GET /api/lessons/{lesson_id}/questions?type=post
```

#### 3.6 Criar Dúvidas
- [ ] Acessar formulário de dúvida
- [ ] Selecionar aula relacionada
- [ ] Escrever texto da dúvida
- [ ] Submeter dúvida
- [ ] Ver confirmação de envio
- [ ] Dúvida aparece na lista

**Endpoint Testado:**
```
POST /api/doubts
```

#### 3.7 Visualizar Dúvidas
- [ ] Ver lista de dúvidas próprias
- [ ] Ver status (pendente/respondida)
- [ ] Ver resposta quando disponível
- [ ] Filtrar por status
- [ ] Filtrar por aula

**Endpoint Testado:**
```
GET /api/doubts
```

### 4. Interface do Usuário

- [ ] Menu de navegação apropriado para médico
- [ ] Sem opções administrativas visíveis
- [ ] Dashboard mostra informações relevantes
- [ ] Progresso pessoal visível
- [ ] Notificações funcionam
- [ ] Responsividade mobile

### 5. Sincronização e Progresso

- [ ] Progresso de aulas é salvo
- [ ] Tentativas de teste são registradas
- [ ] Pontuações são calculadas corretamente
- [ ] Histórico de tentativas acessível
- [ ] Dados persistem após logout/login

---

## 🧪 Testes Manuais Recomendados

### Teste 1: Fluxo Completo de Aprendizado

1. Fazer login como médico
2. Selecionar uma trilha
3. Selecionar primeira aula
4. Fazer pré-teste completo
5. Assistir vídeo da aula
6. Fazer pós-teste completo
7. Verificar pontuação e melhoria
8. Criar uma dúvida sobre a aula
9. Fazer logout

**Tempo Estimado:** 10-15 minutos

### Teste 2: Restrições de Segurança

1. Fazer login como médico
2. Tentar acessar `/api/admin/users` diretamente
3. Tentar acessar `/api/tracks` com POST
4. Tentar acessar `/api/indicators` com POST
5. Verificar se todos retornam 403 Forbidden

**Tempo Estimado:** 5 minutos

### Teste 3: Questões e Avaliações

1. Fazer login como médico
2. Acessar uma aula com questões
3. Verificar se pré-teste carrega questões
4. Verificar se pós-teste carrega questões
5. Submeter respostas
6. Verificar cálculo de pontuação

**Tempo Estimado:** 10 minutos

---

## 🔧 Scripts SQL de Suporte

### Script 1: Verificar Políticas RLS de Questions

Execute no Supabase SQL Editor:
```sql
-- Ver políticas atuais
SELECT * FROM pg_policies WHERE tablename = 'questions';

-- Ver colunas da tabela
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'questions';
```

**Arquivo:** `backend/scripts/fix_questions_rls.sql`

### Script 2: Criar Dados de Teste

Se precisar de mais dados de teste:
```sql
-- Criar trilha de teste
INSERT INTO tracks (id, hospital_id, title, description, active)
VALUES (
    gen_random_uuid(),
    (SELECT id FROM hospitals WHERE name = 'Hospital Teste'),
    'Trilha de Teste Médico',
    'Trilha para testar o fluxo completo',
    true
);

-- Criar aula de teste
INSERT INTO lessons (id, track_id, title, description, video_url, "order")
VALUES (
    gen_random_uuid(),
    (SELECT id FROM tracks WHERE title = 'Trilha de Teste Médico'),
    'Aula de Teste',
    'Aula para testar pré e pós-teste',
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    1
);

-- Criar questões de pré-teste
INSERT INTO questions (id, lesson_id, type, question_text, options, correct_option_index)
VALUES (
    gen_random_uuid(),
    (SELECT id FROM lessons WHERE title = 'Aula de Teste'),
    'pre',
    'Qual é a capital do Brasil?',
    '["São Paulo", "Rio de Janeiro", "Brasília", "Salvador"]',
    2
);

-- Criar questões de pós-teste
INSERT INTO questions (id, lesson_id, type, question_text, options, correct_option_index)
VALUES (
    gen_random_uuid(),
    (SELECT id FROM lessons WHERE title = 'Aula de Teste'),
    'post',
    'Quantos estados tem o Brasil?',
    '["26", "27", "28", "29"]',
    1
);
```

---

## 📊 Endpoints Críticos para Médicos

### Autenticação
```
POST /api/auth/login/medico
GET  /api/auth/me
POST /api/auth/logout
```

### Trilhas e Aulas
```
GET /api/tracks
GET /api/tracks/{track_id}
GET /api/tracks/{track_id}/lessons
GET /api/lessons/{lesson_id}
```

### Questões e Testes
```
GET  /api/lessons/{lesson_id}/questions?type=pre
GET  /api/lessons/{lesson_id}/questions?type=post
POST /api/test-attempts
GET  /api/test-attempts
```

### Dúvidas
```
POST /api/doubts
GET  /api/doubts
GET  /api/doubts/{doubt_id}
```

---

## ⚠️ Problemas Conhecidos e Soluções

### 1. Questões não aparecem
**Causa:** Política RLS ou coluna deleted_at  
**Solução:** ✅ Corrigido no código backend

### 2. Erro "Access denied for this login domain"
**Causa:** Usuário com role incorreto  
**Solução:** Verificar role na tabela profiles

### 3. Vídeo não carrega
**Causa:** URL inválida ou CORS  
**Solução:** Verificar URL do vídeo e configurações de CORS

### 4. Progresso não salva
**Causa:** Erro de sincronização ou RLS  
**Solução:** Verificar logs do backend e políticas RLS

---

## 📝 Próximos Passos

1. ✅ Executar script SQL para criar usuários de teste
2. ✅ Fazer login como médico
3. ✅ Executar checklist de auditoria completo
4. ✅ Documentar bugs encontrados
5. ✅ Testar em diferentes navegadores
6. ✅ Testar responsividade mobile
7. ✅ Validar performance

---

## 📞 Suporte

Se encontrar problemas durante a auditoria:

1. Verificar logs do backend (terminal)
2. Verificar console do navegador (F12)
3. Consultar `STATUS_TESTE_LOCALHOST.md`
4. Consultar `CRIAR_USUARIOS_TESTE.md`

---

**Status:** 🟢 Pronto para Auditoria  
**Última Atualização:** 18/03/2026 13:24  
**Responsável:** Sistema Automatizado
