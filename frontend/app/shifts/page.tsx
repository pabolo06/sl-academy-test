'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Calendar, Sun, Sunset, Moon, Loader, AlertCircle, MessageSquare, Send, Bot, User, RefreshCw } from 'lucide-react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { scheduleApi, rosteringApi } from '@/lib/api';
import { ScheduleSlot, RosteringChatMessage } from '@/types';

const SHIFT_CONFIG = {
  morning:   { label: 'Manhã',  icon: Sun,     bg: 'bg-amber-50 dark:bg-amber-900/20',  border: 'border-amber-200 dark:border-amber-700',  text: 'text-amber-700 dark:text-amber-300',  badge: 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300' },
  afternoon: { label: 'Tarde',  icon: Sunset,   bg: 'bg-orange-50 dark:bg-orange-900/20', border: 'border-orange-200 dark:border-orange-700', text: 'text-orange-700 dark:text-orange-300', badge: 'bg-orange-100 dark:bg-orange-900/40 text-orange-800 dark:text-orange-300' },
  night:     { label: 'Noite',  icon: Moon,     bg: 'bg-indigo-50 dark:bg-indigo-900/20', border: 'border-indigo-200 dark:border-indigo-700', text: 'text-indigo-700 dark:text-indigo-300', badge: 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-800 dark:text-indigo-300' },
};

const DAY_NAMES = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MONTH_NAMES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

function formatDate(dateStr: string) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return `${DAY_NAMES[date.getDay()]}, ${d} ${MONTH_NAMES[m - 1]}`;
}

function groupByDate(slots: ScheduleSlot[]) {
  const map: Record<string, ScheduleSlot[]> = {};
  for (const slot of slots) {
    if (!map[slot.slot_date]) map[slot.slot_date] = [];
    map[slot.slot_date].push(slot);
  }
  return Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
}

export default function ShiftsPage() {
  const [slots, setSlots] = useState<ScheduleSlot[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showChat, setShowChat] = useState(false);

  // AI Chat for swap requests
  const [messages, setMessages] = useState<RosteringChatMessage[]>([
    { role: 'assistant', content: 'Olá! Posso ajudá-lo a solicitar uma troca de turno ou consultar sua escala. Qual turno deseja trocar?' }
  ]);
  const [inputMsg, setInputMsg] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const loadShifts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await scheduleApi.getMyShifts();
      setSlots(data);
    } catch (e: any) {
      setError(e.message || 'Erro ao carregar plantões');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadShifts(); }, [loadShifts]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, showChat]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = inputMsg.trim();
    if (!text || isChatLoading) return;

    const userMsg: RosteringChatMessage = { role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setInputMsg('');
    setIsChatLoading(true);

    try {
      const response = await rosteringApi.chat([...messages, userMsg]);
      setMessages(prev => [...prev, { role: 'assistant', content: response.reply }]);
    } catch (e: any) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Desculpe, ocorreu um erro. Tente novamente.' }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const grouped = groupByDate(slots);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <DashboardLayout requiredRole="doctor">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">Meus Plantões</h1>
            <p className="text-gray-600 dark:text-gray-400">Seus turnos escalados nesta semana</p>
          </div>
          <div className="flex gap-2">
            <button onClick={loadShifts} disabled={isLoading} className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white border border-gray-300 dark:border-gray-600 rounded-lg transition-colors">
              <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
              Atualizar
            </button>
            <button
              onClick={() => setShowChat(v => !v)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <MessageSquare size={16} />
              Solicitar Troca
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex gap-3">
            <AlertCircle size={18} className="text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-red-800 dark:text-red-300 text-sm">{error}</p>
          </div>
        )}

        {/* AI Chat Panel */}
        {showChat && (
          <div className="mb-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
            <div className="border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bot size={18} className="text-blue-500" />
                <span className="font-semibold text-sm text-gray-900 dark:text-white">Assistente de Troca de Turno</span>
              </div>
              <button onClick={() => setShowChat(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xs">Fechar</button>
            </div>
            <div className="h-72 overflow-y-auto p-4 space-y-3">
              {messages.map((msg, i) => (
                <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'assistant' && (
                    <div className="w-7 h-7 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center flex-shrink-0">
                      <Bot size={14} className="text-blue-500" />
                    </div>
                  )}
                  <div className={`max-w-[78%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white rounded-br-sm'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-sm'
                  }`}>
                    {msg.content}
                  </div>
                  {msg.role === 'user' && (
                    <div className="w-7 h-7 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center flex-shrink-0">
                      <User size={14} className="text-gray-600 dark:text-gray-300" />
                    </div>
                  )}
                </div>
              ))}
              {isChatLoading && (
                <div className="flex gap-2">
                  <div className="w-7 h-7 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center">
                    <Bot size={14} className="text-blue-500" />
                  </div>
                  <div className="px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-2xl rounded-bl-sm">
                    <div className="flex gap-1 items-center">
                      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
            <form onSubmit={handleSendMessage} className="border-t border-gray-200 dark:border-gray-700 p-3 flex gap-2">
              <input
                type="text"
                value={inputMsg}
                onChange={e => setInputMsg(e.target.value)}
                placeholder="Ex: Quero trocar meu plantão de quinta à noite…"
                disabled={isChatLoading}
                className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              />
              <button type="submit" disabled={!inputMsg.trim() || isChatLoading} className="p-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl transition-colors">
                {isChatLoading ? <Loader size={16} className="animate-spin" /> : <Send size={16} />}
              </button>
            </form>
          </div>
        )}

        {/* Shifts */}
        {isLoading ? (
          <div className="flex justify-center py-16"><Loader size={32} className="text-blue-500 animate-spin" /></div>
        ) : grouped.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
            <Calendar size={48} className="text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400 font-medium text-lg">Nenhum plantão escalado esta semana</p>
            <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">Aguarde a publicação da escala pelo gestor</p>
          </div>
        ) : (
          <div className="space-y-4">
            {grouped.map(([date, daySlots]) => (
              <div key={date} className={`bg-white dark:bg-gray-800 rounded-lg border shadow-sm ${date === today ? 'border-blue-400 dark:border-blue-600 ring-1 ring-blue-400/30' : 'border-gray-200 dark:border-gray-700'}`}>
                <div className={`px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between ${date === today ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}>
                  <div className="flex items-center gap-2">
                    <Calendar size={16} className={date === today ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'} />
                    <span className={`font-semibold text-sm ${date === today ? 'text-blue-700 dark:text-blue-300' : 'text-gray-900 dark:text-white'}`}>
                      {formatDate(date)}
                    </span>
                  </div>
                  {date === today && (
                    <span className="text-xs font-semibold px-2 py-0.5 bg-blue-600 text-white rounded-full">Hoje</span>
                  )}
                </div>
                <div className="p-3 space-y-2">
                  {daySlots.map(slot => {
                    const cfg = SHIFT_CONFIG[slot.shift as keyof typeof SHIFT_CONFIG] || SHIFT_CONFIG.morning;
                    const Icon = cfg.icon;
                    return (
                      <div key={slot.id} className={`flex items-center gap-3 p-3 rounded-lg border ${cfg.bg} ${cfg.border}`}>
                        <div className={`p-2 rounded-lg bg-white/70 dark:bg-black/20 ${cfg.text}`}>
                          <Icon size={18} />
                        </div>
                        <div>
                          <span className={`inline-flex items-center px-2.5 py-0.5 text-xs font-semibold rounded-full ${cfg.badge}`}>
                            {cfg.label}
                          </span>
                          {slot.notes && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{slot.notes}</p>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
