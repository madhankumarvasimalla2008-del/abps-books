'use client';

import React from 'react';
import Link from 'next/link';
import { Trash2, Plus, Minus, AlertCircle } from 'lucide-react';
import { CartItem as CartItemType } from '@/types';
import { BookCover } from '@/components/customer/BookCover';
import { Badge } from '@/components/ui/Badge';

export interface CartItemProps {
  item: CartItemType;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
}

export const CartItem: React.FC<CartItemProps> = ({
  item,
  onUpdateQuantity,
  onRemoveItem,
}) => {
  const { product, quantity, appliedUnitPrice, totalPrice, isBulkApplied } = item;

  const isOutOfStock = product.status === 'out_of_stock';
  const isLowStock = product.status === 'low_stock';
  const maxStock = product.stockQuantity && product.stockQuantity > 0 ? product.stockQuantity : 9999;
  const isExceedingStock = product.stockQuantity !== undefined && product.stockQuantity > 0 && quantity > product.stockQuantity;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === '') {
      onUpdateQuantity(product.id, 1);
      return;
    }
    const parsed = parseInt(val, 10);
    if (isNaN(parsed)) return;
    const clamped = Math.max(1, Math.min(maxStock, parsed));
    onUpdateQuantity(product.id, clamped);
  };

  const handleStep = (delta: number) => {
    const nextVal = Math.max(1, Math.min(maxStock, quantity + delta));
    onUpdateQuantity(product.id, nextVal);
  };

  return (
    <div
      className={`bg-white rounded-sm border p-4 sm:p-5 transition-all  ${
        isOutOfStock
          ? 'border-red-200 bg-red-50/20'
          : isExceedingStock
          ? 'border-amber-200 bg-amber-50/20'
          : 'border-[#DDDCD3] hover:border-slate-300'
      }`}
    >
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        {/* Left: Visual Book Cover & Meta Details */}
        <div className="flex items-start gap-4 flex-1 min-w-0">
          {/* Book cover */}
          <Link href={`/books/${product.id}`} className="store-cart-cover" aria-label={`View ${product.title}`}>
            <BookCover product={product} size="sm" />
          </Link>
          {/* Book Metadata */}
          <div className="space-y-1.5 min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <Badge variant="default" size="sm">
                {product.grade}
              </Badge>
              <Badge variant="neutral" size="sm">
                {product.subject}
              </Badge>
              {isOutOfStock ? (
                <Badge variant="danger" size="sm">
                  Out of Stock
                </Badge>
              ) : isLowStock ? (
                <Badge variant="warning" size="sm">
                  Low Stock ({product.stockQuantity} left)
                </Badge>
              ) : (
                <Badge variant="success" size="sm">
                  In Stock
                </Badge>
              )}
            </div>

            <Link
              href={`/books/${product.id}`}
              className="font-serif font-medium text-lg sm:text-xl text-[#142C43] hover:text-[#28657A] transition-colors block group"
            >
              <span className="group-hover:underline">{product.title}</span>
            </Link>

            <div className="flex items-center gap-3 text-xs text-[#61717B] flex-wrap">
              <span>Publisher: <strong className="text-[#526570] font-medium">{product.publisher}</strong></span>
              {product.isbn && (
                <span className="hidden md:inline font-mono text-slate-400 text-[11px]">
                  ISBN: {product.isbn}
                </span>
              )}
            </div>

            {isBulkApplied && (
              <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#28657A] bg-[#EDF2F1] px-2 py-0.5 rounded-md border border-[#DDDCD3]">
                <span>{product.bulkDiscountPercent}% Bulk Discount Applied</span>
                <span className="text-[#61717B] font-normal">({product.bulkThreshold}+ units)</span>
              </div>
            )}

            {isExceedingStock && (
              <div className="flex items-center gap-1 text-[11px] font-medium text-amber-700">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>Requested quantity ({quantity}) exceeds available stock ({product.stockQuantity}).</span>
              </div>
            )}
          </div>
        </div>

        {/* Right: Quantity Controls, Pricing & Actions */}
        <div className="flex items-center justify-between xl:justify-end gap-2 sm:gap-4 pt-3 xl:pt-0 border-t xl:border-t-0 border-[#DDDCD3]/60">
          {/* Stepper + Input */}
          <div className="flex flex-col items-start sm:items-center gap-1">
            <div className="flex items-center border border-[#DDDCD3] rounded-sm bg-[#FAF8F3] overflow-hidden ">
              <button
                type="button"
                onClick={() => handleStep(-1)}
                disabled={isOutOfStock || quantity <= 1}
                className="px-2.5 py-1.5 text-[#61717B] hover:text-[#142C43] hover:bg-slate-200/70 disabled:opacity-30 disabled:hover:bg-transparent transition-colors focus:outline-none focus:ring-1 focus:ring-[#28657A]"
                aria-label={`Decrease quantity of ${product.title}`}
              >
                <Minus className="w-3.5 h-3.5" />
              </button>

              <input
                type="number"
                min={1}
                max={maxStock}
                disabled={isOutOfStock}
                value={quantity}
                onChange={handleInputChange}
                className="w-11 text-center text-xs font-bold text-[#142C43] bg-white py-1.5 focus:outline-none focus:ring-1 focus:ring-[#28657A] border-x border-[#DDDCD3] disabled:bg-[#F0EEE7] disabled:text-slate-400"
                aria-label={`Quantity of ${product.title}`}
              />

              <button
                type="button"
                onClick={() => handleStep(1)}
                disabled={isOutOfStock || quantity >= maxStock}
                className="px-2.5 py-1.5 text-[#61717B] hover:text-[#142C43] hover:bg-slate-200/70 disabled:opacity-30 disabled:hover:bg-transparent transition-colors focus:outline-none focus:ring-1 focus:ring-[#28657A]"
                aria-label={`Increase quantity of ${product.title}`}
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
            <span className="text-[10px] text-slate-400 font-medium">
              ₹{appliedUnitPrice}/unit
            </span>
          </div>

          {/* Line Total */}
          <div className="text-right min-w-[70px]">
            <div className="text-base font-extrabold text-[#142C43]">
              ₹{totalPrice}
            </div>
            {product.mrp * quantity > totalPrice && (
              <div className="text-[11px] text-slate-400 line-through">
                ₹{product.mrp * quantity}
              </div>
            )}
          </div>

          {/* Remove Button */}
          <button
            type="button"
            onClick={() => onRemoveItem(product.id)}
            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-sm transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
            aria-label={`Remove ${product.title} from cart`}
            title="Remove item"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
