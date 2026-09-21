import React from 'react';

export interface BadgeProps {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple' | 'neutral';
  children: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md';
  icon?: React.ReactNode;
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'default',
  children,
  className = '',
  size = 'md',
  icon,
  dot,
}) => {
  const styles = {
    default: 'bg-emerald-50 text-emerald-800 border-emerald-200/80',
    success: 'bg-emerald-50 text-emerald-800 border-emerald-200/80',
    warning: 'bg-amber-50 text-amber-800 border-amber-200/80',
    danger: 'bg-red-50 text-red-800 border-red-200/80',
    info: 'bg-blue-50 text-blue-800 border-blue-200/80',
    purple: 'bg-purple-50 text-purple-800 border-purple-200/80',
    neutral: 'bg-slate-100 text-slate-700 border-slate-200/80',
  };

  const dotColors = {
    default: 'bg-emerald-600',
    success: 'bg-emerald-600',
    warning: 'bg-amber-600',
    danger: 'bg-red-600',
    info: 'bg-blue-600',
    purple: 'bg-purple-600',
    neutral: 'bg-slate-500',
  };

  const sizes = {
    sm: 'text-[11px] px-2 py-0.5 font-medium gap-1',
    md: 'text-xs px-2.5 py-0.5 font-medium gap-1.5',
  };

  return (
    <span
      className={`inline-flex items-center rounded-md border ${styles[variant]} ${sizes[size]} ${className}`}
    >
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColors[variant]}`}
          aria-hidden="true"
        />
      )}
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
    </span>
  );
};
