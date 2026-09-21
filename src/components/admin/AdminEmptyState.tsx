import React from 'react';
import { PackageOpen } from 'lucide-react';

export interface AdminEmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

export const AdminEmptyState: React.FC<AdminEmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className = '',
}) => {
  return (
    <div
      className={`bg-white rounded-xl border border-slate-200/90 p-8 sm:p-12 text-center flex flex-col items-center justify-center shadow-2xs ${className}`}
    >
      <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 text-slate-500 flex items-center justify-center mb-4">
        {icon || <PackageOpen className="w-6 h-6 text-slate-400" aria-hidden="true" />}
      </div>
      <h3 className="text-base font-semibold text-slate-900 mb-1">{title}</h3>
      <p className="text-xs sm:text-sm text-slate-500 max-w-md mb-6">{description}</p>
      {action && <div className="flex items-center justify-center">{action}</div>}
    </div>
  );
};
