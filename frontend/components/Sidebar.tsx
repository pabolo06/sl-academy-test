/**
 * SL Academy Platform - Sidebar Component
 * Navigation sidebar with role-based menu items
 */

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';

interface MenuItem {
  label: string;
  href: string;
  icon: string;
  roles?: ('manager' | 'doctor')[];
}

const menuItems: MenuItem[] = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: '📊',
  },
  {
    label: 'Trilhas',
    href: '/tracks',
    icon: '📚',
  },
  {
    label: 'Minhas Dúvidas',
    href: '/doubts',
    icon: '❓',
    roles: ['doctor'],
  },
  {
    label: 'Gerenciar Dúvidas',
    href: '/manager/doubts',
    icon: '💬',
    roles: ['manager'],
  },
  {
    label: 'Gerenciar Trilhas',
    href: '/manager/tracks',
    icon: '⚙️',
    roles: ['manager'],
  },
  {
    label: 'Indicadores',
    href: '/manager/indicators',
    icon: '📈',
    roles: ['manager'],
  },
  {
    label: 'Dashboard Gerencial',
    href: '/manager/dashboard',
    icon: '📊',
    roles: ['manager'],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, isManager, isDoctor } = useAuth();

  const filteredMenuItems = menuItems.filter((item) => {
    if (!item.roles) return true;
    if (isManager && item.roles.includes('manager')) return true;
    if (isDoctor && item.roles.includes('doctor')) return true;
    return false;
  });

  return (
    <aside className="w-64 bg-gray-800 min-h-screen p-4 flex flex-col">
      <div className="mb-8">
        <h1 className="text-xl font-bold text-white">SL Academy</h1>
        <p className="text-sm text-gray-400 mt-1">
          {user?.role === 'manager' ? 'Gestor' : 'Médico'}
        </p>
      </div>

      <nav className="flex-1">
        <ul className="space-y-2">
          {filteredMenuItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  <span className="text-xl">{item.icon}</span>
                  <span className="font-medium">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="mt-auto pt-4 border-t border-gray-700">
        <div className="text-sm text-gray-400">
          <p className="truncate">{user?.email}</p>
          <p className="text-xs mt-1">{user?.hospital_name || 'Hospital'}</p>
        </div>
      </div>
    </aside>
  );
}
