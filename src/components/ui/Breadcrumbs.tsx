import React from 'react';
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items, className = '' }) => {
  return (
    <nav className={`flex items-center text-xs text-slate-500 mb-5 ${className}`} aria-label="Breadcrumb">
      <ol className="flex items-center space-x-1.5 flex-wrap">
        <li>
          <Link
            href="/"
            className="hover:text-emerald-700 flex items-center gap-1.5 font-medium transition-colors py-1 focus:outline-none focus-visible:underline"
          >
            <Home className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
            <span>Home</span>
          </Link>
        </li>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={index} className="flex items-center space-x-1.5">
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" aria-hidden="true" />
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className="hover:text-emerald-700 font-medium text-slate-600 transition-colors py-1 focus:outline-none focus-visible:underline"
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  className="text-slate-900 font-semibold truncate max-w-[240px] sm:max-w-[320px]"
                  aria-current="page"
                >
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
