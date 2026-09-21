'use client';

import React from 'react';
import Link from 'next/link';
import { ShoppingCart, BookOpen, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export const CheckoutEmptyState: React.FC = () => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-8 sm:p-12 text-center max-w-2xl mx-auto shadow-2xs space-y-6 my-6">
      <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto ring-8 ring-slate-50">
        <ShoppingCart className="w-8 h-8" aria-hidden="true" />
      </div>

      <div className="space-y-2">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
          Your Cart is Empty
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
          You need curriculum textbooks or academic materials in your cart before initiating checkout.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
        <Link href="/books" className="w-full sm:w-auto">
          <Button
            variant="primary"
            size="md"
            className="w-full sm:w-auto text-xs font-semibold shadow-xs"
            leftIcon={<BookOpen className="w-4 h-4" />}
          >
            Browse Books Catalog
          </Button>
        </Link>
        <Link href="/cart" className="w-full sm:w-auto">
          <Button
            variant="outline"
            size="md"
            className="w-full sm:w-auto text-xs font-semibold"
            leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
          >
            Go to Cart
          </Button>
        </Link>
      </div>
    </div>
  );
};
