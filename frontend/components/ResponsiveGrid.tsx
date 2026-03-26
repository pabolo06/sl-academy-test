'use client';

interface ResponsiveGridProps {
  children: React.ReactNode;
  cols?: 1 | 2 | 3 | 4;
  className?: string;
}

/**
 * Responsive grid that adapts column count based on screen size
 * - Mobile (default): 1 column
 * - Tablet (sm:): Responsive based on cols prop
 * - Desktop (md:): Full cols prop
 */
export function ResponsiveGrid({
  children,
  cols = 3,
  className = ''
}: ResponsiveGridProps) {
  const colsMap = {
    1: 'grid-cols-1',
    2: 'sm:grid-cols-2 md:grid-cols-2',
    3: 'sm:grid-cols-2 md:grid-cols-3',
    4: 'sm:grid-cols-2 md:grid-cols-4',
  };

  return (
    <div className={`grid grid-cols-1 ${colsMap[cols]} gap-4 ${className}`}>
      {children}
    </div>
  );
}
