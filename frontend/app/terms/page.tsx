export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-gray-800 rounded-lg shadow-xl p-8">
        <h1 className="text-3xl font-bold text-white mb-6">Termos de Serviço</h1>
        
        <div className="space-y-6 text-gray-300">
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">1. Aceitação dos Termos</h2>
            <p>
              Ao acessar e usar a plataforma SL Academy, você concorda com estes Termos de Serviço. 
              Se você não concorda com algum termo, não deve usar a plataforma.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">2. Descrição do Serviço</h2>
            <p>
              A SL Academy é uma plataforma B2B de educação hospitalar que oferece microlearning 
              e acompanhamento de indicadores para melhorar a aderência a protocolos e a segurança 
              do paciente. A plataforma é fornecida ao seu hospital, que gerencia o acesso dos usuários.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">3. Conta de Usuário</h2>
            <p className="mb-2">Ao usar a plataforma, você concorda em:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Fornecer informações verdadeiras e atualizadas</li>
              <li>Manter a confidencialidade de suas credenciais de acesso</li>
              <li>Notificar imediatamente sobre qualquer uso não autorizado de sua conta</li>
              <li>Ser responsável por todas as atividades realizadas em sua conta</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">4. Uso Aceitável</h2>
            <p className="mb-2">Você concorda em NÃO:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Usar a plataforma para fins ilegais ou não autorizados</li>
              <li>Tentar acessar dados de outros hospitais ou usuários</li>
              <li>Interferir ou interromper o funcionamento da plataforma</li>
              <li>Fazer engenharia reversa ou tentar extrair código-fonte</li>
              <li>Compartilhar suas credenciais com terceiros</li>
              <li>Usar bots ou scripts automatizados sem autorização</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">5. Conteúdo Educacional</h2>
            <p>
              Todo o conteúdo educacional (vídeos, avaliações, materiais de apoio) é propriedade 
              da SL Academy ou de seus licenciadores. Você pode acessar o conteúdo apenas para 
              fins de treinamento pessoal, não podendo reproduzir, distribuir ou comercializar 
              sem autorização expressa.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">6. Propriedade Intelectual</h2>
            <p>
              Todos os direitos de propriedade intelectual da plataforma, incluindo design, 
              código, logotipos e conteúdo, pertencem à SL Academy. Nenhuma licença ou direito 
              é concedido além do uso da plataforma conforme estes termos.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">7. Privacidade e Proteção de Dados</h2>
            <p>
              O uso de seus dados pessoais é regido por nossa{' '}
              <a href="/privacy" className="text-blue-400 hover:text-blue-300 underline">
                Política de Privacidade
              </a>
              . Ao usar a plataforma, você consente com a coleta e uso de dados conforme descrito 
              na política.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">8. Disponibilidade do Serviço</h2>
            <p>
              Nos esforçamos para manter a plataforma disponível 24/7, mas não garantimos 
              disponibilidade ininterrupta. Podemos realizar manutenções programadas ou 
              emergenciais que podem afetar temporariamente o acesso.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">9. Limitação de Responsabilidade</h2>
            <p>
              A plataforma é fornecida "como está". Não nos responsabilizamos por:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-4 mt-2">
              <li>Decisões clínicas tomadas com base no conteúdo educacional</li>
              <li>Perda de dados devido a falhas técnicas</li>
              <li>Danos indiretos ou consequenciais do uso da plataforma</li>
              <li>Conteúdo gerado por usuários (dúvidas, respostas)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">10. Modificações dos Termos</h2>
            <p>
              Reservamos o direito de modificar estes termos a qualquer momento. Mudanças 
              significativas serão notificadas através da plataforma. O uso continuado após 
              as mudanças constitui aceitação dos novos termos.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">11. Rescisão</h2>
            <p>
              Seu hospital pode encerrar seu acesso a qualquer momento. Você pode solicitar 
              a exclusão de sua conta através das configurações da plataforma. Podemos suspender 
              ou encerrar contas que violem estes termos.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">12. Lei Aplicável</h2>
            <p>
              Estes termos são regidos pelas leis brasileiras. Quaisquer disputas serão 
              resolvidas nos tribunais competentes do Brasil.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">13. Contato</h2>
            <p>
              Para questões sobre estes termos, entre em contato com o administrador do 
              seu hospital ou com o suporte da SL Academy.
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
