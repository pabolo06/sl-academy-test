/**
 * SL Academy Platform - Indicator Bar Chart
 * Bar chart for category comparison
 */

'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Indicator } from '@/types';

interface IndicatorBarChartProps {
  indicators: Indicator[];
  title?: string;
}

export function IndicatorBarChart({ indicators, title }: IndicatorBarChartProps) {
  // Group by category and calculate average
  const categoryData = indicators.reduce((acc, indicator) => {
    if (!acc[indicator.category]) {
      acc[indicator.category] = {
        category: indicator.category,
        total: 0,
        count: 0,
      };
    }
    acc[indicator.category].total += indicator.value;
    acc[indicator.category].count += 1;
    return acc;
  }, {} as Record<string, { category: string; total: number; count: number }>);

  const chartData = Object.values(categoryData).map((data) => ({
    category: data.category,
    average: Number((data.total / data.count).toFixed(2)),
    count: data.count,
  }));

  if (indicators.length === 0) {
    return (
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-8 text-center">
        <p className="text-gray-400">Nenhum dado disponível</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
      {title && (
        <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>
      )}
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis 
            dataKey="category" 
            stroke="#9ca3af"
            style={{ fontSize: '12px' }}
          />
          <YAxis 
            stroke="#9ca3af"
            style={{ fontSize: '12px' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1f2937',
              border: '1px solid #374151',
              borderRadius: '8px',
              color: '#fff',
            }}
            formatter={(value: number, name: string) => {
              if (name === 'average') return [value.toFixed(2), 'Média'];
              if (name === 'count') return [value, 'Quantidade'];
              return [value, name];
            }}
          />
          <Legend 
            wrapperStyle={{ fontSize: '12px' }}
            formatter={(value) => {
              if (value === 'average') return 'Média';
              if (value === 'count') return 'Quantidade';
              return value;
            }}
          />
          <Bar dataKey="average" fill="#3b82f6" />
          <Bar dataKey="count" fill="#10b981" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
