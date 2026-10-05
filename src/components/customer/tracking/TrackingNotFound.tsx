'use client';

import React from 'react';
import Link from 'next/link';
import { SearchX, ArrowLeft, BookOpen, RotateCcw } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/Button';

export interface TrackingNotFoundProps {
  referenceQuery?: string;
  onClear?: () => void;
}

export const TrackingNotFound: React.FC<TrackingNotFoundProps> = ({
  referenceQuery,
  onClear,
}) => {
  return (
    <div className="bg-white rounded-sm border border-[#DDDCD3] p-8 sm:p-12 text-center space-y-4 max-w-lg mx-auto ">
      <div className="w-14 h-14 bg-amber-50 text-amber-700 rounded-sm flex items-center justify-center mx-auto ring-8 ring-amber-50/60">
        <SearchX className="w-7 h-7" aria-hidden="true" />
      </div>

      <div className="space-y-1.5">
        <h2 className="text-lg sm:text-xl font-bold text-[#142C43]">
          Tracking information not found
        </h2>
        <p className="text-xs sm:text-sm text-[#61717B] max-w-sm mx-auto leading-relaxed">
          {referenceQuery ? (
            <>
              No order or shipment was found matching reference{' '}
              <span className="font-mono font-bold text-[#142C43]">
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
            className: 'text-xs font-semibold  gap-1.5',
          })}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Browse Books</span>
        </Link>
      </div>
    </div>
  );
};
