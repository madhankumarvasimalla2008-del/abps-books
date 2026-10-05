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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#DDDCD3]">
        <div className="flex flex-wrap items-baseline gap-2">
          <h2 className="text-sm sm:text-base font-bold text-[#142C43]">
            Your selection
          </h2>
          <span className="text-xs text-[#61717B] font-medium">
            ({cart.items.length} {cart.items.length === 1 ? 'title' : 'distinct titles'}, {cart.totalItems} total {cart.totalItems === 1 ? 'copy' : 'copies'})
          </span>
        </div>

        <div>
          {showClearConfirm ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#526570] font-medium">Clear all?</span>
              <button
                type="button"
                onClick={() => {
                  onClearCart();
                  setShowClearConfirm(false);
                }}
                className="text-xs px-2.5 py-1 bg-red-600 text-white rounded-sm hover:bg-red-700 font-semibold transition-colors"
                aria-label="Confirm clear entire cart"
              >
                Yes, Clear
              </button>
              <button
                type="button"
                onClick={() => setShowClearConfirm(false)}
                className="text-xs px-2 py-1 bg-[#F0EEE7] text-[#526570] rounded-sm hover:bg-slate-200 font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowClearConfirm(true)}
              className="text-xs text-[#61717B] hover:text-red-600 font-medium flex items-center gap-1.5 transition-colors p-1 rounded focus:outline-none focus:ring-1 focus:ring-red-500"
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
      <div className="p-4 bg-[#FAF8F3] rounded-sm border border-[#DDDCD3] flex items-start sm:items-center gap-3 text-xs text-[#526570]">
        <PackageCheck className="w-4 h-4 text-[#28657A] shrink-0 mt-0.5 sm:mt-0" />
        <div className="leading-relaxed">
          <span className="font-bold text-[#142C43]">Before you checkout:</span>{' '}
          Check the title, class and edition of each book, then choose the quantities you need.
        </div>
      </div>
    </div>
  );
};
