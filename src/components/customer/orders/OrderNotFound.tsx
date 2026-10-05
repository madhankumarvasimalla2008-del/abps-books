'use client';

import React from 'react';
import Link from 'next/link';
import { AlertCircle, ShoppingBag, ArrowLeft, RotateCcw } from 'lucide-react';
import { buttonVariants } from '@/components/ui/Button';

export interface OrderNotFoundProps {
  orderId?: string;
}

export const OrderNotFound: React.FC<OrderNotFoundProps> = ({ orderId }) => {
  return (
    <div className="bg-white rounded-sm border border-[#DDDCD3] p-8 sm:p-12 text-center space-y-5 max-w-lg mx-auto  my-8">
      <div className="w-16 h-16 bg-red-50 text-red-600 rounded-sm flex items-center justify-center mx-auto ring-8 ring-red-50/50">
        <AlertCircle className="w-8 h-8" />
      </div>

      <div className="space-y-2">
        <span className="text-xs font-bold text-red-700 uppercase tracking-wider bg-red-50 px-2.5 py-1 rounded-full">
          Order Not Found
        </span>
        <h1 className="text-xl sm:text-2xl font-bold text-[#142C43]">
          We Couldn&apos;t Find This Order
        </h1>
        <p className="text-xs sm:text-sm text-[#61717B] max-w-sm mx-auto">
          {orderId ? (
            <>
              No order record was found with reference number{' '}
              <strong className="font-mono text-[#526570]">{orderId}</strong>.
            </>
          ) : (
            'The requested order reference could not be located in the current session.'
          )}
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
        <Link
          href="/orders"
          className={buttonVariants({
            variant: 'primary',
            size: 'md',
            className: 'w-full sm:w-auto gap-2',
          })}
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to My Orders</span>
        </Link>
        <Link
          href="/books"
          className={buttonVariants({
            variant: 'outline',
            size: 'md',
            className: 'w-full sm:w-auto gap-2',
          })}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Browse Books</span>
        </Link>
      </div>
    </div>
  );
};
