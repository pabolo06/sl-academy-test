/**
 * SL Academy Platform - Doubt Card Component
 * Display doubt with different views for doctor vs manager
 */

'use client';

import { useState } from 'react';
import { Doubt } from '@/types';
import { doubtApi } from '@/lib/api';
import { useAuth } from '@/lib/hooks/useAuth';

interface DoubtCardProps {
  doubt: Doubt;
  onUpdate?: () => void;
}

export function DoubtCard({ doubt, onUpdate }: DoubtCardProps) {
  const { user } = useAuth();
  const [isAnswering, setIsAnswering] = useState(false);
  const [answer, setAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isManager = user?.role === 'manager';
  const isPending = doubt.status === 'pending';

  const handleAnswerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (answer.trim().length < 10) {
      setError('A resposta deve ter pelo menos 10 caracteres');
      return;
    }

    setIsSubmitting(true);

    try {
      await doubtApi.answer(doubt.id, answer);
      setAnswer('');
      setIsAnswering(false);
      if (onUpdate) {
        onUpdate();
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao enviar resposta');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 space-y-3">
      {/* Status Badge */}
      <div className="flex items-center justify-between">
        <span
          className={`px-3 py-1 rounded-full text-xs font-medium ${
            isPending
              ? 'bg-yellow-900/50 text-yellow-300 border border-yellow-700'
              : 'bg-green-900/50 text-green-300 border border-green-700'
          }`}
        >
          {isPending ? 'Pendente' : 'Respondida'}
        </span>
        <span className="text-xs text-gray-500">{formatDate(doubt.created_at)}</span>
      </div>

      {/* Doubt Text */}
      <div>
        <p className="text-sm text-gray-300 whitespace-pre-wrap">{doubt.text}</p>
      </div>

      {/* Doubt Image */}
      {doubt.image_url && (
        <div>
          <img
            src={doubt.image_url}
            alt="Imagem da dúvida"
            className="max-w-full max-h-64 rounded-lg border border-gray-700"
          />
        </div>
      )}

      {/* AI Summary */}
      {doubt.ai_summary && (
        <div className="p-3 bg-blue-900/20 border border-blue-700/50 rounded-lg">
          <p className="text-xs font-medium text-blue-300 mb-1">Resumo IA:</p>
          <p className="text-sm text-gray-300">{doubt.ai_summary}</p>
        </div>
      )}

      {/* Answer Section */}
      {!isPending && doubt.answer && (
        <div className="p-3 bg-gray-900 border border-gray-700 rounded-lg space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-green-300">Resposta:</p>
            {doubt.answered_at && (
              <span className="text-xs text-gray-500">{formatDate(doubt.answered_at)}</span>
            )}
          </div>
          <p className="text-sm text-gray-300 whitespace-pre-wrap">{doubt.answer}</p>
          {doubt.answered_by && (
            <p className="text-xs text-gray-500">Respondido por: {doubt.answered_by}</p>
          )}
        </div>
      )}

      {/* Answer Form (Manager Only) */}
      {isManager && isPending && (
        <div className="pt-3 border-t border-gray-700">
          {!isAnswering ? (
            <button
              onClick={() => setIsAnswering(true)}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              Responder Dúvida
            </button>
          ) : (
            <form onSubmit={handleAnswerSubmit} className="space-y-3">
              <textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Digite sua resposta aqui (mínimo 10 caracteres)..."
                disabled={isSubmitting}
              />
              {error && (
                <p className="text-sm text-red-400">{error}</p>
              )}
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={isSubmitting || answer.trim().length < 10}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:bg-gray-700 disabled:cursor-not-allowed transition-colors"
                >
                  {isSubmitting ? 'Enviando...' : 'Enviar Resposta'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsAnswering(false);
                    setAnswer('');
                    setError(null);
                  }}
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-gray-700 text-white rounded-lg text-sm font-medium hover:bg-gray-600 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
