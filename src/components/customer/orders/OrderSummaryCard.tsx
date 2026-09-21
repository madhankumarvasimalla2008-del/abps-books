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
    <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs space-y-4">
      <div className="border-b border-slate-100 pb-3">
        <h3 className="text-base font-bold text-slate-900">Order Pricing Summary</h3>
        <p className="text-xs text-slate-500">Itemized cost breakdown</p>
      </div>

      <div className="space-y-3 text-xs">
        <div className="flex justify-between text-slate-600">
          <span>Distinct Titles:</span>
          <span className="font-semibold text-slate-900">
            {distinctTitles} {distinctTitles === 1 ? 'Title' : 'Titles'}
          </span>
        </div>

        <div className="flex justify-between text-slate-600">
          <span>Total Copies:</span>
          <span className="font-semibold text-slate-900">
            {totalCopies} {totalCopies === 1 ? 'Copy' : 'Copies'}
          </span>
        </div>

        <div className="flex justify-between text-slate-600">
          <span>Subtotal:</span>
          <span className="font-semibold text-slate-900">
            ₹{order.subtotal.toLocaleString('en-IN')}
          </span>
        </div>

        {discountVal > 0 && (
          <div className="flex justify-between text-emerald-800 bg-emerald-50/80 p-2 rounded-lg border border-emerald-200/60 font-medium">
            <span>Bulk Discount:</span>
            <span className="font-bold">-₹{discountVal.toLocaleString('en-IN')}</span>
          </div>
        )}

        <div className="flex justify-between text-slate-600">
          <span>Delivery:</span>
          <span className="font-medium text-slate-700">Details provided with order</span>
        </div>

        <div className="border-t border-slate-200 pt-3 flex justify-between items-baseline">
          <span className="text-sm font-bold text-slate-900">Order Total:</span>
          <span className="text-2xl font-extrabold text-slate-900 tracking-tight">
            ₹{order.totalAmount.toLocaleString('en-IN')}
          </span>
        </div>
      </div>

      {/* Trust & Guarantee badges */}
      <div className="space-y-2 pt-3 border-t border-slate-100 text-[11px] text-slate-500">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Curriculum-aligned editions</span>
        </div>
        <div className="flex items-center gap-2">
          <FileCheck2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Order record verified</span>
        </div>
        <div className="flex items-center gap-2">
          <Truck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Standard order processing</span>
        </div>
      </div>
    </div>
  );
};
