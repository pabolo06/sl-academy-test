'use client';

import React, { useState } from 'react';
import { MessageCircle } from 'lucide-react';
import AIAssistant from './AIAssistant';

export default function AIAssistantButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg transition-all duration-300 z-40 flex items-center justify-center ${
          isOpen
            ? 'bg-blue-600 hover:bg-blue-700 scale-110'
            : 'bg-blue-600 hover:bg-blue-700 scale-100'
        }`}
        aria-label="Open AI Assistant"
        title="AI Assistant"
      >
        <MessageCircle size={24} className="text-white" />
      </button>

      {/* Chat Modal */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-96 h-screen-sm max-h-[600px] rounded-lg shadow-2xl z-40 bg-[#0a0e1a] border border-blue-500/20">
          <AIAssistant onClose={() => setIsOpen(false)} />
        </div>
      )}
    </>
  );
}
