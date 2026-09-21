import React from 'react';
import Link from 'next/link';
import { Button } from './Button';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  actionHref?: string;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  actionHref,
  className = '',
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center p-8 sm:p-12 text-center bg-white rounded-xl border border-dashed border-slate-300 shadow-xs ${className}`}
    >
      {icon && (
        <div className="p-3.5 bg-slate-50 text-slate-500 rounded-xl mb-4 border border-slate-200/60">
          {icon}
        </div>
      )}
      <h3 className="text-base font-semibold text-slate-900 tracking-tight">{title}</h3>
      <p className="mt-1.5 text-sm text-slate-500 max-w-md leading-relaxed">{description}</p>
      {actionLabel && (onAction || actionHref) && (
        <div className="mt-6">
          {actionHref ? (
            <Link
              href={actionHref}
              className="inline-flex items-center justify-center font-medium transition-colors rounded-lg bg-emerald-700 text-white hover:bg-emerald-800 text-sm px-4 py-2 min-h-[40px] shadow-xs"
            >
              {actionLabel}
            </Link>
          ) : (
            <Button onClick={onAction} size="md">
              {actionLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
