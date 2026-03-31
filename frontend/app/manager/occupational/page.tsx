'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { AlertTriangle, CheckCircle, RefreshCw, Loader, AlertCircle, Activity, Users, BookOpen } from 'lucide-react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { occupationalApi } from '@/lib/api';
import { OccupationalAlert, MicroLearningTask, RiskLevel } from '@/types';

const RISK_CONFIG: Record<RiskLevel, { label: string; bg: string; text: string; border: string }> = {
  high:   { label: 'Alto Risco',   bg: 'bg-red-50 dark:bg-red-900/20',    text: 'text-red-700 dark:text-red-300',    border: 'border-red-200 dark:border-red-700' },
  medium: { label: 'Médio Risco',  bg: 'bg-yellow-50 dark:bg-yellow-900/20', text: 'text-yellow-700 dark:text-yellow-300', border: 'border-yellow-200 dark:border-yellow-700' },
  low:    { label: 'Baixo Risco',  bg: 'bg-blue-50 dark:bg-blue-900/20',   text: 'text-blue-700 dark:text-blue-300',   border: 'border-blue-200 dark:border-blue-700' },
};

function RiskBadge({ level }: { level: RiskLevel }) {
  const cfg = RISK_CONFIG[level] || RISK_CONFIG.low;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
      {cfg.label}
    </span>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function OccupationalPage() {
  const [activeTab, setActiveTab] = useState<'alerts' | 'acknowledged' | 'microlearning'>('alerts');
  const [alerts, setAlerts] = useState<OccupationalAlert[]>([]);
  const [acknowledged, setAcknowledged] = useState<OccupationalAlert[]>([]);
  const [tasks, setTasks] = useState<MicroLearningTask[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [activeResp, ackResp, tasksResp] = await Promise.all([
        occupationalApi.getAlerts(false),
        occupationalApi.getAlerts(true),
        occupationalApi.getMicroLearning('pending'),
      ]);
      setAlerts(activeResp.alerts);
      setAcknowledged(ackResp.alerts);
      setTasks(tasksResp.tasks);
    } catch (e: any) {
      setError(e.message || 'Erro ao carregar alertas');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleAcknowledge = async (alertId: string) => {
    try {
      await occupationalApi.acknowledgeAlert(alertId);
      setAlerts(prev => prev.filter(a => a.id !== alertId));
      setSuccessMsg('Alerta reconhecido.');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (e: any) {
      setError(e.message || 'Erro ao reconhecer alerta');
    }
  };

  const handleRunScan = async () => {
    setIsScanning(true);
    setError(null);
    try {
      const result = await occupationalApi.runBurnoutScan();
      setSuccessMsg(`Análise concluída: ${result.doctors_scanned} médicos analisados, ${result.alerts_created} alertas criados.`);
      setTimeout(() => setSuccessMsg(null), 6000);
      await loadData();
    } catch (e: any) {
      setError(e.message || 'Erro ao executar análise');
    } finally {
      setIsScanning(false);
    }
  };

  const highRisk = alerts.filter(a => a.risk_level === 'high').length;
  const medRisk  = alerts.filter(a => a.risk_level === 'medium').length;

  return (
    <DashboardLayout requiredRole="manager">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">Saúde Ocupacional</h1>
            <p className="text-gray-600 dark:text-gray-400">Monitoramento de burnout e micro-aprendizado da equipe médica</p>
          </div>
          <button
            onClick={handleRunScan}
            disabled={isScanning}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium rounded-lg transition-colors text-sm"
          >
            {isScanning ? <Loader size={16} className="animate-spin" /> : <Activity size={16} />}
            {isScanning ? 'Analisando…' : 'Analisar Hospital'}
          </button>
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

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 flex items-center gap-4">
            <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg"><AlertTriangle size={20} className="text-red-600 dark:text-red-400" /></div>
            <div><p className="text-2xl font-bold text-gray-900 dark:text-white">{highRisk}</p><p className="text-xs text-gray-500 dark:text-gray-400">Alto Risco</p></div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 flex items-center gap-4">
            <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg"><Users size={20} className="text-yellow-600 dark:text-yellow-400" /></div>
            <div><p className="text-2xl font-bold text-gray-900 dark:text-white">{alerts.length}</p><p className="text-xs text-gray-500 dark:text-gray-400">Alertas Ativos</p></div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 flex items-center gap-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg"><BookOpen size={20} className="text-blue-600 dark:text-blue-400" /></div>
            <div><p className="text-2xl font-bold text-gray-900 dark:text-white">{tasks.length}</p><p className="text-xs text-gray-500 dark:text-gray-400">Tarefas Pendentes</p></div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <div className="flex">
              {([
                { key: 'alerts',       label: `Alertas Ativos (${alerts.length})` },
                { key: 'acknowledged', label: `Reconhecidos (${acknowledged.length})` },
                { key: 'microlearning',label: `Micro-Aprendizado (${tasks.length})` },
              ] as const).map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.key
                      ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="p-4">
            {isLoading ? (
              <div className="flex justify-center py-12"><Loader size={28} className="text-blue-500 animate-spin" /></div>
            ) : (
              <>
                {/* Active Alerts */}
                {activeTab === 'alerts' && (
                  alerts.length === 0 ? (
                    <div className="text-center py-12">
                      <CheckCircle size={40} className="text-green-500 mx-auto mb-3" />
                      <p className="text-gray-500 dark:text-gray-400 font-medium">Nenhum alerta ativo</p>
                      <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Clique em "Analisar Hospital" para verificar a equipe</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {alerts.map(alert => (
                        <div key={alert.id} className={`p-4 rounded-lg border ${RISK_CONFIG[alert.risk_level]?.bg} ${RISK_CONFIG[alert.risk_level]?.border}`}>
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <RiskBadge level={alert.risk_level} />
                                <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                  {alert.profiles?.email || alert.doctor_id}
                                </span>
                              </div>
                              {alert.triggers && alert.triggers.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {alert.triggers.map((t, i) => (
                                    <span key={i} className="text-xs bg-white/60 dark:bg-black/20 px-2 py-0.5 rounded border border-current/20">
                                      {t}
                                    </span>
                                  ))}
                                </div>
                              )}
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">{formatDate(alert.created_at)}</p>
                            </div>
                            <button
                              onClick={() => handleAcknowledge(alert.id)}
                              className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-xs font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                            >
                              <CheckCircle size={14} />
                              Reconhecer
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                )}

                {/* Acknowledged */}
                {activeTab === 'acknowledged' && (
                  acknowledged.length === 0 ? (
                    <p className="text-center py-12 text-gray-500 dark:text-gray-400">Nenhum alerta reconhecido ainda</p>
                  ) : (
                    <div className="space-y-3">
                      {acknowledged.map(alert => (
                        <div key={alert.id} className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30 flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <RiskBadge level={alert.risk_level} />
                              <span className="text-sm text-gray-700 dark:text-gray-300">{alert.profiles?.email || alert.doctor_id}</span>
                            </div>
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{formatDate(alert.created_at)}</p>
                          </div>
                          <CheckCircle size={16} className="text-green-500" />
                        </div>
                      ))}
                    </div>
                  )
                )}

                {/* Micro Learning */}
                {activeTab === 'microlearning' && (
                  tasks.length === 0 ? (
                    <p className="text-center py-12 text-gray-500 dark:text-gray-400">Nenhuma tarefa de micro-aprendizado pendente</p>
                  ) : (
                    <div className="space-y-3">
                      {tasks.map(task => (
                        <div key={task.id} className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">{task.profiles?.email || task.doctor_id}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Trilha: {task.tracks?.title || task.track_id}</p>
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Prazo: {new Date(task.due_date).toLocaleDateString('pt-BR')}</p>
                          </div>
                          <span className="text-xs font-medium px-2.5 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded-full border border-orange-200 dark:border-orange-700">
                            Pendente
                          </span>
                        </div>
                      ))}
                    </div>
                  )
                )}
              </>
            )}
          </div>
        </div>

        {/* Refresh button */}
        <div className="mt-4 flex justify-end">
          <button onClick={loadData} disabled={isLoading} className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors">
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
            Atualizar
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}
