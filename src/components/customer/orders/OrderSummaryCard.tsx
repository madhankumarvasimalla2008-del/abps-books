'use client';

import React from 'react';
import { Order } from '@/types';
import { ShieldCheck, FileCheck2, Truck } from 'lucide-react';

export interface OrderSummaryCardProps {
  order: Order;
}

export const OrderSummaryCard: React.FC<OrderSummaryCardProps> = ({ order }) => {
  const distinctTitles = order.items.length;
  const totalCopies = order.totalQuantity || order.items.reduce((s, i) => s + i.quantity, 0);
  const discountVal = order.discountAmount || order.discount || 0;

  return (
    <div className="bg-white rounded-sm border border-[#DDDCD3] p-5 sm:p-6  space-y-4">
      <div className="border-b border-[#DDDCD3]/60 pb-3">
        <h3 className="text-base font-bold text-[#142C43]">Order Pricing Summary</h3>
        <p className="text-xs text-[#61717B]">Itemized cost breakdown</p>
      </div>

      <div className="space-y-3 text-xs">
        <div className="flex justify-between text-[#526570]">
          <span>Distinct Titles:</span>
          <span className="font-semibold text-[#142C43]">
            {distinctTitles} {distinctTitles === 1 ? 'Title' : 'Titles'}
          </span>
        </div>

        <div className="flex justify-between text-[#526570]">
          <span>Total Copies:</span>
          <span className="font-semibold text-[#142C43]">
            {totalCopies} {totalCopies === 1 ? 'Copy' : 'Copies'}
          </span>
        </div>

        <div className="flex justify-between text-[#526570]">
          <span>Subtotal:</span>
          <span className="font-semibold text-[#142C43]">
            ₹{order.subtotal.toLocaleString('en-IN')}
          </span>
        </div>

        {discountVal > 0 && (
          <div className="flex justify-between text-[#28657A] bg-[#EDF2F1] p-2 rounded-sm border border-[#DDDCD3] font-medium">
            <span>Bulk Discount:</span>
            <span className="font-bold">-₹{discountVal.toLocaleString('en-IN')}</span>
          </div>
        )}

        <div className="flex justify-between text-[#526570]">
          <span>Delivery:</span>
          <span className="font-medium text-[#526570]">Details provided with order</span>
        </div>

        <div className="border-t border-[#DDDCD3] pt-3 flex justify-between items-baseline">
          <span className="text-sm font-bold text-[#142C43]">Order Total:</span>
          <span className="text-2xl font-extrabold text-[#142C43] tracking-tight">
            ₹{order.totalAmount.toLocaleString('en-IN')}
          </span>
        </div>
      </div>

      {/* Trust & Guarantee badges */}
      <div className="space-y-2 pt-3 border-t border-[#DDDCD3]/60 text-[11px] text-[#61717B]">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#28657A] shrink-0" />
          <span>Curriculum-aligned editions</span>
        </div>
        <div className="flex items-center gap-2">
          <FileCheck2 className="w-4 h-4 text-[#28657A] shrink-0" />
          <span>Order record verified</span>
        </div>
        <div className="flex items-center gap-2">
          <Truck className="w-4 h-4 text-[#28657A] shrink-0" />
          <span>Standard order processing</span>
        </div>
      </div>
    </div>
  );
};
