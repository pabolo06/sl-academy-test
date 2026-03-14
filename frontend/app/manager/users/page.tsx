/**
 * SL Academy Platform - User Management Page (Future Feature)
 * Placeholder for user management functionality
 */

'use client';

import { DashboardLayout } from '@/components/DashboardLayout';

export default function UserManagementPage() {
  return (
    <DashboardLayout requiredRole="manager">
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Gerenciar Usuários</h1>
          <p className="text-gray-400 mt-1">Gerencie médicos e pontos focais do hospital</p>
        </div>

        <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-8 text-center">
          <svg className="mx-auto h-16 w-16 text-blue-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          <h2 className="text-xl font-semibold text-white mb-2">Funcionalidade em Desenvolvimento</h2>
          <p className="text-gray-300 mb-6">
            O gerenciamento de usuários estará disponível em breve. Esta funcionalidade permitirá:
          </p>
          <ul className="text-left max-w-md mx-auto space-y-2 text-gray-300 mb-6">
            <li className="flex items-start gap-2">
              <svg className="w-5 h-5 text-blue-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Criar e gerenciar contas de médicos</span>
            </li>
            <li className="flex items-start gap-2">
              <svg className="w-5 h-5 text-blue-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Designar pontos focais para trilhas específicas</span>
            </li>
            <li className="flex items-start gap-2">
              <svg className="w-5 h-5 text-blue-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Visualizar histórico de atividades dos usuários</span>
            </li>
            <li className="flex items-start gap-2">
              <svg className="w-5 h-5 text-blue-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Gerenciar permissões e acessos</span>
            </li>
          </ul>
          <p className="text-sm text-gray-400">
            Por enquanto, os usuários são gerenciados através do sistema de autenticação do Supabase.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}
