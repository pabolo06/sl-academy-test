/**
 * SL Academy Platform - Indicators Page
 * View and filter indicators with charts
 */

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

  useEffect(() => {
    fetchIndicators();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [indicators, selectedCategory, startDate, endDate]);

  const fetchIndicators = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const data = await indicatorApi.getAll();
      setIndicators(data);
      
      // Extract unique categories
      const uniqueCategories = Array.from(new Set(data.map((i) => i.category)));
      setCategories(uniqueCategories);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar indicadores');
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...indicators];

    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter((i) => i.category === selectedCategory);
    }

    // Filter by date range
    if (startDate) {
      filtered = filtered.filter((i) => i.reference_date >= startDate);
    }
    if (endDate) {
      filtered = filtered.filter((i) => i.reference_date <= endDate);
    }

    setFilteredIndicators(filtered);
  };

  const handleResetFilters = () => {
    setSelectedCategory('');
    setStartDate('');
    setEndDate('');
  };

  return (
    <DashboardLayout requiredRole="manager">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Indicadores</h1>
            <p className="text-gray-400 mt-1">
              Visualize e analise os indicadores do hospital
            </p>
          </div>
          <Link
            href="/manager/indicators/import"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Importar Indicadores
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
            <p className="text-sm text-gray-400">Total de Indicadores</p>
            <p className="text-2xl font-bold text-white mt-1">{indicators.length}</p>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
            <p className="text-sm text-gray-400">Categorias</p>
            <p className="text-2xl font-bold text-white mt-1">{categories.length}</p>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
            <p className="text-sm text-gray-400">Filtrados</p>
            <p className="text-2xl font-bold text-white mt-1">{filteredIndicators.length}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label htmlFor="category-filter" className="block text-sm font-medium text-gray-300 mb-2">
                Categoria
              </label>
              <select
                id="category-filter"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todas</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="start-date" className="block text-sm font-medium text-gray-300 mb-2">
                Data Inicial
              </label>
              <input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="end-date" className="block text-sm font-medium text-gray-300 mb-2">
                Data Final
              </label>
              <input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-end">
              <button
                onClick={handleResetFilters}
                className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg text-sm hover:bg-gray-600 transition-colors"
              >
                Limpar Filtros
              </button>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="bg-red-900/50 border border-red-700 rounded-lg p-4">
            <p className="text-red-300">{error}</p>
            <button
              onClick={fetchIndicators}
              className="mt-3 px-4 py-2 bg-red-700 text-white rounded-lg text-sm hover:bg-red-600 transition-colors"
            >
              Tentar Novamente
            </button>
          </div>
        ) : filteredIndicators.length === 0 ? (
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-8 text-center">
            <p className="text-gray-400 mb-4">Nenhum indicador encontrado</p>
            <Link
              href="/manager/indicators/import"
              className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
            >
              Importar Indicadores
            </Link>
          </div>
        ) : (
          <>
            {/* Charts */}
            <div className="space-y-6">
              <IndicatorLineChart
                indicators={filteredIndicators}
                title="Tendência ao Longo do Tempo"
              />
              
              <IndicatorBarChart
                indicators={filteredIndicators}
                title="Comparação por Categoria"
              />
            </div>

            {/* Table */}
            <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
              <div className="p-4 border-b border-gray-700">
                <h3 className="text-lg font-semibold text-white">Detalhes dos Indicadores</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-900">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Nome</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Categoria</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Valor</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Unidade</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Data</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Observações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {filteredIndicators.map((indicator) => (
                      <tr key={indicator.id} className="hover:bg-gray-700/50">
                        <td className="px-4 py-3 text-sm text-gray-300">{indicator.name}</td>
                        <td className="px-4 py-3 text-sm text-gray-300">{indicator.category}</td>
                        <td className="px-4 py-3 text-sm text-gray-300 font-medium">{indicator.value}</td>
                        <td className="px-4 py-3 text-sm text-gray-400">{indicator.unit || '-'}</td>
                        <td className="px-4 py-3 text-sm text-gray-400">
                          {new Date(indicator.reference_date).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-400">{indicator.notes || '-'}</td>
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
