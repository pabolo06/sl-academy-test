/**
 * SL Academy Platform - Header Component
 * Top header with user profile and actions
 */

'use client';

import { useAuth } from '@/lib/hooks/useAuth';

export function Header() {
  const { user, logout } = useAuth();

  return (
    <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">
            Bem-vindo de volta!
          </h2>
          <p className="text-sm text-gray-400">
            {user?.role === 'manager' ? 'Painel de Gestão' : 'Área do Médico'}
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm font-medium text-white">{user?.email}</p>
            <p className="text-xs text-gray-400">
              {user?.role === 'manager' ? 'Gestor' : 'Médico'}
            </p>
          </div>

          <button
            onClick={logout}
            className="px-4 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 transition-colors"
          >
            Sair
          </button>
        </div>
      </div>
    </header>
  );
}
