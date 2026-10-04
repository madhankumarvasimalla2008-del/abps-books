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
    <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs space-y-5 sticky top-24">
      <div className="border-b border-slate-100 pb-3">
        <h2 className="text-base font-bold text-slate-900">Order Summary</h2>
        <p className="text-xs text-slate-500">Summary of selected curriculum materials</p>
      </div>

      <div className="space-y-3 text-xs">
        <div className="flex justify-between text-slate-600">
          <span>Distinct Titles:</span>
          <span className="font-semibold text-slate-900">
            {cart.items.length} {cart.items.length === 1 ? 'Title' : 'Titles'}
          </span>
        </div>

        <div className="flex justify-between text-slate-600">
          <span>Total Quantities:</span>
          <span className="font-semibold text-slate-900">
            {cart.totalItems} {cart.totalItems === 1 ? 'Copy' : 'Copies'}
          </span>
        </div>

        <div className="flex justify-between text-slate-600">
          <span>Catalogue Subtotal:</span>
          <span className="font-semibold text-slate-900">₹{cart.subtotal}</span>
        </div>

        {cart.discountTotal > 0 && (
          <div className="flex justify-between text-[#023859] bg-[#EBF7FA] p-2 rounded-lg border border-[#D4EBF0] font-medium">
            <span>Bulk Volume Rebate:</span>
            <span className="font-bold">-₹{cart.discountTotal}</span>
          </div>
        )}

        <div className="border-t border-slate-200 pt-3 flex justify-between items-baseline">
          <span className="text-sm font-bold text-slate-900">Total Payable:</span>
          <span className="text-2xl font-extrabold text-slate-900 tracking-tight">
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
              className: 'w-full text-sm font-semibold shadow-xs hover:shadow-sm gap-2',
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
      <div className="space-y-2 pt-3 border-t border-slate-100 text-[11px] text-slate-500">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#023859] shrink-0" />
          <span>Curriculum prescribed editions</span>
        </div>
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-[#023859] shrink-0" />
          <span>Order summary &amp; confirmation generated on checkout</span>
        </div>
        <div className="flex items-center gap-2">
          <Truck className="w-4 h-4 text-[#023859] shrink-0" />
          <span>Shipment tracking available after dispatch</span>
        </div>
      </div>
    </div>
  );
};
