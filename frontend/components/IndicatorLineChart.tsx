/**
 * SL Academy Platform - Indicator Line Chart
 * Line chart for indicator trends over time
 */

'use client';

import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Indicator } from '@/types';

interface IndicatorLineChartProps {
  indicators: Indicator[];
  title?: string;
}

export function IndicatorLineChart({ indicators, title }: IndicatorLineChartProps) {
  // Group indicators by name and sort by date
  const groupedData = useMemo(() => {
    const grouped = indicators.reduce((acc, indicator) => {
      if (!acc[indicator.name]) {
        acc[indicator.name] = [];
      }
      acc[indicator.name].push(indicator);
      return acc;
    }, {} as Record<string, Indicator[]>);

    // Sort each group by date
    Object.keys(grouped).forEach((name) => {
      grouped[name].sort((a, b) =>
        new Date(a.reference_date).getTime() - new Date(b.reference_date).getTime()
      );
    });

    return grouped;
  }, [indicators]);

  // Transform data for recharts
  const chartData = useMemo(() => {
    const allDates = Array.from(
      new Set(indicators.map((i) => i.reference_date))
    ).sort();

    return allDates.map((date) => {
      const dataPoint: any = { date: formatDate(date) };

      Object.keys(groupedData).forEach((name) => {
        const indicator = groupedData[name].find((i) => i.reference_date === date);
        if (indicator) {
          dataPoint[name] = indicator.value;
        }
      });

      return dataPoint;
    });
  }, [indicators, groupedData]);

  const colors = [
    '#3b82f6', // blue
    '#10b981', // green
    '#f59e0b', // amber
    '#ef4444', // red
    '#8b5cf6', // purple
    '#ec4899', // pink
  ];

  function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
  }

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
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis
            dataKey="date"
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
          />
          <Legend
            wrapperStyle={{ fontSize: '12px' }}
          />
          {Object.keys(groupedData).map((name, index) => (
            <Line
              key={name}
              type="monotone"
              dataKey={name}
              stroke={colors[index % colors.length]}
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
