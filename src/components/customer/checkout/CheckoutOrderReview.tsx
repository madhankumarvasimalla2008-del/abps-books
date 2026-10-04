'use client';

import React from 'react';
import Link from 'next/link';
import { BookOpen, Edit3, CheckCircle2 } from 'lucide-react';
import { Cart } from '@/types';
import { Badge } from '@/components/ui/Badge';
import { buttonVariants } from '@/components/ui/Button';

export interface CheckoutOrderReviewProps {
  cart: Cart;
}

export const CheckoutOrderReview: React.FC<CheckoutOrderReviewProps> = ({ cart }) => {
  return (
    <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#EBF7FA] text-[#023859] flex items-center justify-center font-bold text-xs">
            3
          </div>
          <h2 className="text-sm sm:text-base font-bold text-slate-900">
            Order Review ({cart.items.length} {cart.items.length === 1 ? 'Title' : 'Titles'})
          </h2>
        </div>
        <Link
          href="/cart"
          className={buttonVariants({
            variant: 'ghost',
            size: 'sm',
            className: 'text-xs text-[#023859] hover:text-[#54ACBF] font-semibold gap-1.5',
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
                <div className="w-10 h-14 bg-gradient-to-b from-[#011C40] to-[#023859] text-white rounded-lg flex flex-col items-center justify-between p-1.5 shrink-0 text-center shadow-2xs">
                  <span className="text-[8px] font-bold text-[#A7EBF2] truncate w-full">
                    {product.subject.slice(0, 3).toUpperCase()}
                  </span>
                  <BookOpen className="w-3 h-3 text-[#A7EBF2]/60" />
                  <span className="text-[7px] text-[#A7EBF2]/70 font-mono">
                    {product.grade.replace('Class ', 'C')}
                  </span>
                </div>

                <div className="min-w-0 flex-1 space-y-1">
                  <h4 className="font-bold text-[#011C40] truncate">{product.title}</h4>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Badge variant="default" size="sm" className="text-[10px] py-0 px-1.5">
                      {product.grade}
                    </Badge>
                    <Badge variant="neutral" size="sm" className="text-[10px] py-0 px-1.5">
                      {product.subject}
                    </Badge>
                    {isBulkApplied && (
                      <span className="text-[10px] text-[#023859] bg-[#EBF7FA] font-medium px-1.5 py-0.2 rounded border border-[#D4EBF0]">
                        {product.bulkDiscountPercent}% Bulk Rebate
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-[#537D99]">
                    Publisher: <strong className="font-medium text-[#26658C]">{product.publisher}</strong> • Unit Price: ₹{appliedUnitPrice}
                  </p>
                </div>
              </div>

              {/* Quantity & Line Total */}
              <div className="text-right shrink-0">
                <div className="text-xs text-[#537D99]">
                  Qty: <span className="font-bold text-[#011C40]">{quantity}</span>
                </div>
                <div className="text-sm font-extrabold text-[#011C40] mt-0.5">
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
