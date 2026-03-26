'use client';

import React, { useState } from 'react';
import { MessageCircle } from 'lucide-react';
import AIAssistant from './AIAssistant';

export default function AIAssistantButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating Button - responsive size */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-4 sm:bottom-6 right-4 sm:right-6 w-12 sm:w-14 h-12 sm:h-14 rounded-full shadow-lg transition-all duration-300 z-40 flex items-center justify-center ${
          isOpen
            ? 'bg-blue-600 hover:bg-blue-700 scale-110'
            : 'bg-blue-600 hover:bg-blue-700 scale-100'
        }`}
        aria-label="Open AI Assistant"
        title="AI Assistant"
      >
        <MessageCircle size={20} className="sm:hidden text-white" />
        <MessageCircle size={24} className="hidden sm:block text-white" />
      </button>

      {/* Chat Modal - responsive */}
      {isOpen && (
        <div className="fixed inset-0 bottom-auto top-16 sm:top-auto sm:bottom-24 right-4 sm:right-6 left-4 sm:left-auto sm:w-96 max-h-[calc(100vh-100px)] sm:max-h-[600px] rounded-lg shadow-2xl z-40 bg-[#0a0e1a] border border-blue-500/20 flex flex-col">
          <AIAssistant onClose={() => setIsOpen(false)} />
        </div>
      )}
    </>
  );
}
