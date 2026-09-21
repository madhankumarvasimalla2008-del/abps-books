'use client';

import React, { useState } from 'react';
import { Trash2, Building2, PackageCheck } from 'lucide-react';
import { Cart } from '@/types';
import { CartItem } from './CartItem';
import { Button } from '@/components/ui/Button';

export interface CartItemListProps {
  cart: Cart;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
  branchName?: string;
}

export const CartItemList: React.FC<CartItemListProps> = ({
  cart,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  branchName,
}) => {
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  return (
    <div className="space-y-4">
      {/* Header with Title Count & Clear Cart Action */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
        <div className="flex items-baseline gap-2">
          <h2 className="text-sm sm:text-base font-bold text-slate-900">
            Selected Books &amp; Materials
          </h2>
          <span className="text-xs text-slate-500 font-medium">
            ({cart.items.length} {cart.items.length === 1 ? 'title' : 'distinct titles'}, {cart.totalItems} total {cart.totalItems === 1 ? 'copy' : 'copies'})
          </span>
        </div>

        <div>
          {showClearConfirm ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-600 font-medium">Clear all?</span>
              <button
                type="button"
                onClick={() => {
                  onClearCart();
                  setShowClearConfirm(false);
                }}
                className="text-xs px-2.5 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold transition-colors"
                aria-label="Confirm clear entire cart"
              >
                Yes, Clear
              </button>
              <button
                type="button"
                onClick={() => setShowClearConfirm(false)}
                className="text-xs px-2 py-1 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowClearConfirm(true)}
              className="text-xs text-slate-500 hover:text-red-600 font-medium flex items-center gap-1.5 transition-colors p-1 rounded focus:outline-none focus:ring-1 focus:ring-red-500"
              aria-label="Clear all items in cart"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Cart</span>
            </button>
          )}
        </div>
      </div>

      {/* Cart Item Rows */}
      <div className="space-y-3" role="list" aria-label="Cart items list">
        {cart.items.map((item) => (
          <div key={item.product.id} role="listitem">
            <CartItem
              item={item}
              onUpdateQuantity={onUpdateQuantity}
              onRemoveItem={onRemoveItem}
            />
          </div>
        ))}
      </div>

      {/* Distribution Packaging Note */}
      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/90 flex items-start sm:items-center gap-3 text-xs text-slate-700">
        <PackageCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5 sm:mt-0" />
        <div className="leading-relaxed">
          <span className="font-bold text-slate-900">Packaging Note:</span>{' '}
          Books and learning materials are securely packaged and labeled by grade level and subject for easy distribution upon delivery.
        </div>
      </div>
    </div>
  );
};
