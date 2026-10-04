'use client';

import React from 'react';
import Link from 'next/link';
import { Trash2, Plus, Minus, BookOpen, ExternalLink, AlertCircle } from 'lucide-react';
import { CartItem as CartItemType } from '@/types';
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
      className={`bg-white rounded-2xl border p-4 sm:p-5 transition-all shadow-2xs ${
        isOutOfStock
          ? 'border-red-200 bg-red-50/20'
          : isExceedingStock
          ? 'border-amber-200 bg-amber-50/20'
          : 'border-slate-200/90 hover:border-slate-300'
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Left: Visual Book Cover & Meta Details */}
        <div className="flex items-start gap-4 flex-1 min-w-0">
          {/* Book cover visual block */}
          <Link
            href={`/books/${product.id}`}
            className="w-14 h-20 sm:w-16 sm:h-22 bg-gradient-to-b from-[#011C40] to-[#023859] text-white rounded-xl flex flex-col items-center justify-between p-2 shrink-0 text-center shadow-2xs group relative overflow-hidden focus:outline-none focus:ring-2 focus:ring-[#023859]"
            aria-label={`View details for ${product.title}`}
          >
            <div className="w-full flex justify-between items-center text-[9px] text-[#A7EBF2]">
              <span className="font-bold truncate">{product.subject.slice(0, 3).toUpperCase()}</span>
              <BookOpen className="w-3 h-3 text-[#A7EBF2] shrink-0" />
            </div>
            <span className="text-[10px] font-bold text-white leading-tight line-clamp-2 px-0.5">
              {product.title}
            </span>
            <span className="text-[8px] text-slate-300 font-mono">
              {product.grade.replace('Class ', 'C')}
            </span>
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
              className="font-bold text-sm sm:text-base text-slate-900 hover:text-[#023859] transition-colors block truncate group"
            >
              <span className="group-hover:underline">{product.title}</span>
            </Link>

            <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
              <span>Publisher: <strong className="text-slate-700 font-medium">{product.publisher}</strong></span>
              {product.isbn && (
                <span className="hidden md:inline font-mono text-slate-400 text-[11px]">
                  ISBN: {product.isbn}
                </span>
              )}
            </div>

            {isBulkApplied && (
              <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#023859] bg-[#EBF7FA] px-2 py-0.5 rounded-md border border-[#D4EBF0]">
                <span>{product.bulkDiscountPercent}% Bulk Discount Applied</span>
                <span className="text-slate-500 font-normal">({product.bulkThreshold}+ units)</span>
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
        <div className="flex items-center justify-between sm:justify-end gap-5 sm:gap-6 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100">
          {/* Stepper + Input */}
          <div className="flex flex-col items-start sm:items-center gap-1">
            <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50 overflow-hidden shadow-2xs">
              <button
                type="button"
                onClick={() => handleStep(-1)}
                disabled={isOutOfStock || quantity <= 1}
                className="px-2.5 py-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-200/70 disabled:opacity-30 disabled:hover:bg-transparent transition-colors focus:outline-none focus:ring-1 focus:ring-[#023859]"
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
                className="w-14 text-center text-xs font-bold text-slate-900 bg-white py-1.5 focus:outline-none focus:ring-1 focus:ring-[#023859] border-x border-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
                aria-label={`Quantity of ${product.title}`}
              />

              <button
                type="button"
                onClick={() => handleStep(1)}
                disabled={isOutOfStock || quantity >= maxStock}
                className="px-2.5 py-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-200/70 disabled:opacity-30 disabled:hover:bg-transparent transition-colors focus:outline-none focus:ring-1 focus:ring-[#023859]"
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
          <div className="text-right min-w-[90px]">
            <div className="text-base font-extrabold text-slate-900">
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
            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
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
