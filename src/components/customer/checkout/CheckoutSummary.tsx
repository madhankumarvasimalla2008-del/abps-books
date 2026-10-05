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
    <div className="store-summary space-y-5">
      <div className="border-b border-[#DDDCD3]/60 pb-3">
        <h3 className="text-base font-bold text-[#142C43]">Order Summary</h3>
        <p className="text-xs text-[#61717B]">Order details &amp; total</p>
      </div>

      <div className="space-y-3 text-xs">
        <div className="flex justify-between text-[#526570]">
          <span>Distinct Titles:</span>
          <span className="font-semibold text-[#142C43]">
            {cart.items.length} {cart.items.length === 1 ? 'Title' : 'Titles'}
          </span>
        </div>

        <div className="flex justify-between text-[#526570]">
          <span>Total Items:</span>
          <span className="font-semibold text-[#142C43]">
            {cart.totalItems} {cart.totalItems === 1 ? 'Copy' : 'Copies'}
          </span>
        </div>

        <div className="flex justify-between text-[#526570]">
          <span>Subtotal:</span>
          <span className="font-semibold text-[#142C43]">₹{cart.subtotal}</span>
        </div>

        {cart.discountTotal > 0 && (
          <div className="flex justify-between text-[#28657A] bg-[#EDF2F1] p-2 rounded-sm border border-[#DDDCD3] font-medium">
            <span>Bulk Discount:</span>
            <span className="font-bold">-₹{cart.discountTotal}</span>
          </div>
        )}

        <div className="flex justify-between text-[#526570]">
          <span>Delivery:</span>
          <span className="font-medium text-[#526570]">Details provided with order</span>
        </div>

        <div className="border-t border-[#DDDCD3] pt-3 flex justify-between items-baseline">
          <span className="text-sm font-bold text-[#142C43]">Order Total:</span>
          <span className="text-2xl font-extrabold text-[#142C43] tracking-tight">
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
          className="w-full text-sm font-bold  hover:shadow-sm"
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
      <div className="space-y-2 pt-3 border-t border-[#DDDCD3]/60 text-[11px] text-[#61717B]">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#28657A] shrink-0" />
          <span>Review title, edition and quantity before ordering</span>
        </div>
        <div className="flex items-center gap-2">
          <FileCheck2 className="w-4 h-4 text-[#28657A] shrink-0" />
          <span>Order summary available immediately</span>
        </div>
        <div className="flex items-center gap-2">
          <Truck className="w-4 h-4 text-[#28657A] shrink-0" />
          <span>Standard order processing &amp; tracking</span>
        </div>
      </div>
    </div>
  );
};
