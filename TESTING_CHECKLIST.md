# Checklist de Testes - SL Academy Platform

## ✅ Configuração Inicial

- [ ] Python 3.9+ instalado
- [ ] Node.js 18+ instalado
- [ ] Conta Supabase criada
- [ ] Projeto Supabase criado
- [ ] Migrações executadas no Supabase
- [ ] Redis instalado (opcional)

## ✅ Backend

- [ ] Ambiente virtual Python criado
- [ ] Dependências instaladas (`pip install -r requirements.txt`)
- [ ] Arquivo `backend/.env` configurado com credenciais Supabase
- [ ] Backend iniciado com sucesso (`python main.py`)
- [ ] Health check funcionando: http://localhost:8000/health
- [ ] Documentação da API acessível: http://localhost:8000/docs

## ✅ Frontend

- [ ] Dependências instaladas (`npm install`)
- [ ] Arquivo `frontend/.env.local` configurado
- [ ] Frontend iniciado com sucesso (`npm run dev`)
- [ ] Página de login acessível: http://localhost:3000/login

## ✅ Autenticação

- [ ] Usuário de teste criado no Supabase Auth
- [ ] Perfil criado na tabela `profiles`
- [ ] Login funcionando
- [ ] Redirecionamento para dashboard após login
- [ ] Logout funcionando

## ✅ Gestão de Trilhas (Manager)

- [ ] Criar nova trilha
- [ ] Editar trilha existente
- [ ] Listar trilhas
- [ ] Soft delete de trilha
- [ ] Cache funcionando (se Redis ativo)

## ✅ Gestão de Aulas (Manager)

- [ ] Criar nova aula
- [ ] Editar aula existente
- [ ] Listar aulas de uma trilha
- [ ] Ordenação de aulas funcionando
- [ ] Soft delete de aula

## ✅ Sistema de Testes

- [ ] Visualizar questões de pré-teste
- [ ] Submeter respostas de pré-teste
- [ ] Ver pontuação do pré-teste
- [ ] Visualizar questões de pós-teste
- [ ] Submeter respostas de pós-teste
- [ ] Ver pontuação do pós-teste
- [ ] Cálculo de melhoria funcionando

## ✅ Player de Vídeo

- [ ] Vídeo carrega corretamente
- [ ] Controles de play/pause funcionam
- [ ] Progresso é salvo no localStorage
- [ ] Progresso é restaurado ao recarregar
- [ ] Callback de conclusão funciona

## ✅ Sistema de Dúvidas

### Doctor
- [ ] Criar nova dúvida
- [ ] Upload de imagem na dúvida
- [ ] Listar minhas dúvidas
- [ ] Filtrar dúvidas por status
- [ ] Ver resposta da dúvida

### Manager
- [ ] Ver todas as dúvidas do hospital
- [ ] Kanban board funcionando
- [ ] Responder dúvida
- [ ] Dúvida muda para "answered"

## ✅ Indicadores (Manager)

- [ ] Importar indicadores via CSV
- [ ] Importar indicadores via XLSX
- [ ] Ver relatório de erros de importação
- [ ] Visualizar indicadores em gráficos
- [ ] Filtrar por categoria
- [ ] Filtrar por data

## ✅ Dashboard (Manager)

- [ ] Ver estatísticas gerais
- [ ] Ver gráficos de indicadores
- [ ] Ver distribuição de pontuações
- [ ] Ver taxa de conclusão por trilha

## ✅ Performance

- [ ] Cache Redis funcionando (se instalado)
- [ ] Cache stats acessível: `/api/admin/cache/stats`
- [ ] Hit rate do cache > 80% após uso
- [ ] Tempo de resposta < 200ms para endpoints cacheados

## ✅ Segurança

- [ ] RLS policies funcionando (usuário só vê dados do seu hospital)
- [ ] RBAC funcionando (doctor não acessa rotas de manager)
- [ ] Rate limiting funcionando (testar múltiplos logins)
- [ ] Session expira após 24h
- [ ] CORS configurado corretamente

## ✅ GDPR / Privacidade

- [ ] Exportar dados do usuário: `/api/auth/me/export`
- [ ] Deletar conta do usuário: `/api/auth/me`
- [ ] Soft delete funcionando em todas as entidades
- [ ] Consent timestamp registrado no login

## ✅ Logs e Monitoramento

- [ ] Logs do backend aparecem no console
- [ ] Erros são logados corretamente
- [ ] Audit logs registram eventos importantes
- [ ] Sentry configurado (se habilitado)

## ✅ Testes Automatizados

- [ ] Testes do backend passam: `pytest`
- [ ] Testes de cache passam: `pytest backend/tests/test_cache.py`
- [ ] Linter do frontend passa: `npm run lint`
- [ ] Type check passa: `npm run type-check`

## 🐛 Problemas Encontrados

Liste aqui qualquer problema encontrado durante os testes:

1. 
2. 
3. 

## 📝 Notas

Adicione observações sobre o comportamento da aplicação:

- 
- 
- 

## ✅ Status Final

- [ ] Todos os testes críticos passaram
- [ ] Aplicação está pronta para demonstração
- [ ] Documentação está atualizada
- [ ] Problemas conhecidos documentados
