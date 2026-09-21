'use client';

import React from 'react';
import { ArrowRight, ShieldCheck, FileCheck2, Truck, CheckCircle2, Lock } from 'lucide-react';
import { Cart } from '@/types';
import { Button } from '@/components/ui/Button';

export interface CheckoutSummaryProps {
  cart: Cart;
  isSubmitting: boolean;
  hasErrors: boolean;
  onSubmit: () => void;
}

export const CheckoutSummary: React.FC<CheckoutSummaryProps> = ({
  cart,
  isSubmitting,
  hasErrors,
  onSubmit,
}) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs space-y-5 sticky top-24">
      <div className="border-b border-slate-100 pb-3">
        <h3 className="text-base font-bold text-slate-900">Order Summary</h3>
        <p className="text-xs text-slate-500">Order details &amp; total</p>
      </div>

      <div className="space-y-3 text-xs">
        <div className="flex justify-between text-slate-600">
          <span>Distinct Titles:</span>
          <span className="font-semibold text-slate-900">
            {cart.items.length} {cart.items.length === 1 ? 'Title' : 'Titles'}
          </span>
        </div>

        <div className="flex justify-between text-slate-600">
          <span>Total Items:</span>
          <span className="font-semibold text-slate-900">
            {cart.totalItems} {cart.totalItems === 1 ? 'Copy' : 'Copies'}
          </span>
        </div>

        <div className="flex justify-between text-slate-600">
          <span>Subtotal:</span>
          <span className="font-semibold text-slate-900">₹{cart.subtotal}</span>
        </div>

        {cart.discountTotal > 0 && (
          <div className="flex justify-between text-emerald-800 bg-emerald-50/80 p-2 rounded-lg border border-emerald-200/60 font-medium">
            <span>Bulk Discount:</span>
            <span className="font-bold">-₹{cart.discountTotal}</span>
          </div>
        )}

        <div className="flex justify-between text-slate-600">
          <span>Delivery:</span>
          <span className="font-medium text-slate-700">Details provided with order</span>
        </div>

        <div className="border-t border-slate-200 pt-3 flex justify-between items-baseline">
          <span className="text-sm font-bold text-slate-900">Order Total:</span>
          <span className="text-2xl font-extrabold text-slate-900 tracking-tight">
            ₹{cart.grandTotal}
          </span>
        </div>
      </div>

      {/* Submit Button with Idempotency / Double-Submit Protection */}
      <div className="space-y-2.5 pt-1">
        <Button
          type="button"
          onClick={onSubmit}
          disabled={isSubmitting || hasErrors || cart.items.length === 0}
          variant="primary"
          size="lg"
          className="w-full text-sm font-bold shadow-xs hover:shadow-sm"
          rightIcon={!isSubmitting ? <ArrowRight className="w-4 h-4" /> : undefined}
          isLoading={isSubmitting}
        >
          {isSubmitting ? 'Placing Your Order...' : 'Confirm & Place Order'}
        </Button>

        {hasErrors && (
          <p className="text-[11px] text-red-600 text-center font-medium">
            Please resolve out-of-stock items in your cart to place order.
          </p>
        )}
      </div>

      {/* Reassurance & Verification details */}
      <div className="space-y-2 pt-3 border-t border-slate-100 text-[11px] text-slate-500">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Curriculum-aligned editions</span>
        </div>
        <div className="flex items-center gap-2">
          <FileCheck2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Order summary available immediately</span>
        </div>
        <div className="flex items-center gap-2">
          <Truck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Standard order processing &amp; tracking</span>
        </div>
      </div>
    </div>
  );
};
