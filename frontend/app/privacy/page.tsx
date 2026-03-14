export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-gray-800 rounded-lg shadow-xl p-8">
        <h1 className="text-3xl font-bold text-white mb-6">Política de Privacidade</h1>
        
        <div className="space-y-6 text-gray-300">
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">1. Introdução</h2>
            <p>
              A SL Academy está comprometida em proteger sua privacidade e dados pessoais. 
              Esta política descreve como coletamos, usamos e protegemos suas informações 
              de acordo com a Lei Geral de Proteção de Dados (LGPD) e o Regulamento Geral 
              de Proteção de Dados (GDPR).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">2. Dados Coletados</h2>
            <p className="mb-2">Coletamos apenas os dados necessários para o funcionamento da plataforma:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Nome completo</li>
              <li>Endereço de e-mail</li>
              <li>Função (médico ou gestor)</li>
              <li>Hospital de vínculo</li>
              <li>Histórico de treinamentos e avaliações</li>
              <li>Dúvidas submetidas</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">3. Uso dos Dados</h2>
            <p className="mb-2">Seus dados são utilizados para:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Fornecer acesso à plataforma de treinamento</li>
              <li>Acompanhar seu progresso educacional</li>
              <li>Gerar relatórios de desempenho para gestores</li>
              <li>Melhorar a qualidade dos conteúdos educacionais</li>
              <li>Responder suas dúvidas sobre os conteúdos</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">4. Compartilhamento de Dados</h2>
            <p>
              Seus dados são compartilhados apenas com gestores do seu hospital para fins de 
              acompanhamento educacional. Não compartilhamos dados com terceiros sem seu 
              consentimento explícito, exceto quando exigido por lei.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">5. Segurança</h2>
            <p>
              Implementamos medidas técnicas e organizacionais para proteger seus dados, incluindo:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-4 mt-2">
              <li>Criptografia de dados em trânsito e em repouso</li>
              <li>Controle de acesso baseado em função</li>
              <li>Isolamento de dados por hospital</li>
              <li>Backups regulares e seguros</li>
              <li>Monitoramento de segurança contínuo</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">6. Seus Direitos</h2>
            <p className="mb-2">Você tem direito a:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Acessar seus dados pessoais</li>
              <li>Corrigir dados incorretos</li>
              <li>Solicitar a exclusão de seus dados (direito ao esquecimento)</li>
              <li>Exportar seus dados em formato legível</li>
              <li>Revogar seu consentimento a qualquer momento</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">7. Retenção de Dados</h2>
            <p>
              Mantemos seus dados enquanto sua conta estiver ativa. Após a exclusão da conta, 
              seus dados pessoais são permanentemente removidos. Dados anonimizados podem ser 
              mantidos para fins estatísticos e de melhoria da plataforma.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">8. Cookies e Tecnologias Similares</h2>
            <p>
              Utilizamos cookies essenciais para manter sua sessão segura. Não utilizamos 
              cookies de rastreamento ou publicidade.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">9. Alterações nesta Política</h2>
            <p>
              Podemos atualizar esta política periodicamente. Notificaremos sobre mudanças 
              significativas através da plataforma ou por e-mail.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">10. Contato</h2>
            <p>
              Para exercer seus direitos ou esclarecer dúvidas sobre privacidade, entre em 
              contato com o encarregado de proteção de dados do seu hospital.
            </p>
          </section>

          <p className="text-sm text-gray-400 mt-8">
            Última atualização: {new Date().toLocaleDateString('pt-BR')}
          </p>
        </div>
      </div>
    </div>
  );
}
