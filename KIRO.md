# 🎯 Tarefas Oslo - Kiro

Este arquivo centraliza as tarefas pendentes e os próximos passos para a conclusão e deploy da plataforma **SL Academy (Oslo)**.

## 🚀 Próximos Passos (Produção)

Estes passos são necessários para levar a aplicação do ambiente local para produção.

- [ ] **Configuração de Infraestrutura**
  - [ ] Criar projetos Supabase (staging e production)
  - [ ] Executar migrações SQL nos novos ambientes
  - [ ] Configurar secrets no AWS Secrets Manager (ou similar)
  - [ ] Configurar variáveis de ambiente (.env.production)

- [ ] **Deployment**
  - [ ] Deploy do Backend (FastAPI) no Railway/Render/AWS
  - [ ] Deploy do Frontend (Next.js) no Vercel/Netlify
  - [ ] Configuração de domínios customizados e SSL/HTTPS

- [ ] **Monitoramento e Resiliência**
  - [ ] Configurar Sentry para rastreamento de erros (Backend e Frontend)
  - [ ] Configurar alertas de performance e erros
  - [ ] Configurar cron jobs de backup automatizado no Supabase
  - [ ] Validar procedimentos de Restore e Recovery

## 🧪 Testes e Validação de Qualidade

Tarefas de teste que garantem a robustez do sistema antes do Go-Live.

- [ ] **Testes E2E (Playwright)**
  - [ ] Implementar fluxo completo do médico (login -> aula -> teste)
  - [ ] Implementar fluxo do gestor (dashboard -> importação -> dúvidas)
  - [ ] Validar isolamento multi-tenant (Garantir que Hospital A não acessa dados do Hospital B)

- [ ] **Testes de Propriedade (Property-based)**
  - [ ] Validar limites de pontuação de testes (0-100)
  - [ ] Validar expiração de sessões e cookies de segurança
  - [ ] Validar conformidade GDPR (Exclusão e Exportação total de dados)

## 🛠️ Manutenção e Melhorias Futuras

- [ ] **Otimização**
  - [ ] Implementar Analytics (Google Analytics ou Plausible)
  - [ ] Configurar Notificações Push para novas aulas/respostas
- [ ] **Segurança**
  - [ ] Realizar auditoria de segurança pós-deploy
  - [ ] Implementar rotatividade de secrets automatizada

---

## 📖 Referências Úteis

- **Tasks Detalhadas**: [.kiro/specs/sl-academy-platform/tasks.md](./.kiro/specs/sl-academy-platform/tasks.md)
- **Guia de Deployment**: [docs/DEPLOYMENT_GUIDE.md](./docs/DEPLOYMENT_GUIDE.md)
- **Relatório Final**: [FINAL_REPORT.md](./FINAL_REPORT.md)
- **Comandos Úteis**: [COMMANDS.md](./COMMANDS.md)

---
*Gerado para auxílio na execução de tarefas via Kiro CLI.*
