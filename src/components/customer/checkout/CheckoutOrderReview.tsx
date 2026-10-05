'use client';

import React from 'react';
import Link from 'next/link';
import { BookOpen, Edit3, CheckCircle2 } from 'lucide-react';
import { Cart } from '@/types';
import { BookCover } from '@/components/customer/BookCover';
import { Badge } from '@/components/ui/Badge';
import { buttonVariants } from '@/components/ui/Button';

export interface CheckoutOrderReviewProps {
  cart: Cart;
}

export const CheckoutOrderReview: React.FC<CheckoutOrderReviewProps> = ({ cart }) => {
  return (
    <div className="store-form-section space-y-4">
      <div className="flex items-center justify-between border-b border-[#DDDCD3]/60 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-sm bg-[#EDF2F1] text-[#28657A] flex items-center justify-center font-bold text-xs">
            3
          </div>
          <h2 className="text-sm sm:text-base font-bold text-[#142C43]">
            Order Review ({cart.items.length} {cart.items.length === 1 ? 'Title' : 'Titles'})
          </h2>
        </div>
        <Link
          href="/cart"
          className={buttonVariants({
            variant: 'ghost',
            size: 'sm',
            className: 'text-xs text-[#28657A] hover:text-[#4C8794] font-semibold gap-1.5',
          })}
        >
          <Edit3 className="w-3.5 h-3.5" />
          <span>Edit Cart</span>
        </Link>
      </div>

      <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto pr-1">
        {cart.items.map((item) => {
          const { product, quantity, appliedUnitPrice, totalPrice, isBulkApplied } = item;
          return (
            <div
              key={product.id}
              className="py-3.5 first:pt-0 last:pb-0 flex items-start sm:items-center justify-between gap-3 text-xs"
            >
              {/* Visual Thumbnail + Meta */}
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <Link href={`/books/${product.id}`} className="store-review-cover" aria-label={`View ${product.title}`}><BookCover product={product} size="sm" /></Link>

                <div className="min-w-0 flex-1 space-y-1">
                  <h4 className="font-serif text-base text-[#142C43]">{product.title}</h4>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Badge variant="default" size="sm" className="text-[10px] py-0 px-1.5">
                      {product.grade}
                    </Badge>
                    <Badge variant="neutral" size="sm" className="text-[10px] py-0 px-1.5">
                      {product.subject}
                    </Badge>
                    {isBulkApplied && (
                      <span className="text-[10px] text-[#28657A] bg-[#EDF2F1] font-medium px-1.5 py-0.2 rounded border border-[#DDDCD3]">
                        {product.bulkDiscountPercent}% Bulk Rebate
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-[#61717B]">
                    Publisher: <strong className="font-medium text-[#526570]">{product.publisher}</strong> • Unit Price: ₹{appliedUnitPrice}
                  </p>
                </div>
              </div>

              {/* Quantity & Line Total */}
              <div className="text-right shrink-0">
                <div className="text-xs text-[#61717B]">
                  Qty: <span className="font-bold text-[#142C43]">{quantity}</span>
                </div>
                <div className="text-sm font-extrabold text-[#142C43] mt-0.5">
                  ₹{totalPrice}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
