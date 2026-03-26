'use client';

import React, { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import Link from 'next/link';

interface DrawerItem {
  icon: React.ReactNode;
  label: string;
  href?: string;
  onClick?: () => void;
  divider?: boolean;
}

interface MobileDrawerProps {
  items: DrawerItem[];
  title?: string;
  isAuthenticated?: boolean;
}

export default function MobileDrawer({
  items,
  title = 'Menu',
  isAuthenticated = false,
}: MobileDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Close drawer on route change
  useEffect(() => {
    const handleClose = () => setIsOpen(false);
    window.addEventListener('navigationend', handleClose);
    return () => window.removeEventListener('navigationend', handleClose);
  }, []);

  // Handle swipe gestures
  const [touchStart, setTouchStart] = useState(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEnd = e.changedTouches[0].clientX;
    const diff = touchStart - touchEnd;

    // Swipe left to close (more than 50px)
    if (isOpen && diff > 50) {
      setIsOpen(false);
    }
    // Swipe right to open (more than 50px from left edge)
    if (!isOpen && touchStart < 20 && diff < -50) {
      setIsOpen(true);
    }
  };

  return (
    <>
      {/* Hamburger Button - Only on mobile */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-50 md:hidden p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition"
        aria-label="Toggle menu"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Backdrop - Click to close */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
        />
      )}

      {/* Drawer - Slide from left */}
      <div
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className={`fixed top-0 left-0 h-screen w-72 bg-gradient-to-br from-[#0a0e1a] via-[#0f1419] to-[#0a0e1a] border-r border-white/10 z-40 md:hidden transform transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } overflow-y-auto`}
      >
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600/20 to-emerald-600/20 backdrop-blur-sm border-b border-white/10 px-6 py-6 flex items-center justify-between">
          <h2 className="text-white font-semibold text-lg">{title}</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 hover:bg-white/10 rounded transition"
          >
            <X size={20} className="text-white" />
          </button>
        </div>

        {/* Menu Items */}
        <nav className="px-4 py-6 space-y-2">
          {items.map((item, idx) => (
            <div key={idx}>
              {item.divider ? (
                <div className="h-px bg-white/10 my-4" />
              ) : item.href ? (
                <Link
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition group"
                >
                  <span className="text-lg group-hover:scale-110 transition">
                    {item.icon}
                  </span>
                  <span className="text-sm font-medium">{item.label}</span>
                </Link>
              ) : (
                <button
                  onClick={() => {
                    item.onClick?.();
                    setIsOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition group"
                >
                  <span className="text-lg group-hover:scale-110 transition">
                    {item.icon}
                  </span>
                  <span className="text-sm font-medium">{item.label}</span>
                </button>
              )}
            </div>
          ))}
        </nav>

        {/* Footer hint */}
        <div className="absolute bottom-0 left-0 right-0 px-6 py-4 border-t border-white/10 bg-gradient-to-t from-[#0a0e1a] to-transparent">
          <p className="text-xs text-slate-500 text-center">
            ← Swipe to close
          </p>
        </div>
      </div>
    </>
  );
}
