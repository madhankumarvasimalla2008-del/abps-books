'use client';

import React from 'react';
import Link from 'next/link';
import { SearchX, ArrowLeft, BookOpen, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export interface TrackingNotFoundProps {
  referenceQuery?: string;
  onClear?: () => void;
}

export const TrackingNotFound: React.FC<TrackingNotFoundProps> = ({
  referenceQuery,
  onClear,
}) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-8 sm:p-12 text-center space-y-4 max-w-lg mx-auto shadow-2xs">
      <div className="w-14 h-14 bg-amber-50 text-amber-700 rounded-2xl flex items-center justify-center mx-auto ring-8 ring-amber-50/60">
        <SearchX className="w-7 h-7" aria-hidden="true" />
      </div>

      <div className="space-y-1.5">
        <h2 className="text-lg sm:text-xl font-bold text-slate-900">
          Tracking information not found
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
          {referenceQuery ? (
            <>
              No order or shipment was found matching reference{' '}
              <span className="font-mono font-bold text-slate-800">
                &ldquo;{referenceQuery}&rdquo;
              </span>
              . Please check the reference and try again.
            </>
          ) : (
            'We could not find tracking details for the specified reference. Please verify your order number and try again.'
          )}
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
        {onClear && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClear}
            leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
            className="text-xs font-semibold"
          >
            Try Another Reference
          </Button>
        )}

        <Link href="/orders">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
            className="text-xs font-semibold"
          >
            Back to Orders
          </Button>
        </Link>

        <Link href="/books">
          <Button
            type="button"
            variant="primary"
            size="sm"
            leftIcon={<BookOpen className="w-3.5 h-3.5" />}
            className="text-xs font-semibold shadow-2xs"
          >
            Browse Books
          </Button>
        </Link>
      </div>
    </div>
  );
};
