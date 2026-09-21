import React from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

export interface AdminBreadcrumbItem {
  label: string;
  href?: string;
}

export interface AdminPageHeaderProps {
  title: string;
  description?: string;
  badge?: React.ReactNode;
  breadcrumbs?: AdminBreadcrumbItem[];
  actions?: React.ReactNode;
  className?: string;
}

export const AdminPageHeader: React.FC<AdminPageHeaderProps> = ({
  title,
  description,
  badge,
  breadcrumbs,
  actions,
  className = '',
}) => {
  return (
    <div className={`space-y-2 mb-6 ${className}`}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav aria-label="Admin Breadcrumb" className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
          <Link href="/admin" className="hover:text-emerald-700 transition-colors">
            Admin
          </Link>
          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={idx}>
              <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" aria-hidden="true" />
              {crumb.href ? (
                <Link href={crumb.href} className="hover:text-emerald-700 transition-colors">
                  {crumb.label}
                </Link>
              ) : (
                <span className="text-slate-900 font-medium" aria-current="page">
                  {crumb.label}
                </span>
              )}
            </React.Fragment>
          ))}
        </nav>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              {title}
            </h1>
            {badge && <div className="shrink-0">{badge}</div>}
          </div>
          {description && (
            <p className="text-xs sm:text-sm text-slate-500 max-w-3xl">
              {description}
            </p>
          )}
        </div>

        {actions && (
          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};
