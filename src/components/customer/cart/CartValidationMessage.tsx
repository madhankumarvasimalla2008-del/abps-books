'use client';

import React from 'react';
import { AlertCircle, AlertTriangle, ArrowRight, RefreshCw, Trash2 } from 'lucide-react';
import { Cart } from '@/types';
import { Button } from '@/components/ui/Button';

export interface CartValidationMessageProps {
  cart: Cart;
  onRemoveItem: (productId: string) => void;
  onUpdateQuantity: (productId: string, quantity: number) => void;
}

export const CartValidationMessage: React.FC<CartValidationMessageProps> = ({
  cart,
  onRemoveItem,
  onUpdateQuantity,
}) => {
  const outOfStockItems = cart.items.filter(
    (item) => item.product?.status === 'out_of_stock'
  );

  const excessStockItems = cart.items.filter(
    (item) =>
      item.product?.status !== 'out_of_stock' &&
      item.product?.stockQuantity !== undefined &&
      item.product.stockQuantity > 0 &&
      item.quantity > item.product.stockQuantity
  );

  if (outOfStockItems.length === 0 && excessStockItems.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3" role="alert" aria-live="polite">
      {/* Out of Stock Warning */}
      {outOfStockItems.length > 0 && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs space-y-2.5">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-red-700 shrink-0 mt-0.5" />
            <div className="flex-1 space-y-1">
              <h3 className="font-bold text-red-900">
                Unavailable Titles Detected ({outOfStockItems.length})
              </h3>
              <p className="text-red-700 leading-relaxed">
                The following {outOfStockItems.length === 1 ? 'title is' : 'titles are'} currently out of stock and cannot be processed for checkout. Please remove {outOfStockItems.length === 1 ? 'it' : 'them'} to proceed.
              </p>
              <ul className="list-disc pl-4 space-y-1 text-red-800 font-medium pt-1">
                {outOfStockItems.map((item) => (
                  <li key={item.product.id} className="flex items-center justify-between gap-2">
                    <span className="truncate">{item.product.title}</span>
                    <button
                      type="button"
                      onClick={() => onRemoveItem(item.product.id)}
                      className="text-red-700 hover:text-red-900 underline font-semibold shrink-0 ml-2"
                      aria-label={`Remove ${item.product.title} from cart`}
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Excess Quantity Warning */}
      {excessStockItems.length > 0 && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs space-y-2.5">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div className="flex-1 space-y-1">
              <h3 className="font-bold text-amber-900">
                Stock Limit Exceeded ({excessStockItems.length})
              </h3>
              <p className="text-amber-700 leading-relaxed">
                Some selected quantities exceed our current on-hand warehouse inventory:
              </p>
              <ul className="list-disc pl-4 space-y-1.5 text-amber-800 font-medium pt-1">
                {excessStockItems.map((item) => (
                  <li key={item.product.id} className="flex items-center justify-between gap-2">
                    <span className="truncate">
                      {item.product.title} (Requested: {item.quantity}, Available: {item.product.stockQuantity})
                    </span>
                    <button
                      type="button"
                      onClick={() => onUpdateQuantity(item.product.id, item.product.stockQuantity)}
                      className="text-amber-900 hover:text-amber-950 underline font-bold shrink-0 ml-2"
                      aria-label={`Adjust ${item.product.title} quantity to ${item.product.stockQuantity}`}
                    >
                      Set to {item.product.stockQuantity}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
