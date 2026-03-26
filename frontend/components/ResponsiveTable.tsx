'use client';

interface ResponsiveTableProps {
  headers: string[];
  rows: (string | React.ReactNode)[][];
  className?: string;
  mobileCardView?: boolean;
}

/**
 * Responsive table that becomes card view on mobile
 * - Desktop: Full table view
 * - Mobile: Card view (if mobileCardView = true) or scrollable table
 */
export function ResponsiveTable({
  headers,
  rows,
  className = '',
  mobileCardView = true,
}: ResponsiveTableProps) {
  if (mobileCardView && rows.length === 0) {
    return <div className="text-center py-8 text-slate-400">Nenhum dado disponível</div>;
  }

  return (
    <>
      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className={`w-full text-sm ${className}`}>
          <thead>
            <tr className="border-b border-white/[0.06]">
              {headers.map((header, i) => (
                <th
                  key={i}
                  className="px-4 py-3 text-left text-xs font-semibold text-slate-300 bg-white/[0.02]"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                {row.map((cell, j) => (
                  <td key={j} className="px-4 py-3 text-slate-300">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {rows.map((row, i) => (
          <div key={i} className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-4 space-y-2">
            {headers.map((header, j) => (
              <div key={j} className="flex justify-between items-start">
                <span className="text-xs font-semibold text-slate-400">{header}</span>
                <span className="text-sm text-slate-300 text-right">{row[j]}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </>
  );
}
