'use client';

import React from 'react';
import Link from 'next/link';
import { ShoppingCart, BookOpen, ArrowLeft } from 'lucide-react';
import { buttonVariants } from '@/components/ui/Button';

export const CheckoutEmptyState: React.FC = () => {
  return (
    <div className="bg-white rounded-sm border border-[#DDDCD3] p-8 sm:p-12 text-center max-w-2xl mx-auto  space-y-6 my-6">
      <div className="w-16 h-16 bg-[#F0EEE7] text-slate-400 rounded-sm flex items-center justify-center mx-auto ring-8 ring-slate-50">
        <ShoppingCart className="w-8 h-8" aria-hidden="true" />
      </div>

      <div className="space-y-2">
        <h2 className="text-xl sm:text-2xl font-bold text-[#142C43]">
          Your Cart is Empty
        </h2>
        <p className="text-xs sm:text-sm text-[#61717B] max-w-md mx-auto leading-relaxed">
          You need curriculum textbooks or academic materials in your cart before initiating checkout.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
        <Link
          href="/books"
          className={buttonVariants({
            variant: 'primary',
            size: 'md',
            className: 'w-full sm:w-auto text-xs font-semibold  gap-2',
          })}
        >
          <BookOpen className="w-4 h-4" />
          <span>Browse Books Catalog</span>
        </Link>
        <Link
          href="/cart"
          className={buttonVariants({
            variant: 'outline',
            size: 'md',
            className: 'w-full sm:w-auto text-xs font-semibold gap-1.5',
          })}
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Go to Cart</span>
        </Link>
      </div>
    </div>
  );
};
