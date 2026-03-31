'use client';

import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface DrawerItem {
  icon?: React.ReactNode;
  label?: string;
  href?: string;
  onClick?: () => void;
  divider?: boolean;
}

interface MobileDrawerProps {
  items: DrawerItem[];
  title?: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function MobileDrawer({ items, title = 'Menu', isOpen, onClose }: MobileDrawerProps) {
  const pathname = usePathname();

  // Close on route change
  useEffect(() => {
    onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Swipe left to close
  const [touchStart, setTouchStart] = React.useState(0);
  const handleTouchStart = (e: React.TouchEvent) => setTouchStart(e.touches[0].clientX);
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (isOpen && touchStart - e.changedTouches[0].clientX > 50) onClose();
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-30 bg-black/60 md:hidden backdrop-blur-sm"
        />
      )}

      {/* Drawer panel */}
      <div
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className={`fixed top-0 left-0 h-screen w-64 bg-[#0d1117] border-r border-white/[0.05] z-40 md:hidden flex flex-col transform transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="px-5 py-5 border-b border-white/[0.05] flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <span className="text-white font-bold text-xs">S</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-white leading-none">SL Academy</p>
              <p className="text-xs text-slate-500 mt-0.5">{title}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white/[0.07] rounded-lg transition-colors"
            aria-label="Fechar menu"
          >
            <X size={16} className="text-slate-400" />
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          <ul className="space-y-0.5">
            {items.map((item, idx) => {
              if (item.divider) {
                return <li key={idx} className="h-px bg-white/[0.05] my-2" />;
              }

              const isActive =
                item.href &&
                (pathname === item.href ||
                  (item.href !== '/dashboard' &&
                    item.href !== '/manager/dashboard' &&
                    pathname.startsWith(item.href + '/')));

              if (item.href) {
                return (
                  <li key={idx}>
                    <Link
                      href={item.href}
                      onClick={onClose}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group relative ${
                        isActive
                          ? 'bg-blue-600/15 text-blue-400 border border-blue-500/20'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.05] border border-transparent'
                      }`}
                    >
                      <span
                        className={`flex-shrink-0 transition-colors ${
                          isActive ? 'text-blue-400' : 'text-slate-500 group-hover:text-slate-300'
                        }`}
                      >
                        {item.icon}
                      </span>
                      <span>{item.label}</span>
                      {isActive && (
                        <span className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-400" />
                      )}
                    </Link>
                  </li>
                );
              }

              return (
                <li key={idx}>
                  <button
                    onClick={() => {
                      item.onClick?.();
                      onClose();
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-slate-200 hover:bg-white/[0.05] border border-transparent transition-all duration-150 group"
                  >
                    <span className="flex-shrink-0 text-slate-500 group-hover:text-slate-300 transition-colors">
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </>
  );
}
