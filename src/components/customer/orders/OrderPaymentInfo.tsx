'use client';

import React, { useState } from 'react';
import { CreditCard, ShieldCheck, RefreshCw, AlertCircle, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { Order, PaymentAttempt } from '@/types';
import { OrderStatusBadge } from './OrderStatusBadge';
import { Button } from '@/components/ui/Button';
import { PaymentProcessingModal } from '@/components/customer/checkout/PaymentProcessingModal';

export interface OrderPaymentInfoProps {
  order: Order;
  onPaymentSuccess?: (updatedOrder: Order) => void;
}

export const OrderPaymentInfo: React.FC<OrderPaymentInfoProps> = ({ order, onPaymentSuccess }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const poRef = order.poNumber || order.schoolPoNumber;
  const attempts: PaymentAttempt[] = order.paymentAttempts || [];
  const canRetry = order.paymentStatus !== 'Paid' && order.paymentStatus !== 'Refunded';

  return (
    <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
          <CreditCard className="w-3.5 h-3.5 text-emerald-800" />
          <span>Payment Information</span>
        </h3>
        <OrderStatusBadge status={order.paymentStatus} type="payment" />
      </div>

      <div className="space-y-3 text-xs">
        <div className="flex items-center justify-between">
          <span className="text-slate-500">Payment Mode:</span>
          <span className="font-semibold text-slate-800">
            {order.paymentMethod || 'Online / UPI (Demo)'}
            {order.upiSubMethod ? ` (${order.upiSubMethod.toUpperCase()})` : ''}
          </span>
        </div>

        {order.paymentReference && (
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Transaction Ref:</span>
            <span className="font-mono font-semibold text-slate-800 text-[11px]">
              {order.paymentReference}
            </span>
          </div>
        )}

        {poRef && (
          <div className="flex items-center justify-between">
            <span className="text-slate-500">PO Reference:</span>
            <span className="font-mono font-semibold text-slate-800 text-[11px]">
              {poRef}
            </span>
          </div>
        )}

        {/* Retry Payment Callout if not Paid */}
        {canRetry && (
          <div className="pt-2 border-t border-slate-100">
            <div className="p-3 bg-amber-50 border border-amber-200/70 rounded-xl space-y-2">
              <div className="flex items-start gap-2 text-[11px] text-amber-900">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  This order has not been completed. You can retry settlement using the simulated gateway.
                </span>
              </div>
              <Button
                type="button"
                variant="primary"
                size="sm"
                className="w-full text-xs font-bold"
                onClick={() => setIsModalOpen(true)}
                leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
              >
                Retry Payment (₹{order.totalAmount})
              </Button>
            </div>
          </div>
        )}

        {/* Payment Attempt Audit History */}
        {attempts.length > 0 && (
          <div className="pt-2 border-t border-slate-100 space-y-2">
            <span className="text-[11px] font-bold text-slate-700 block">
              Payment Attempt Log ({attempts.length})
            </span>
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {attempts.map((att) => (
                <div
                  key={att.id}
                  className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/70 text-[11px] space-y-1"
                >
                  <div className="flex items-center justify-between font-semibold">
                    <span className="text-slate-800">
                      Attempt #{att.attemptNumber} ({att.paymentMethod})
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 font-bold ${
                        att.status === 'Paid'
                          ? 'text-emerald-700'
                          : att.status === 'Failed'
                          ? 'text-rose-600'
                          : 'text-amber-600'
                      }`}
                    >
                      {att.status === 'Paid' && <CheckCircle2 className="w-3 h-3" />}
                      {att.status === 'Failed' && <XCircle className="w-3 h-3" />}
                      {att.status === 'Cancelled' && <AlertCircle className="w-3 h-3" />}
                      {att.status === 'Processing' && <Clock className="w-3 h-3" />}
                      {att.status}
                    </span>
                  </div>
                  {att.referenceNumber && (
                    <div className="text-slate-500 font-mono text-[10px]">
                      Ref: {att.referenceNumber}
                    </div>
                  )}
                  {att.failureReason && (
                    <div className="text-rose-600 text-[10px]">
                      Reason: {att.failureReason}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 text-[11px] text-slate-600 flex items-start gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
          <span>
            <strong>Simulation Note:</strong> Payments are processed via simulated state transitions. Real banking credentials or card data are never requested or stored.
          </span>
        </div>
      </div>

      {/* Payment Processing Modal for Retry */}
      <PaymentProcessingModal
        isOpen={isModalOpen}
        order={order}
        paymentMethod={order.paymentMethod || 'UPI'}
        upiSubMethod={order.upiSubMethod || 'intent'}
        upiApp={order.upiApp || 'phonepe'}
        onSuccess={(updated) => {
          setIsModalOpen(false);
          onPaymentSuccess?.(updated);
        }}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
};
