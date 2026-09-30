'use client';

import React from 'react';
import Link from 'next/link';
import { Clock, ArrowLeft, BookOpen, FileText } from 'lucide-react';
import { buttonVariants } from '@/components/ui/Button';

export interface TrackingEmptyStateProps {
  orderId?: string;
}

export const TrackingEmptyState: React.FC<TrackingEmptyStateProps> = ({ orderId }) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-8 sm:p-12 text-center space-y-4 max-w-lg mx-auto shadow-2xs">
      <div className="w-14 h-14 bg-slate-100 text-slate-500 rounded-2xl flex items-center justify-center mx-auto ring-8 ring-slate-100/60">
        <Clock className="w-7 h-7" aria-hidden="true" />
      </div>

      <div className="space-y-1.5">
        <h2 className="text-lg sm:text-xl font-bold text-slate-900">
          Tracking information isn&apos;t available yet.
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
          Tracking details will appear here when available.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
        {orderId && (
          <Link
            href={`/orders/${orderId}`}
            className={buttonVariants({
              variant: 'outline',
              size: 'sm',
              className: 'text-xs font-semibold gap-1.5',
            })}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>View Order</span>
          </Link>
        )}

        <Link
          href="/orders"
          className={buttonVariants({
            variant: 'secondary',
            size: 'sm',
            className: 'text-xs font-semibold gap-1.5',
          })}
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Orders</span>
        </Link>

        <Link
          href="/books"
          className={buttonVariants({
            variant: 'primary',
            size: 'sm',
            className: 'text-xs font-semibold shadow-2xs gap-1.5',
          })}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Continue Shopping</span>
        </Link>
      </div>
    </div>
  );
};
