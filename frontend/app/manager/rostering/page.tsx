'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { CheckCircle, XCircle, MessageSquare, RefreshCw, Loader, AlertCircle, Send, Bot, User, ArrowLeftRight } from 'lucide-react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { rosteringApi } from '@/lib/api';
import { ShiftSwapRequest, RosteringChatMessage, SwapStatus } from '@/types';

const STATUS_CONFIG: Record<SwapStatus, { label: string; bg: string; text: string }> = {
  pending:  { label: 'Pendente',  bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-400' },
  approved: { label: 'Aprovado',  bg: 'bg-green-100 dark:bg-green-900/30',  text: 'text-green-700 dark:text-green-400' },
  rejected: { label: 'Rejeitado', bg: 'bg-red-100 dark:bg-red-900/30',    text: 'text-red-700 dark:text-red-400' },
};

function StatusBadge({ status }: { status: SwapStatus }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.text}`}>{cfg.label}</span>;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function RosteringPage() {
  const [activeTab, setActiveTab] = useState<'swaps' | 'chat'>('swaps');
  const [swaps, setSwaps] = useState<ShiftSwapRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('pending');

  // Chat state
  const [messages, setMessages] = useState<RosteringChatMessage[]>([
    { role: 'assistant', content: 'Olá! Sou o assistente de escala. Posso ajudar a consultar turnos, verificar disponibilidade de médicos e gerenciar solicitações de troca. Como posso ajudar?' }
  ]);
  const [inputMsg, setInputMsg] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const loadSwaps = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await rosteringApi.getSwaps(filterStatus !== 'all' ? filterStatus : undefined);
      setSwaps(data);
    } catch (e: any) {
      setError(e.message || 'Erro ao carregar trocas');
    } finally {
      setIsLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => { loadSwaps(); }, [loadSwaps]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleApprove = async (swapId: string) => {
    setActionLoading(swapId + '-approve');
    try {
      await rosteringApi.approveSwap(swapId);
      setSwaps(prev => prev.map(s => s.id === swapId ? { ...s, status: 'approved' as SwapStatus } : s));
      setSuccessMsg('Troca aprovada com sucesso!');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (e: any) {
      setError(e.message || 'Erro ao aprovar troca');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (swapId: string) => {
    setActionLoading(swapId + '-reject');
    try {
      await rosteringApi.rejectSwap(swapId);
      setSwaps(prev => prev.map(s => s.id === swapId ? { ...s, status: 'rejected' as SwapStatus } : s));
      setSuccessMsg('Troca rejeitada.');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (e: any) {
      setError(e.message || 'Erro ao rejeitar troca');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = inputMsg.trim();
    if (!text || isChatLoading) return;

    const userMsg: RosteringChatMessage = { role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setInputMsg('');
    setIsChatLoading(true);

    try {
      const allMessages = [...messages, userMsg];
      const response = await rosteringApi.chat(allMessages);
      setMessages(prev => [...prev, { role: 'assistant', content: response.reply }]);
      if (response.swap_created) {
        setSuccessMsg('Solicitação de troca criada pelo assistente!');
        setTimeout(() => setSuccessMsg(null), 5000);
        await loadSwaps();
      }
    } catch (e: any) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Desculpe, ocorreu um erro. Tente novamente.' }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const pendingCount = swaps.filter(s => s.status === 'pending').length;

  return (
    <DashboardLayout requiredRole="manager">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">Rostering Inteligente</h1>
          <p className="text-gray-600 dark:text-gray-400">Gerencie trocas de turno e consulte o assistente IA para suporte na escalação</p>
        </div>

        {/* Feedback */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex gap-3">
            <AlertCircle size={18} className="text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-red-800 dark:text-red-300 text-sm">{error}</p>
          </div>
        )}
        {successMsg && (
          <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex gap-3">
            <CheckCircle size={18} className="text-green-600 flex-shrink-0 mt-0.5" />
            <p className="text-green-800 dark:text-green-300 text-sm">{successMsg}</p>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <div className="flex">
              <button
                onClick={() => setActiveTab('swaps')}
                className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'swaps' ? 'border-blue-600 text-blue-600 dark:text-blue-400' : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
              >
                <ArrowLeftRight size={16} />
                Trocas de Turno
                {pendingCount > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 text-xs font-bold bg-red-500 text-white rounded-full">{pendingCount}</span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('chat')}
                className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'chat' ? 'border-blue-600 text-blue-600 dark:text-blue-400' : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
              >
                <Bot size={16} />
                Assistente IA
              </button>
            </div>
          </div>

          {/* Swaps Tab */}
          {activeTab === 'swaps' && (
            <div className="p-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-700 dark:text-gray-300">Status:</label>
                  <select
                    value={filterStatus}
                    onChange={e => setFilterStatus(e.target.value)}
                    className="text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded px-2 py-1"
                  >
                    <option value="all">Todos</option>
                    <option value="pending">Pendentes</option>
                    <option value="approved">Aprovados</option>
                    <option value="rejected">Rejeitados</option>
                  </select>
                </div>
                <button onClick={loadSwaps} disabled={isLoading} className="ml-auto flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
                  <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
                  Atualizar
                </button>
              </div>

              {isLoading ? (
                <div className="flex justify-center py-12"><Loader size={28} className="text-blue-500 animate-spin" /></div>
              ) : swaps.length === 0 ? (
                <div className="text-center py-12">
                  <ArrowLeftRight size={40} className="text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-500 dark:text-gray-400">Nenhuma solicitação de troca encontrada</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {swaps.map(swap => (
                    <div key={swap.id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-700/30">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <StatusBadge status={swap.status} />
                            <span className="text-xs text-gray-500 dark:text-gray-400">{formatDate(swap.created_at)}</span>
                          </div>
                          <div className="text-sm text-gray-700 dark:text-gray-300 space-y-0.5">
                            <p><span className="font-medium">Solicitante:</span> {swap.requester_id.slice(0, 8)}…</p>
                            <p><span className="font-medium">Alvo:</span> {swap.target_id.slice(0, 8)}…</p>
                            {swap.reason && <p><span className="font-medium">Motivo:</span> {swap.reason}</p>}
                          </div>
                        </div>
                        {swap.status === 'pending' && (
                          <div className="flex gap-2 flex-shrink-0">
                            <button
                              onClick={() => handleApprove(swap.id)}
                              disabled={actionLoading === swap.id + '-approve'}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-xs font-medium rounded-lg transition-colors"
                            >
                              {actionLoading === swap.id + '-approve' ? <Loader size={12} className="animate-spin" /> : <CheckCircle size={12} />}
                              Aprovar
                            </button>
                            <button
                              onClick={() => handleReject(swap.id)}
                              disabled={actionLoading === swap.id + '-reject'}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-xs font-medium rounded-lg transition-colors"
                            >
                              {actionLoading === swap.id + '-reject' ? <Loader size={12} className="animate-spin" /> : <XCircle size={12} />}
                              Rejeitar
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Chat Tab */}
          {activeTab === 'chat' && (
            <div className="flex flex-col h-[500px]">
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg, i) => (
                  <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {msg.role === 'assistant' && (
                      <div className="w-8 h-8 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center flex-shrink-0">
                        <Bot size={16} className="text-blue-500" />
                      </div>
                    )}
                    <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-blue-600 text-white rounded-br-sm'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-sm'
                    }`}>
                      {msg.content}
                    </div>
                    {msg.role === 'user' && (
                      <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center flex-shrink-0">
                        <User size={16} className="text-gray-600 dark:text-gray-300" />
                      </div>
                    )}
                  </div>
                ))}
                {isChatLoading && (
                  <div className="flex gap-3 justify-start">
                    <div className="w-8 h-8 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center flex-shrink-0">
                      <Bot size={16} className="text-blue-500" />
                    </div>
                    <div className="px-4 py-2.5 bg-gray-100 dark:bg-gray-700 rounded-2xl rounded-bl-sm">
                      <div className="flex gap-1 items-center">
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
              <form onSubmit={handleSendMessage} className="border-t border-gray-200 dark:border-gray-700 p-4 flex gap-3">
                <input
                  type="text"
                  value={inputMsg}
                  onChange={e => setInputMsg(e.target.value)}
                  placeholder="Pergunte sobre turnos, disponibilidade de médicos…"
                  disabled={isChatLoading}
                  className="flex-1 px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={!inputMsg.trim() || isChatLoading}
                  className="p-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl transition-colors"
                >
                  {isChatLoading ? <Loader size={18} className="animate-spin" /> : <Send size={18} />}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
