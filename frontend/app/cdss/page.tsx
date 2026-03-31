'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader, AlertCircle, BookOpen, ChevronDown, ChevronUp, Stethoscope } from 'lucide-react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { cdssApi } from '@/lib/api';
import { CdssResponse, CdssCitation, CdssConfidence, RosteringChatMessage } from '@/types';

const CONFIDENCE_CONFIG: Record<CdssConfidence, { label: string; bg: string; text: string; border: string }> = {
  high:        { label: 'Alta confiança',    bg: 'bg-green-50 dark:bg-green-900/20',  text: 'text-green-700 dark:text-green-400',  border: 'border-green-200 dark:border-green-700' },
  medium:      { label: 'Média confiança',   bg: 'bg-yellow-50 dark:bg-yellow-900/20', text: 'text-yellow-700 dark:text-yellow-400', border: 'border-yellow-200 dark:border-yellow-700' },
  low:         { label: 'Baixa confiança',   bg: 'bg-orange-50 dark:bg-orange-900/20', text: 'text-orange-700 dark:text-orange-400', border: 'border-orange-200 dark:border-orange-700' },
  no_context:  { label: 'Sem protocolo',     bg: 'bg-gray-50 dark:bg-gray-700/30',    text: 'text-gray-600 dark:text-gray-400',    border: 'border-gray-200 dark:border-gray-600' },
  unavailable: { label: 'Serviço indisponível', bg: 'bg-gray-50 dark:bg-gray-700/30', text: 'text-gray-600 dark:text-gray-400',    border: 'border-gray-200 dark:border-gray-600' },
  error:       { label: 'Erro',              bg: 'bg-red-50 dark:bg-red-900/20',      text: 'text-red-700 dark:text-red-400',      border: 'border-red-200 dark:border-red-700' },
};

interface ChatEntry {
  role: 'user' | 'assistant';
  content: string;
  cdssData?: CdssResponse;
}

function CitationsPanel({ citations, confidence }: { citations: CdssCitation[]; confidence: CdssConfidence }) {
  const [open, setOpen] = useState(false);
  if (!citations.length) return null;
  const cfg = CONFIDENCE_CONFIG[confidence] || CONFIDENCE_CONFIG.low;

  return (
    <div className={`mt-2 rounded-lg border text-xs ${cfg.bg} ${cfg.border}`}>
      <button
        onClick={() => setOpen(v => !v)}
        className={`w-full flex items-center justify-between px-3 py-2 font-medium ${cfg.text}`}
      >
        <span className="flex items-center gap-1.5">
          <BookOpen size={12} />
          {citations.length} fonte{citations.length !== 1 ? 's' : ''} consultada{citations.length !== 1 ? 's' : ''} · {cfg.label}
        </span>
        {open ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
      </button>
      {open && (
        <div className="border-t border-current/10 px-3 py-2 space-y-2">
          {citations.map((c, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="font-bold text-current/60 mt-0.5">{i + 1}.</span>
              <div>
                <p className={`font-semibold ${cfg.text}`}>{c.title}</p>
                <p className="text-gray-500 dark:text-gray-400">{c.track_title} · {(c.similarity * 100).toFixed(0)}% relevância</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const SUGGESTED_QUESTIONS = [
  'Qual é o protocolo para sepse neonatal?',
  'Dose de vancomicina para infecção grave?',
  'Critérios de intubação em UCI adulto?',
  'Profilaxia antibiótica pré-cirúrgica?',
];

export default function CdssPage() {
  const [entries, setEntries] = useState<ChatEntry[]>([]);
  const [inputMsg, setInputMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [entries]);

  const handleAsk = async (question: string) => {
    const q = question.trim();
    if (!q || isLoading) return;

    setEntries(prev => [...prev, { role: 'user', content: q }]);
    setInputMsg('');
    setIsLoading(true);
    setError(null);

    // Build history for context
    const history: RosteringChatMessage[] = entries.flatMap(e =>
      e.cdssData ? [{ role: 'user' as const, content: e.content }] : [{ role: e.role, content: e.content }]
    );

    try {
      const data = await cdssApi.ask(q, history);
      setEntries(prev => [...prev, { role: 'assistant', content: data.answer, cdssData: data }]);
    } catch (e: any) {
      const msg = e.status === 429
        ? 'Limite de consultas atingido. Aguarde um momento.'
        : e.status === 503
        ? 'CDSS não configurado. Contate o administrador do sistema.'
        : e.message || 'Erro ao consultar o sistema clínico';
      setError(msg);
      setEntries(prev => [...prev, { role: 'assistant', content: `⚠️ ${msg}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleAsk(inputMsg);
  };

  return (
    <DashboardLayout requiredRole="doctor">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col h-[calc(100vh-80px)]">
        {/* Header */}
        <div className="mb-5 flex-shrink-0">
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2.5 bg-blue-600/10 border border-blue-500/20 rounded-xl">
              <Stethoscope size={22} className="text-blue-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Suporte Clínico</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">Consultas baseadas nos protocolos do seu hospital</p>
            </div>
          </div>

          <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg">
            <p className="text-xs text-amber-800 dark:text-amber-300">
              <strong>Aviso:</strong> Este sistema fornece informações baseadas nos protocolos internos do hospital. Não substitui o julgamento clínico. Sempre verifique com a equipe médica em situações de emergência.
            </p>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto space-y-4 pb-4 min-h-0">
          {entries.length === 0 ? (
            <div className="text-center py-8">
              <Bot size={48} className="text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400 font-medium mb-6">Consulte os protocolos do hospital</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-lg mx-auto">
                {SUGGESTED_QUESTIONS.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => handleAsk(q)}
                    className="text-left px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-700 dark:text-gray-300 hover:border-blue-400 hover:text-blue-700 dark:hover:border-blue-500 dark:hover:text-blue-400 transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            entries.map((entry, i) => (
              <div key={i} className={`flex gap-3 ${entry.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {entry.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full bg-blue-600/15 border border-blue-500/30 flex items-center justify-center flex-shrink-0 mt-1">
                    <Stethoscope size={16} className="text-blue-500" />
                  </div>
                )}
                <div className={`max-w-[80%] ${entry.role === 'user' ? '' : 'flex-1'}`}>
                  <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                    entry.role === 'user'
                      ? 'bg-blue-600 text-white rounded-br-sm'
                      : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-bl-sm shadow-sm'
                  }`}>
                    {entry.content}
                  </div>
                  {entry.cdssData && (
                    <CitationsPanel
                      citations={entry.cdssData.citations}
                      confidence={entry.cdssData.confidence}
                    />
                  )}
                </div>
                {entry.role === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center flex-shrink-0 mt-1">
                    <User size={16} className="text-gray-600 dark:text-gray-300" />
                  </div>
                )}
              </div>
            ))
          )}
          {isLoading && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-full bg-blue-600/15 border border-blue-500/30 flex items-center justify-center flex-shrink-0">
                <Stethoscope size={16} className="text-blue-500" />
              </div>
              <div className="px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl rounded-bl-sm shadow-sm">
                <div className="flex gap-1 items-center">
                  <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input */}
        <div className="flex-shrink-0 pt-3 border-t border-gray-200 dark:border-gray-700">
          <form onSubmit={handleSubmit} className="flex gap-3">
            <input
              type="text"
              value={inputMsg}
              onChange={e => setInputMsg(e.target.value)}
              placeholder="Faça uma pergunta clínica sobre protocolos, dosagens, procedimentos…"
              disabled={isLoading}
              className="flex-1 px-4 py-3 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!inputMsg.trim() || isLoading}
              className="px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl transition-colors flex items-center gap-2"
            >
              {isLoading ? <Loader size={18} className="animate-spin" /> : <Send size={18} />}
            </button>
          </form>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 text-center">
            Limite: 10 consultas por minuto · Respostas baseadas nos protocolos do hospital
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}
