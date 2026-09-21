'use client';

import React from 'react';
import Link from 'next/link';
import { AlertCircle, ShoppingBag, ArrowLeft, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export interface OrderNotFoundProps {
  orderId?: string;
}

export const OrderNotFound: React.FC<OrderNotFoundProps> = ({ orderId }) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-8 sm:p-12 text-center space-y-5 max-w-lg mx-auto shadow-2xs my-8">
      <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto ring-8 ring-red-50/50">
        <AlertCircle className="w-8 h-8" />
      </div>

      <div className="space-y-2">
        <span className="text-xs font-bold text-red-700 uppercase tracking-wider bg-red-50 px-2.5 py-1 rounded-full">
          Order Not Found
        </span>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
          We Couldn&apos;t Find This Order
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto">
          {orderId ? (
            <>
              No order record was found with reference number{' '}
              <strong className="font-mono text-slate-700">{orderId}</strong>.
            </>
          ) : (
            'The requested order reference could not be located in the current session.'
          )}
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
        <Link href="/orders" className="w-full sm:w-auto">
          <Button
            variant="primary"
            size="md"
            className="w-full"
            leftIcon={<ArrowLeft className="w-4 h-4" />}
          >
            Back to My Orders
          </Button>
        </Link>
        <Link href="/books" className="w-full sm:w-auto">
          <Button
            variant="outline"
            size="md"
            className="w-full"
            leftIcon={<ShoppingBag className="w-4 h-4" />}
          >
            Browse Books
          </Button>
        </Link>
      </div>
    </div>
  );
};
