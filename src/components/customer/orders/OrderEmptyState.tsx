'use client';

import React from 'react';
import Link from 'next/link';
import { PackageOpen, BookOpen, ShoppingBag, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export interface OrderEmptyStateProps {
  isFiltered?: boolean;
  onResetFilters?: () => void;
}

export const OrderEmptyState: React.FC<OrderEmptyStateProps> = ({
  isFiltered = false,
  onResetFilters,
}) => {
  if (isFiltered) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/90 p-8 sm:p-12 text-center space-y-4 max-w-lg mx-auto shadow-2xs">
        <div className="w-14 h-14 bg-slate-100 text-slate-500 rounded-2xl flex items-center justify-center mx-auto">
          <PackageOpen className="w-7 h-7" />
        </div>
        <div className="space-y-1.5">
          <h3 className="text-base font-bold text-slate-900">No Matching Orders Found</h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto">
            No orders match your current search query or status filter.
          </p>
        </div>
        {onResetFilters && (
          <div className="pt-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={onResetFilters}
            >
              Clear Search &amp; Filters
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-8 sm:p-12 text-center space-y-4 max-w-lg mx-auto shadow-2xs">
      <div className="w-16 h-16 bg-emerald-50 text-emerald-800 rounded-2xl flex items-center justify-center mx-auto">
        <ShoppingBag className="w-8 h-8" />
      </div>
      <div className="space-y-1.5">
        <h3 className="text-lg font-bold text-slate-900">No Orders Placed Yet</h3>
        <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto">
          You haven&apos;t placed any orders yet. Explore the curriculum catalog to begin.
        </p>
      </div>
      <div className="pt-2">
        <Link href="/books">
          <Button
            variant="primary"
            size="md"
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            Explore Textbook Catalog
          </Button>
        </Link>
      </div>
    </div>
  );
};
