'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  AlertTriangle, CheckCircle, RefreshCw, Loader, AlertCircle,
  Activity, Users, BookOpen, ChevronRight, Clock, Zap, Brain,
  GraduationCap, X,
} from 'lucide-react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { occupationalApi } from '@/lib/api';
import { OccupationalAlert, MicroLearningTask, RiskLevel } from '@/types';

// ── Design tokens ──────────────────────────────────────────────────────────────

const RISK_CFG = {
  high: {
    label: 'Alto Risco',
    dot: 'bg-red-500',
    badge: 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800',
    card:  'bg-red-50  dark:bg-red-950/30  border-red-200  dark:border-red-800',
    trigger: 'bg-white/60 dark:bg-black/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300',
  },
  medium: {
    label: 'Médio Risco',
    dot: 'bg-amber-500',
    badge: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    card:  'bg-amber-50  dark:bg-amber-950/30  border-amber-200  dark:border-amber-800',
    trigger: 'bg-white/60 dark:bg-black/20 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300',
  },
  low: {
    label: 'Baixo Risco',
    dot: 'bg-blue-400',
    badge: 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
    card:  'bg-blue-50   dark:bg-blue-950/30   border-blue-200   dark:border-blue-800',
    trigger: 'bg-white/60 dark:bg-black/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300',
  },
} satisfies Record<RiskLevel, object>;

const TASK_STATUS_CFG = {
  pending: { label: 'Pendente', cls: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-700' },
  passed:  { label: 'Aprovado', cls: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700' },
  failed:  { label: 'Reprovado', cls: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 border-red-200 dark:border-red-700' },
};

// ── Shared sub-components ──────────────────────────────────────────────────────

function RiskBadge({ level }: { level: RiskLevel }) {
  const cfg = RISK_CFG[level] ?? RISK_CFG.low;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.badge}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function StatusBadge({ status }: { status: 'pending' | 'passed' | 'failed' }) {
  const cfg = TASK_STATUS_CFG[status];
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
}

function SkeletonRow() {
  return (
    <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 animate-pulse">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 space-y-2">
          <div className="flex gap-2">
            <div className="h-6 w-20 bg-gray-200 dark:bg-gray-700 rounded-full" />
            <div className="h-6 w-36 bg-gray-200 dark:bg-gray-700 rounded" />
          </div>
          <div className="h-3 w-44 bg-gray-100 dark:bg-gray-800 rounded" />
        </div>
        <div className="h-9 w-28 bg-gray-200 dark:bg-gray-700 rounded-lg" />
      </div>
    </div>
  );
}

function KpiCard({
  icon, label, value, sub, iconBg,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  sub?: string;
  iconBg: string;
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 flex items-start gap-4 shadow-sm">
      <div className={`flex-shrink-0 p-3 rounded-xl ${iconBg}`}>{icon}</div>
      <div className="min-w-0">
        <p className="text-2xl font-bold text-gray-900 dark:text-white tabular-nums">{value}</p>
        <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mt-0.5">{label}</p>
        {sub && <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{sub}</p>}
      </div>
    </div>
  );
}

function ScanCard({
  icon, iconBg, title, description, buttonLabel, busyLabel, isBusy, buttonCls, onClick,
}: {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  description: string;
  buttonLabel: string;
  busyLabel: string;
  isBusy: boolean;
  buttonCls: string;
  onClick: () => void;
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
      <div className="flex items-start gap-4">
        <div className={`flex-shrink-0 p-3 rounded-xl ${iconBg}`}>{icon}</div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{title}</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 leading-relaxed">{description}</p>
          <button
            onClick={onClick}
            disabled={isBusy}
            className={`mt-4 inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed ${buttonCls}`}
          >
            {isBusy ? <Loader size={15} className="animate-spin" /> : icon}
            {isBusy ? busyLabel : buttonLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ icon, title, hint }: { icon: React.ReactNode; title: string; hint?: string }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 py-14 text-center">
      <div className="flex justify-center mb-3 text-gray-300 dark:text-gray-600">{icon}</div>
      <p className="text-sm font-semibold text-gray-600 dark:text-gray-300">{title}</p>
      {hint && <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5 max-w-xs mx-auto">{hint}</p>}
    </div>
  );
}

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

// ── Page ───────────────────────────────────────────────────────────────────────

type Tab = 'overview' | 'burnout' | 'microlearning';
type TaskFilter = 'pending' | 'passed' | 'failed';

export default function OccupationalPage() {
  const [activeTab, setActiveTab]           = useState<Tab>('overview');
  const [alerts, setAlerts]                 = useState<OccupationalAlert[]>([]);
  const [acknowledged, setAcknowledged]     = useState<OccupationalAlert[]>([]);
  const [tasks, setTasks]                   = useState<MicroLearningTask[]>([]);
  const [taskFilter, setTaskFilter]         = useState<TaskFilter>('pending');
  const [showAcknowledged, setShowAcknowledged] = useState(false);

  const [isLoading, setIsLoading]           = useState(true);
  const [isBurnoutScan, setIsBurnoutScan]   = useState(false);
  const [isMlScan, setIsMlScan]             = useState(false);
  const [ackingId, setAckingId]             = useState<string | null>(null);
  const [error, setError]                   = useState<string | null>(null);
  const [successMsg, setSuccessMsg]         = useState<string | null>(null);

  const isMounted = useRef(true);
  useEffect(() => () => { isMounted.current = false; }, []);

  function flash(msg: string) {
    setSuccessMsg(msg);
    setTimeout(() => { if (isMounted.current) setSuccessMsg(null); }, 5000);
  }

  // ── Data loading ──────────────────────────────────────────────────────────

  async function loadAll(filter: TaskFilter = taskFilter) {
    setIsLoading(true);
    setError(null);
    try {
      const [activeResp, ackResp, tasksResp] = await Promise.all([
        occupationalApi.getAlerts(false),
        occupationalApi.getAlerts(true),
        occupationalApi.getMicroLearning(filter),
      ]);
      if (!isMounted.current) return;
      setAlerts(activeResp.alerts);
      setAcknowledged(ackResp.alerts);
      setTasks(tasksResp.tasks);
    } catch (e: any) {
      if (isMounted.current) setError(e.message || 'Erro ao carregar dados ocupacionais');
    } finally {
      if (isMounted.current) setIsLoading(false);
    }
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadAll(); }, []);

  async function handleFilterChange(f: TaskFilter) {
    setTaskFilter(f);
    try {
      const r = await occupationalApi.getMicroLearning(f);
      if (isMounted.current) setTasks(r.tasks);
    } catch (e: any) {
      if (isMounted.current) setError(e.message || 'Erro ao filtrar tarefas');
    }
  }

  // ── Actions ───────────────────────────────────────────────────────────────

  async function handleAcknowledge(alertId: string) {
    setAckingId(alertId);
    setError(null);
    try {
      await occupationalApi.acknowledgeAlert(alertId);
      setAlerts(prev => prev.filter(a => a.id !== alertId));
      flash('Alerta reconhecido com sucesso.');
    } catch (e: any) {
      setError(e.message || 'Erro ao reconhecer alerta');
    } finally {
      setAckingId(null);
    }
  }

  async function handleBurnoutScan() {
    setIsBurnoutScan(true);
    setError(null);
    try {
      const r = await occupationalApi.runBurnoutScan();
      flash(`Análise concluída: ${r.doctors_scanned} médicos analisados, ${r.alerts_created} alertas gerados.`);
      await loadAll(taskFilter);
    } catch (e: any) {
      setError(e.message || 'Erro ao executar análise de burnout. Tente novamente.');
    } finally {
      setIsBurnoutScan(false);
    }
  }

  async function handleMlScan() {
    setIsMlScan(true);
    setError(null);
    try {
      const r = await occupationalApi.runMicroLearningScan();
      flash(`Geração concluída: ${r.doctors_checked} médicos verificados, ${r.tasks_created} tarefas criadas.`);
      await loadAll(taskFilter);
    } catch (e: any) {
      setError(e.message || 'Erro ao gerar tarefas. Tente novamente.');
    } finally {
      setIsMlScan(false);
    }
  }

  // ── Derived values ────────────────────────────────────────────────────────

  const highRisk    = alerts.filter(a => a.risk_level === 'high').length;
  const medRisk     = alerts.filter(a => a.risk_level === 'medium').length;
  const pendingCount = tasks.filter(t => t.status === 'pending').length;
  const displayedAlerts = showAcknowledged ? acknowledged : alerts;

  const tabs: { key: Tab; label: string; badge?: number }[] = [
    { key: 'overview',      label: 'Visão Geral' },
    { key: 'burnout',       label: 'Alertas de Burnout', badge: alerts.length || undefined },
    { key: 'microlearning', label: 'Micro-Aprendizado',  badge: pendingCount || undefined },
  ];

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <DashboardLayout requiredRole="manager">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Saúde Ocupacional</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Monitoramento de burnout e micro-aprendizado da equipe médica
          </p>
        </div>

        {/* Error banner */}
        {error && (
          <div role="alert" className="mb-5 p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl flex gap-3 items-start">
            <AlertCircle size={18} className="text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <p className="flex-1 text-sm font-medium text-red-800 dark:text-red-300">{error}</p>
            <button
              onClick={() => setError(null)}
              aria-label="Fechar erro"
              className="flex-shrink-0 text-red-400 hover:text-red-600 dark:hover:text-red-300 transition-colors p-1 rounded"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Success banner */}
        {successMsg && (
          <div role="status" aria-live="polite" className="mb-5 p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl flex gap-3 items-start">
            <CheckCircle size={18} className="text-emerald-500 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">{successMsg}</p>
          </div>
        )}

        {/* Tab bar */}
        <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
          <nav className="-mb-px flex" aria-label="Seções de Saúde Ocupacional">
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                aria-selected={activeTab === tab.key}
                className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.key
                    ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                {tab.label}
                {tab.badge !== undefined && (
                  <span className={`inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full text-xs font-semibold ${
                    activeTab === tab.key
                      ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300'
                      : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* ── TAB: Overview ── */}
        {activeTab === 'overview' && (
          <div className="space-y-6">

            {/* KPI cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 h-24 animate-pulse" />
                ))
              ) : (
                <>
                  <KpiCard
                    icon={<AlertTriangle size={20} className="text-red-600 dark:text-red-400" />}
                    label="Alto Risco"
                    value={highRisk}
                    sub="alertas ativos"
                    iconBg="bg-red-100 dark:bg-red-900/40"
                  />
                  <KpiCard
                    icon={<Users size={20} className="text-amber-600 dark:text-amber-400" />}
                    label="Alertas Ativos"
                    value={alerts.length}
                    sub={medRisk > 0 ? `${medRisk} de médio risco` : 'sem novos alertas'}
                    iconBg="bg-amber-100 dark:bg-amber-900/40"
                  />
                  <KpiCard
                    icon={<BookOpen size={20} className="text-blue-600 dark:text-blue-400" />}
                    label="Tarefas Pendentes"
                    value={pendingCount}
                    sub="micro-aprendizado"
                    iconBg="bg-blue-100 dark:bg-blue-900/40"
                  />
                  <KpiCard
                    icon={<CheckCircle size={20} className="text-emerald-600 dark:text-emerald-400" />}
                    label="Reconhecidos"
                    value={acknowledged.length}
                    sub="alertas resolvidos"
                    iconBg="bg-emerald-100 dark:bg-emerald-900/40"
                  />
                </>
              )}
            </div>

            {/* Scan action cards */}
            <div className="grid sm:grid-cols-2 gap-4">
              <ScanCard
                icon={<Activity size={20} className="text-indigo-600 dark:text-indigo-400" />}
                iconBg="bg-indigo-100 dark:bg-indigo-900/40"
                title="Análise de Burnout"
                description="Avalia todos os médicos do hospital e gera alertas de risco com base no padrão de escala e horas trabalhadas."
                buttonLabel="Executar Análise"
                busyLabel="Analisando…"
                isBusy={isBurnoutScan}
                buttonCls="bg-indigo-600 hover:bg-indigo-700 text-white"
                onClick={handleBurnoutScan}
              />
              <ScanCard
                icon={<GraduationCap size={20} className="text-purple-600 dark:text-purple-400" />}
                iconBg="bg-purple-100 dark:bg-purple-900/40"
                title="Micro-Aprendizado"
                description="Detecta certificações vencidas e gera tarefas de recertificação para os médicos que precisam se atualizar."
                buttonLabel="Gerar Tarefas"
                busyLabel="Gerando…"
                isBusy={isMlScan}
                buttonCls="bg-purple-600 hover:bg-purple-700 text-white"
                onClick={handleMlScan}
              />
            </div>

            {/* Recent high-risk alerts */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Alertas de Alto Risco Recentes</h2>
                <button
                  onClick={() => setActiveTab('burnout')}
                  className="flex items-center gap-1 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  Ver todos <ChevronRight size={13} />
                </button>
              </div>

              {isLoading ? (
                <div className="p-4 space-y-3">
                  {[1, 2, 3].map(i => <SkeletonRow key={i} />)}
                </div>
              ) : alerts.filter(a => a.risk_level === 'high').length === 0 ? (
                <div className="py-10 text-center">
                  <CheckCircle size={32} className="text-emerald-500 mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Nenhum alerta de alto risco</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    Execute a análise de burnout para verificar a equipe
                  </p>
                </div>
              ) : (
                <ul className="divide-y divide-gray-100 dark:divide-gray-700">
                  {alerts
                    .filter(a => a.risk_level === 'high')
                    .slice(0, 5)
                    .map(alert => (
                      <li key={alert.id} className="flex items-center justify-between gap-4 px-6 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                              {alert.profiles?.email || alert.doctor_id}
                            </p>
                            <p className="text-xs text-gray-400 dark:text-gray-500">{fmt(alert.created_at)}</p>
                          </div>
                        </div>
                        <RiskBadge level={alert.risk_level} />
                      </li>
                    ))}
                </ul>
              )}
            </div>
          </div>
        )}

        {/* ── TAB: Burnout Alerts ── */}
        {activeTab === 'burnout' && (
          <div className="space-y-4">

            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              {/* Toggle active / acknowledged */}
              <div className="flex bg-gray-100 dark:bg-gray-700/60 rounded-lg p-1 gap-1 w-fit">
                {([false, true] as const).map(isAck => (
                  <button
                    key={String(isAck)}
                    onClick={() => setShowAcknowledged(isAck)}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                      showAcknowledged === isAck
                        ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                    }`}
                  >
                    {isAck ? `Reconhecidos (${acknowledged.length})` : `Ativos (${alerts.length})`}
                  </button>
                ))}
              </div>

              <button
                onClick={handleBurnoutScan}
                disabled={isBurnoutScan}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors min-h-[44px]"
              >
                {isBurnoutScan
                  ? <Loader size={15} className="animate-spin" />
                  : <Activity size={15} />}
                {isBurnoutScan ? 'Analisando…' : 'Analisar Hospital'}
              </button>
            </div>

            {/* Alert list */}
            <div className="space-y-3">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)
              ) : displayedAlerts.length === 0 ? (
                <EmptyState
                  icon={<CheckCircle size={40} />}
                  title={showAcknowledged ? 'Nenhum alerta reconhecido ainda' : 'Nenhum alerta ativo'}
                  hint={!showAcknowledged ? 'Clique em "Analisar Hospital" para verificar a equipe médica' : undefined}
                />
              ) : (
                displayedAlerts.map(alert => {
                  const cfg = RISK_CFG[alert.risk_level] ?? RISK_CFG.low;
                  const isAcking = ackingId === alert.id;
                  return (
                    <div
                      key={alert.id}
                      className={`rounded-xl border p-4 transition-opacity duration-200 ${cfg.card} ${isAcking ? 'opacity-60' : 'opacity-100'}`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0 space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <RiskBadge level={alert.risk_level} />
                            <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                              {alert.profiles?.email || alert.doctor_id}
                            </span>
                          </div>

                          {alert.triggers && alert.triggers.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                              {alert.triggers.map((t, i) => (
                                <span key={i} className={`text-xs px-2 py-0.5 rounded border ${cfg.trigger}`}>
                                  {t}
                                </span>
                              ))}
                            </div>
                          )}

                          <p className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1">
                            <Clock size={11} />
                            {fmt(alert.created_at)}
                          </p>
                        </div>

                        {!showAcknowledged ? (
                          <button
                            onClick={() => handleAcknowledge(alert.id)}
                            disabled={isAcking}
                            aria-label={`Reconhecer alerta de ${alert.profiles?.email || alert.doctor_id}`}
                            className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-xs font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-[44px]"
                          >
                            {isAcking
                              ? <Loader size={13} className="animate-spin" />
                              : <CheckCircle size={13} />}
                            {isAcking ? 'Salvando…' : 'Reconhecer'}
                          </button>
                        ) : (
                          <CheckCircle size={18} className="flex-shrink-0 text-emerald-500 mt-0.5" />
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ── TAB: Micro-Learning ── */}
        {activeTab === 'microlearning' && (
          <div className="space-y-4">

            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              {/* Status filter */}
              <div className="flex bg-gray-100 dark:bg-gray-700/60 rounded-lg p-1 gap-1 w-fit">
                {(['pending', 'passed', 'failed'] as const).map(s => (
                  <button
                    key={s}
                    onClick={() => handleFilterChange(s)}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                      taskFilter === s
                        ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                    }`}
                  >
                    {TASK_STATUS_CFG[s].label}
                  </button>
                ))}
              </div>

              <button
                onClick={handleMlScan}
                disabled={isMlScan}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors min-h-[44px]"
              >
                {isMlScan
                  ? <Loader size={15} className="animate-spin" />
                  : <Brain size={15} />}
                {isMlScan ? 'Gerando…' : 'Gerar Tarefas'}
              </button>
            </div>

            {/* Task list */}
            <div className="space-y-2">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)
              ) : tasks.length === 0 ? (
                <EmptyState
                  icon={<BookOpen size={40} />}
                  title={`Nenhuma tarefa ${TASK_STATUS_CFG[taskFilter].label.toLowerCase()}`}
                  hint={taskFilter === 'pending'
                    ? 'Clique em "Gerar Tarefas" para criar novas recertificações'
                    : undefined}
                />
              ) : (
                tasks.map(task => (
                  <div
                    key={task.id}
                    className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 px-5 py-4 flex items-center justify-between gap-4 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                  >
                    <div className="min-w-0 space-y-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {task.profiles?.email || task.doctor_id}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Trilha:{' '}
                        <span className="font-medium text-gray-700 dark:text-gray-300">
                          {task.tracks?.title || task.track_id}
                        </span>
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1">
                        <Clock size={11} />
                        Prazo:{' '}
                        {new Date(task.due_date).toLocaleDateString('pt-BR', {
                          day: '2-digit', month: 'long', year: 'numeric',
                        })}
                      </p>
                    </div>
                    <StatusBadge status={task.status} />
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Footer refresh */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={() => loadAll(taskFilter)}
            disabled={isLoading}
            className="inline-flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors py-2 px-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/40 min-h-[44px]"
          >
            <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
            Atualizar dados
          </button>
        </div>

      </div>
    </DashboardLayout>
  );
}
