'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, ArrowLeft, ShieldCheck, Truck, FileText, CheckCircle2 } from 'lucide-react';
import { Cart } from '@/types';
import { Button, buttonVariants } from '@/components/ui/Button';

export interface CartSummaryProps {
  cart: Cart;
  hasErrors?: boolean;
}

export const CartSummary: React.FC<CartSummaryProps> = ({ cart, hasErrors = false }) => {
  const isCheckoutDisabled = cart.items.length === 0 || hasErrors;

  return (
    <div className="store-summary space-y-5">
      <div className="border-b border-[#DDDCD3]/60 pb-3">
        <h2 className="text-base font-bold text-[#142C43]">Order Summary</h2>
        <p className="text-xs text-[#61717B]">Your books at a glance</p>
      </div>

      <div className="space-y-3 text-xs">
        <div className="flex justify-between text-[#526570]">
          <span>Titles</span>
          <span className="font-semibold text-[#142C43]">
            {cart.items.length} {cart.items.length === 1 ? 'Title' : 'Titles'}
          </span>
        </div>

        <div className="flex justify-between text-[#526570]">
          <span>Copies</span>
          <span className="font-semibold text-[#142C43]">
            {cart.totalItems} {cart.totalItems === 1 ? 'Copy' : 'Copies'}
          </span>
        </div>

        <div className="flex justify-between text-[#526570]">
          <span>Subtotal</span>
          <span className="font-semibold text-[#142C43]">₹{cart.subtotal}</span>
        </div>

        {cart.discountTotal > 0 && (
          <div className="flex justify-between text-[#28657A] bg-[#EDF2F1] p-2 rounded-sm border border-[#DDDCD3] font-medium">
            <span>Bulk discount</span>
            <span className="font-bold">-₹{cart.discountTotal}</span>
          </div>
        )}

        <div className="border-t border-[#DDDCD3] pt-3 flex justify-between items-baseline">
          <span className="text-sm font-bold text-[#142C43]">Total</span>
          <span className="text-2xl font-extrabold text-[#142C43] tracking-tight">
            ₹{cart.grandTotal}
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-2.5 pt-1">
        {isCheckoutDisabled ? (
          <Button
            disabled
            variant="primary"
            size="lg"
            className="w-full text-sm font-semibold opacity-50 cursor-not-allowed"
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            {hasErrors ? 'Resolve Unavailable Items' : 'Proceed to Checkout'}
          </Button>
        ) : (
          <Link
            href="/checkout"
            className={buttonVariants({
              variant: 'primary',
              size: 'lg',
              className: 'w-full text-sm font-semibold  hover:shadow-sm gap-2',
            })}
          >
            <span>Proceed to Checkout</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        )}

        <Link
          href="/books"
          className={buttonVariants({
            variant: 'outline',
            size: 'md',
            className: 'w-full text-xs font-semibold gap-1.5',
          })}
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Continue Shopping</span>
        </Link>
      </div>

      {/* Trust & Policy Highlights */}
      <div className="space-y-2 pt-3 border-t border-[#DDDCD3]/60 text-[11px] text-[#61717B]">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#28657A] shrink-0" />
          <span>Review title, edition and quantity before checkout</span>
        </div>
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-[#28657A] shrink-0" />
          <span>Order summary &amp; confirmation generated on checkout</span>
        </div>
        <div className="flex items-center gap-2">
          <Truck className="w-4 h-4 text-[#28657A] shrink-0" />
          <span>Shipment tracking available after dispatch</span>
        </div>
      </div>
    </div>
  );
};
