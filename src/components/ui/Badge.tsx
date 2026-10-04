import React from 'react';

export interface BadgeProps {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple' | 'neutral' | 'accent';
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
    default: 'bg-[#EBF7FA] text-[#023859] border-[#D4EBF0]',
    accent: 'bg-[#E0F7FA] text-[#26658C] border-[#A7EBF2]',
    success: 'bg-emerald-50 text-emerald-800 border-emerald-200/80',
    warning: 'bg-amber-50 text-amber-900 border-amber-200/80',
    danger: 'bg-red-50 text-red-800 border-red-200/80',
    info: 'bg-sky-50 text-sky-800 border-sky-200/80',
    purple: 'bg-purple-50 text-purple-800 border-purple-200/80',
    neutral: 'bg-[#EFF8FA] text-[#011C40] border-[#D4EBF0]',
  };

  const dotColors = {
    default: 'bg-[#023859]',
    accent: 'bg-[#54ACBF]',
    success: 'bg-emerald-600',
    warning: 'bg-amber-600',
    danger: 'bg-red-600',
    info: 'bg-sky-600',
    purple: 'bg-purple-600',
    neutral: 'bg-[#26658C]',
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
