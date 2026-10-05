'use client';

import React from 'react';
import Link from 'next/link';
import { BookX, ArrowLeft, Search } from 'lucide-react';
import { buttonVariants } from '@/components/ui/Button';

export interface ProductNotFoundProps {
  productId?: string;
}

export const ProductNotFound: React.FC<ProductNotFoundProps> = ({ productId }) => {
  return (
    <div className="bg-white rounded-sm border border-[#DDDCD3] p-8 sm:p-14 text-center max-w-xl mx-auto my-8  space-y-5">
      <div className="w-16 h-16 bg-[#F0EEE7] text-[#61717B] rounded-sm flex items-center justify-center mx-auto">
        <BookX className="w-8 h-8 text-slate-400" />
      </div>

      <div className="space-y-1.5">
        <h1 className="text-xl sm:text-2xl font-bold text-[#142C43]">
          Book Not Found
        </h1>
        <p className="text-xs sm:text-sm text-[#61717B] max-w-md mx-auto">
          The requested book {productId ? <span className="font-mono font-semibold text-[#526570]">(&quot;{productId}&quot;)</span> : ''} could not be found in the current educational catalog. It may have been relocated or is currently inactive.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
        <Link
          href="/books"
          className={buttonVariants({
            variant: 'primary',
            size: 'md',
            className: 'gap-2',
          })}
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Books Catalog</span>
        </Link>
        <Link
          href="/books"
          className={buttonVariants({
            variant: 'outline',
            size: 'md',
            className: 'gap-2',
          })}
        >
          <Search className="w-4 h-4" />
          <span>Search Other Books</span>
        </Link>
      </div>
    </div>
  );
};
