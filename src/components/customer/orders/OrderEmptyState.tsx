'use client';

import React from 'react';
import Link from 'next/link';
import { PackageOpen, BookOpen, ShoppingBag, ArrowRight } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/Button';

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
      <div className="bg-white rounded-sm border border-[#DDDCD3] p-8 sm:p-12 text-center space-y-4 max-w-lg mx-auto ">
        <div className="w-14 h-14 bg-[#F0EEE7] text-[#61717B] rounded-sm flex items-center justify-center mx-auto">
          <PackageOpen className="w-7 h-7" />
        </div>
        <div className="space-y-1.5">
          <h3 className="text-base font-bold text-[#142C43]">No Matching Orders Found</h3>
          <p className="text-xs sm:text-sm text-[#61717B] max-w-sm mx-auto">
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
    <div className="bg-white rounded-sm border border-[#DDDCD3] p-8 sm:p-12 text-center space-y-4 max-w-lg mx-auto ">
      <div className="w-16 h-16 bg-[#EDF2F1] text-[#28657A] rounded-sm flex items-center justify-center mx-auto">
        <ShoppingBag className="w-8 h-8" />
      </div>
      <div className="space-y-1.5">
        <h3 className="text-lg font-bold text-[#142C43]">No Orders Placed Yet</h3>
        <p className="text-xs sm:text-sm text-[#61717B] max-w-sm mx-auto">
          You haven&apos;t placed any orders yet. Explore the curriculum catalog to begin.
        </p>
      </div>
      <div className="pt-2">
        <Link
          href="/books"
          className={buttonVariants({
            variant: 'primary',
            size: 'md',
            className: 'gap-2',
          })}
        >
          <span>Explore Textbook Catalog</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
};
