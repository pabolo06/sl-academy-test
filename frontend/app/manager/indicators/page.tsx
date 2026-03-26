'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/DashboardLayout';
import { IndicatorLineChart } from '@/components/IndicatorLineChart';
import { IndicatorBarChart } from '@/components/IndicatorBarChart';
import { indicatorApi } from '@/lib/api';
import { Indicator } from '@/types';

export default function IndicatorsPage() {
  const [indicators, setIndicators] = useState<Indicator[]>([]);
  const [filteredIndicators, setFilteredIndicators] = useState<Indicator[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { fetchIndicators(); }, []);
  useEffect(() => { applyFilters(); }, [indicators, selectedCategory, startDate, endDate]);

  const fetchIndicators = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await indicatorApi.getAll();
      setIndicators(data);
      setCategories(Array.from(new Set(data.map((i) => i.category))));
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar indicadores');
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...indicators];
    if (selectedCategory) filtered = filtered.filter((i) => i.category === selectedCategory);
    if (startDate) filtered = filtered.filter((i) => i.reference_date >= startDate);
    if (endDate) filtered = filtered.filter((i) => i.reference_date <= endDate);
    setFilteredIndicators(filtered);
  };

  const handleResetFilters = () => {
    setSelectedCategory('');
    setStartDate('');
    setEndDate('');
  };

  const hasFilters = selectedCategory || startDate || endDate;

  return (
    <DashboardLayout requiredRole="manager">
      <div className="space-y-6">
        {/* Header */}
        <div className="page-header">
          <div>
            <h1 className="page-title">Indicadores</h1>
            <p className="page-subtitle">Analise os indicadores hospitalares</p>
          </div>
          <Link href="/manager/indicators/import" className="btn-primary flex-shrink-0">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
            Importar
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          {[
            { label: 'Total', value: indicators.length },
            { label: 'Categorias', value: categories.length },
            { label: 'Filtrados', value: filteredIndicators.length },
          ].map(({ label, value }) => (
            <div key={label} className="card p-4 text-center">
              <p className="text-xl sm:text-2xl font-bold text-white tabular-nums">{value}</p>
              <p className="text-xs text-slate-400 mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="card p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 items-end">
            <div>
              <label htmlFor="category-filter" className="form-label">Categoria</label>
              <select
                id="category-filter"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="form-input"
              >
                <option value="">Todas</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="start-date" className="form-label">Data Inicial</label>
              <input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="form-input"
              />
            </div>
            <div>
              <label htmlFor="end-date" className="form-label">Data Final</label>
              <input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="form-input"
              />
            </div>
            <button
              onClick={handleResetFilters}
              disabled={!hasFilters}
              className="btn-secondary disabled:opacity-40"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
              Limpar
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="alert-error">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            <div>
              <p>{error}</p>
              <button onClick={fetchIndicators} className="mt-1.5 text-red-300 hover:text-red-200 underline text-xs">Tentar novamente</button>
            </div>
          </div>
        )}

        {/* Content */}
        {isLoading ? (
          <div className="space-y-4">
            <div className="card h-64 flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          </div>
        ) : filteredIndicators.length === 0 ? (
          <div className="card">
            <div className="empty-state">
              <svg className="empty-state-icon" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
              </svg>
              <p className="empty-state-title">Nenhum indicador encontrado</p>
              <p className="empty-state-text">
                {hasFilters ? 'Tente outros filtros ou limpe a busca' : 'Importe indicadores para começar a análise'}
              </p>
              {!hasFilters && (
                <Link href="/manager/indicators/import" className="btn-primary">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                  </svg>
                  Importar Indicadores
                </Link>
              )}
            </div>
          </div>
        ) : (
          <>
            {/* Charts */}
            <div className="space-y-4">
              <div className="card p-5">
                <IndicatorLineChart indicators={filteredIndicators} title="Tendência ao Longo do Tempo" />
              </div>
              <div className="card p-5">
                <IndicatorBarChart indicators={filteredIndicators} title="Comparação por Categoria" />
              </div>
            </div>

            {/* Table */}
            <div className="card overflow-hidden">
              <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
                <h3 className="section-title">Detalhes</h3>
                <span className="badge badge-blue">{filteredIndicators.length} registros</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-white/[0.02] border-b border-white/[0.06]">
                      {['Nome', 'Categoria', 'Valor', 'Unidade', 'Data', 'Observações'].map((h) => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {filteredIndicators.map((indicator) => (
                      <tr key={indicator.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-4 py-3 text-sm text-slate-200 font-medium">{indicator.name}</td>
                        <td className="px-4 py-3 text-sm">
                          <span className="badge badge-blue">{indicator.category}</span>
                        </td>
                        <td className="px-4 py-3 text-sm text-white font-semibold tabular-nums">{indicator.value}</td>
                        <td className="px-4 py-3 text-sm text-slate-400">{indicator.unit || '—'}</td>
                        <td className="px-4 py-3 text-sm text-slate-400 tabular-nums">
                          {new Date(indicator.reference_date).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-400 max-w-[200px] truncate">{indicator.notes || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
