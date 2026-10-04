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
      className={`flex flex-col items-center justify-center p-8 sm:p-12 text-center bg-white rounded-xl border border-dashed border-[#D4EBF0] shadow-xs ${className}`}
    >
      {icon && (
        <div className="p-3.5 bg-[#EBF7FA] text-[#023859] rounded-xl mb-4 border border-[#D4EBF0]">
          {icon}
        </div>
      )}
      <h3 className="text-base sm:text-lg font-serif font-semibold text-[#011C40] tracking-tight">{title}</h3>
      <p className="mt-1.5 text-sm text-[#26658C] max-w-md leading-relaxed">{description}</p>
      {actionLabel && (onAction || actionHref) && (
        <div className="mt-6">
          {actionHref ? (
            <Link
              href={actionHref}
              className="inline-flex items-center justify-center font-medium transition-all duration-150 rounded-lg bg-[#023859] text-white hover:bg-[#011C40] text-sm px-4 py-2 min-h-[40px] shadow-xs"
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
