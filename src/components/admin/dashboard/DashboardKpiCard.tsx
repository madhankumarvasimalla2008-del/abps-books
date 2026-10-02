import React from 'react';
import Link from 'next/link';

export interface DashboardKpiCardProps {
  label: string;
  value: string | number;
  description: string;
  icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean | 'true' | 'false' }>;
  href?: string;
  badge?: string;
  isLoading?: boolean;
}

export const DashboardKpiCard: React.FC<DashboardKpiCardProps> = ({
  label,
  value,
  description,
  icon: Icon,
  href,
  badge,
  isLoading,
}) => {
  const content = (
    <div className="bg-white rounded-xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs hover:border-slate-300 transition-colors h-full flex flex-col justify-between">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            {label}
          </span>
          <div className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            {isLoading ? (
              <span className="inline-block h-8 w-24 bg-slate-200 animate-pulse rounded" />
            ) : (
              value
            )}
          </div>
        </div>
        <div className="w-10 h-10 rounded-xl bg-slate-100 text-emerald-800 border border-slate-200/60 flex items-center justify-center shrink-0">
          <Icon className="w-5 h-5" aria-hidden={true} />
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <span className="truncate">{description}</span>
        {badge && (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200/60 shrink-0">
            {badge}
          </span>
        )}
      </div>
    </div>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="block focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none rounded-xl"
      >
        {content}
      </Link>
    );
  }

  return content;
};
