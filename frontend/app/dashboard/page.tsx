'use client';

import { DashboardLayout } from '@/components/DashboardLayout';
import { useAuth } from '@/lib/hooks/useAuth';

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
          <p className="text-gray-400">
            Bem-vindo ao SL Academy Platform
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-2">Perfil</h3>
            <p className="text-gray-400 text-sm">Email: {user?.email}</p>
            <p className="text-gray-400 text-sm">
              Função: {user?.role === 'manager' ? 'Gestor' : 'Médico'}
            </p>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-2">Hospital</h3>
            <p className="text-gray-400 text-sm">
              {user?.hospital_name || 'Carregando...'}
            </p>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-2">Status</h3>
            <p className="text-green-400 text-sm">✓ Ativo</p>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">
            Próximos Passos
          </h3>
          <ul className="space-y-2 text-gray-400">
            <li>• Explore as trilhas de aprendizado disponíveis</li>
            <li>• Complete os testes de avaliação</li>
            <li>• Tire suas dúvidas com os gestores</li>
            {user?.role === 'manager' && (
              <>
                <li>• Gerencie as trilhas e conteúdos</li>
                <li>• Acompanhe os indicadores do hospital</li>
              </>
            )}
          </ul>
        </div>
      </div>
    </DashboardLayout>
  );
}
