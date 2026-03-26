'use client';

interface ResponsiveSectionProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

/**
 * Responsive section with title, subtitle, and optional action
 * Automatically handles spacing across all screen sizes
 */
export function ResponsiveSection({
  title,
  subtitle,
  children,
  action,
  className = '',
}: ResponsiveSectionProps) {
  return (
    <section className={`space-y-4 sm:space-y-5 md:space-y-6 ${className}`}>
      {(title || subtitle || action) && (
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 sm:gap-4">
          <div className="min-w-0 flex-1">
            {title && <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white">{title}</h2>}
            {subtitle && <p className="text-sm sm:text-base text-slate-400 mt-1">{subtitle}</p>}
          </div>
          {action && <div className="flex-shrink-0">{action}</div>}
        </div>
      )}
      {children}
    </section>
  );
}
