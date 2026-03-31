'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Rss, Eye, Trash2, RefreshCw, Loader, AlertCircle, CheckCircle, ExternalLink, Search } from 'lucide-react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { watcherApi, trackApi } from '@/lib/api';
import { WatcherAlert, AlertSeverity, Track } from '@/types';

const SEVERITY_CONFIG: Record<AlertSeverity, { label: string; bg: string; text: string; border: string; dot: string }> = {
  high:   { label: 'Alta',   bg: 'bg-red-50 dark:bg-red-900/20',    text: 'text-red-700 dark:text-red-400',    border: 'border-red-200 dark:border-red-700',    dot: 'bg-red-500' },
  medium: { label: 'Média',  bg: 'bg-yellow-50 dark:bg-yellow-900/20', text: 'text-yellow-700 dark:text-yellow-400', border: 'border-yellow-200 dark:border-yellow-700', dot: 'bg-yellow-500' },
  low:    { label: 'Baixa',  bg: 'bg-blue-50 dark:bg-blue-900/20',   text: 'text-blue-700 dark:text-blue-400',   border: 'border-blue-200 dark:border-blue-700',   dot: 'bg-blue-500' },
  info:   { label: 'Info',   bg: 'bg-gray-50 dark:bg-gray-700/30',   text: 'text-gray-600 dark:text-gray-400',   border: 'border-gray-200 dark:border-gray-600',   dot: 'bg-gray-400' },
};

function SeverityBadge({ severity }: { severity: AlertSeverity }) {
  const cfg = SEVERITY_CONFIG[severity] || SEVERITY_CONFIG.info;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

const SOURCE_LABELS: Record<string, string> = {
  pubmed: 'PubMed',
  ministerio_saude: 'Ministério da Saúde',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function WatcherPage() {
  const [alerts, setAlerts] = useState<WatcherAlert[]>([]);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [filterUnread, setFilterUnread] = useState(false);
  const [filterSeverity, setFilterSeverity] = useState('');

  // Check form state
  const [checkTrackId, setCheckTrackId] = useState('');
  const [checkTerm, setCheckTerm] = useState('');
  const [showCheckForm, setShowCheckForm] = useState(false);

  const loadAlerts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await watcherApi.getAlerts({ unreadOnly: filterUnread, severity: filterSeverity || undefined });
      setAlerts(data);
    } catch (e: any) {
      setError(e.message || 'Erro ao carregar alertas');
    } finally {
      setIsLoading(false);
    }
  }, [filterUnread, filterSeverity]);

  useEffect(() => { loadAlerts(); }, [loadAlerts]);

  useEffect(() => {
    trackApi.getAll().then(setTracks).catch(() => {});
  }, []);

  const handleMarkRead = async (alertId: string) => {
    try {
      await watcherApi.markRead(alertId);
      setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, is_read: true } : a));
    } catch (e: any) {
      setError(e.message || 'Erro ao marcar como lido');
    }
  };

  const handleDelete = async (alertId: string) => {
    try {
      await watcherApi.deleteAlert(alertId);
      setAlerts(prev => prev.filter(a => a.id !== alertId));
    } catch (e: any) {
      setError(e.message || 'Erro ao excluir alerta');
    }
  };

  const handleCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkTrackId || !checkTerm) return;
    setIsChecking(true);
    setError(null);
    try {
      const result = await watcherApi.triggerCheck({ track_id: checkTrackId, search_term: checkTerm });
      setSuccessMsg(`Verificação concluída: ${result.alerts_created} novo(s) alerta(s) encontrado(s).`);
      setTimeout(() => setSuccessMsg(null), 6000);
      setShowCheckForm(false);
      setCheckTerm('');
      await loadAlerts();
    } catch (e: any) {
      setError(e.message || 'Erro ao verificar atualizações');
    } finally {
      setIsChecking(false);
    }
  };

  const unreadCount = alerts.filter(a => !a.is_read).length;

  return (
    <DashboardLayout requiredRole="manager">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">Monitor de Diretrizes</h1>
            <p className="text-gray-600 dark:text-gray-400">Alertas clínicos sobre atualizações em protocolos médicos</p>
          </div>
          <button
            onClick={() => setShowCheckForm(v => !v)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors text-sm"
          >
            <Search size={16} />
            Verificar Atualizações
          </button>
        </div>

        {/* Check Form */}
        {showCheckForm && (
          <form onSubmit={handleCheck} className="mb-6 p-5 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-700 rounded-lg">
            <h3 className="font-semibold text-indigo-900 dark:text-indigo-300 mb-3 text-sm">Verificar atualizações para uma trilha</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Trilha</label>
                <select
                  value={checkTrackId}
                  onChange={e => setCheckTrackId(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Selecione uma trilha…</option>
                  {tracks.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Termo de busca</label>
                <input
                  type="text"
                  value={checkTerm}
                  onChange={e => setCheckTerm(e.target.value)}
                  placeholder="ex: sepse, antibiótico profilático"
                  required
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <button
                type="submit"
                disabled={isChecking}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
              >
                {isChecking ? <Loader size={14} className="animate-spin" /> : <Rss size={14} />}
                {isChecking ? 'Verificando…' : 'Verificar'}
              </button>
              <button type="button" onClick={() => setShowCheckForm(false)} className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                Cancelar
              </button>
            </div>
          </form>
        )}

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

        {/* Filters */}
        <div className="mb-4 flex items-center gap-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="unread-filter"
              checked={filterUnread}
              onChange={e => setFilterUnread(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="unread-filter" className="text-sm text-gray-700 dark:text-gray-300">
              Apenas não lidos {unreadCount > 0 && <span className="ml-1 px-1.5 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs rounded-full">{unreadCount}</span>}
            </label>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-700 dark:text-gray-300">Severidade:</label>
            <select
              value={filterSeverity}
              onChange={e => setFilterSeverity(e.target.value)}
              className="text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todas</option>
              <option value="high">Alta</option>
              <option value="medium">Média</option>
              <option value="low">Baixa</option>
              <option value="info">Info</option>
            </select>
          </div>
          <div className="ml-auto">
            <button onClick={loadAlerts} disabled={isLoading} className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
              <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
              Atualizar
            </button>
          </div>
        </div>

        {/* Alert List */}
        <div className="space-y-3">
          {isLoading ? (
            <div className="flex justify-center py-12"><Loader size={28} className="text-blue-500 animate-spin" /></div>
          ) : alerts.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
              <Rss size={40} className="text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400 font-medium">Nenhum alerta clínico encontrado</p>
              <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Use "Verificar Atualizações" para monitorar protocolos</p>
            </div>
          ) : (
            alerts.map(alert => (
              <div key={alert.id} className={`p-4 rounded-lg border ${alert.is_read ? 'opacity-60' : ''} ${SEVERITY_CONFIG[alert.severity as AlertSeverity]?.bg || 'bg-white dark:bg-gray-800'} ${SEVERITY_CONFIG[alert.severity as AlertSeverity]?.border || 'border-gray-200 dark:border-gray-700'}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <SeverityBadge severity={alert.severity as AlertSeverity} />
                      <span className="text-xs text-gray-500 dark:text-gray-400 bg-white/60 dark:bg-black/20 px-2 py-0.5 rounded border border-current/10">
                        {SOURCE_LABELS[alert.source] || alert.source}
                      </span>
                      {!alert.is_read && (
                        <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">● Novo</span>
                      )}
                    </div>
                    <h3 className="font-semibold text-gray-900 dark:text-white text-sm mt-1">{alert.title}</h3>
                    {alert.summary && <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">{alert.summary}</p>}
                    <div className="flex items-center gap-3 mt-2">
                      <p className="text-xs text-gray-400 dark:text-gray-500">{formatDate(alert.created_at)}</p>
                      {alert.url && (
                        <a href={alert.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1 hover:underline">
                          <ExternalLink size={10} /> Ver fonte
                        </a>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    {!alert.is_read && (
                      <button onClick={() => handleMarkRead(alert.id)} title="Marcar como lido" className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors">
                        <Eye size={16} />
                      </button>
                    )}
                    <button onClick={() => handleDelete(alert.id)} title="Excluir alerta" className="p-1.5 text-red-500 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
