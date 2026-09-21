'use client';

import React from 'react';
import Link from 'next/link';
import { AlertCircle, ShoppingCart } from 'lucide-react';
import { Cart } from '@/types';
import { Button } from '@/components/ui/Button';

export interface CheckoutValidationProps {
  cart: Cart;
}

export const CheckoutValidation: React.FC<CheckoutValidationProps> = ({ cart }) => {
  const invalidItems = cart.items.filter(
    (item) =>
      item.product.status === 'out_of_stock' ||
      (item.product.stockQuantity !== undefined &&
        item.product.stockQuantity > 0 &&
        item.quantity > item.product.stockQuantity)
  );

  if (invalidItems.length === 0) return null;

  return (
    <div className="p-4 sm:p-5 bg-red-50/80 border border-red-200 rounded-2xl space-y-3">
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" aria-hidden="true" />
        <div className="space-y-1 flex-1 min-w-0">
          <h3 className="text-xs sm:text-sm font-bold text-red-900">
            Inventory Adjustments Required Before Checkout
          </h3>
          <p className="text-xs text-red-700 leading-relaxed">
            Some items in your cart are currently out of stock or exceed available stock. Please adjust them in your cart to proceed with checkout.
          </p>
        </div>
      </div>

      <div className="space-y-2 pl-8">
        {invalidItems.map((item) => {
          const isOut = item.product.status === 'out_of_stock';
          const maxStock = item.product.stockQuantity || 0;
          return (
            <div
              key={item.product.id}
              className="flex items-center justify-between gap-3 text-xs bg-white/80 p-2.5 rounded-xl border border-red-100"
            >
              <div className="truncate">
                <span className="font-semibold text-slate-900">{item.product.title}</span>
                <span className="text-slate-500 ml-1.5">({item.product.grade})</span>
              </div>
              <span className="font-medium text-red-600 text-[11px] shrink-0">
                {isOut
                  ? 'Out of stock'
                  : `Requested: ${item.quantity} (Available: ${maxStock})`}
              </span>
            </div>
          );
        })}
      </div>

      <div className="pl-8 pt-1">
        <Link href="/cart">
          <Button
            variant="secondary"
            size="sm"
            className="text-xs font-semibold bg-white hover:bg-slate-50 border-red-200 text-red-800"
            leftIcon={<ShoppingCart className="w-3.5 h-3.5" />}
          >
            Return to Cart to Modify Quantities
          </Button>
        </Link>
      </div>
    </div>
  );
};
