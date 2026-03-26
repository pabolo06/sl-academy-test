'use client';

interface ResponsiveCardProps {
  children: React.ReactNode;
  className?: string;
  clickable?: boolean;
}

/**
 * Responsive card component with consistent styling
 * Automatically handles padding and spacing across all screen sizes
 */
export function ResponsiveCard({
  children,
  className = '',
  clickable = false,
}: ResponsiveCardProps) {
  return (
    <div
      className={`
        bg-white/[0.02] border border-white/[0.06] rounded-lg
        p-4 sm:p-5 md:p-6
        transition-all duration-150
        ${clickable ? 'hover:bg-white/[0.04] hover:border-white/[0.1] cursor-pointer' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
}
