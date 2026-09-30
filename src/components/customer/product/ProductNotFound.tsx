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
    <div className="bg-white rounded-2xl border border-slate-200/90 p-8 sm:p-14 text-center max-w-xl mx-auto my-8 shadow-2xs space-y-5">
      <div className="w-16 h-16 bg-slate-100 text-slate-500 rounded-2xl flex items-center justify-center mx-auto">
        <BookX className="w-8 h-8 text-slate-400" />
      </div>

      <div className="space-y-1.5">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
          Book Not Found
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
          The requested book {productId ? <span className="font-mono font-semibold text-slate-700">(&quot;{productId}&quot;)</span> : ''} could not be found in the current educational catalog. It may have been relocated or is currently inactive.
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
