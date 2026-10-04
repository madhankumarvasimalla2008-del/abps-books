'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  CheckCircle2,
  PackageCheck,
  Building2,
  FileText,
  Truck,
  ArrowRight,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/Button';
import { useOrders } from '@/context/OrderContext';
import { OrderItems } from '@/components/customer/orders/OrderItems';
import { OrderSummaryCard } from '@/components/customer/orders/OrderSummaryCard';
import { OrderCustomerInfo } from '@/components/customer/orders/OrderCustomerInfo';

function ConfirmationContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  const queryBranch = searchParams.get('branch');
  const { getOrder } = useOrders();

  // Retrieve actual order snapshot if orderId is provided
  const order = orderId ? getOrder(orderId) : undefined;

  // Fallback / default data if opened directly without an orderId
  const displayId = order?.id || orderId || 'ORD-894102';
  const displayBranch = order?.branchName || queryBranch || 'Aditya Birla Public School, Kharach';
  const displayDate = order?.createdAt || new Date().toISOString().split('T')[0];

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-4 sm:py-6">
      {/* Top success card */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/90 shadow-2xs text-center space-y-4">
        <div className="w-16 h-16 bg-[#EBF7FA] text-[#023859] rounded-2xl flex items-center justify-center mx-auto ring-8 ring-[#EBF7FA]/60">
          <CheckCircle2 className="w-9 h-9" />
        </div>

        <div className="space-y-1.5">
          <span className="text-xs font-bold text-[#023859] uppercase tracking-wider bg-[#EBF7FA] px-2.5 py-1 rounded-full">
            Order Confirmed
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 pt-1">
            Order Confirmed
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-lg mx-auto">
            Your order has been recorded in this demo session.
          </p>
        </div>

        {/* Order Details Quick Reference */}
        <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200/80 max-w-lg mx-auto grid grid-cols-1 sm:grid-cols-3 gap-3 text-left text-xs">
          <div>
            <span className="text-slate-400 block text-[11px]">Order Reference</span>
            <span className="font-mono font-bold text-slate-900 text-xs sm:text-sm">{displayId}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Order Date</span>
            <span className="font-semibold text-slate-800 text-xs flex items-center gap-1 mt-0.5">
              <Calendar className="w-3 h-3 text-slate-400" /> {displayDate}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">School Branch</span>
            <span className="font-bold text-slate-900 truncate block text-xs mt-0.5">{displayBranch}</span>
          </div>
        </div>

        {/* Prototype demo banner */}
        <div className="max-w-lg mx-auto p-2.5 bg-amber-50 text-amber-800 rounded-xl border border-amber-200/80 text-[11px] text-left flex items-start gap-2">
          <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
          <span>
            <strong>Demo Mode:</strong> This order has been recorded in your local browser session for testing.
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Link
            href={`/orders/${displayId}/track`}
            className={buttonVariants({
              variant: 'primary',
              size: 'md',
              className: 'inline-flex items-center gap-2',
            })}
          >
            <span>View Tracking</span>
            <Truck className="w-4 h-4" />
          </Link>
          <Link
            href={`/orders/${displayId}`}
            className={buttonVariants({
              variant: 'outline',
              size: 'md',
              className: 'inline-flex items-center gap-2',
            })}
          >
            <span>View Order Details</span>
            <FileText className="w-4 h-4" />
          </Link>
          <Link
            href="/orders"
            className={buttonVariants({
              variant: 'secondary',
              size: 'md',
            })}
          >
            Order History
          </Link>
        </div>
      </div>

      {/* Snapshot items preview if order exists */}
      {order && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <OrderItems items={order.items} />
          </div>
          <div className="space-y-6">
            <OrderSummaryCard order={order} />
            <OrderCustomerInfo order={order} />
          </div>
        </div>
      )}

      {/* Order Status Information */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4 text-xs">
        <h2 className="font-bold text-slate-900 text-sm flex items-center gap-2">
          <PackageCheck className="w-4 h-4 text-[#023859]" />
          <span>Order Fulfillment Overview</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-slate-600">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-150 space-y-1">
            <span className="font-bold text-slate-900 block">1. Order Logged</span>
            <p className="text-[11px] leading-relaxed text-slate-500">
              Your order items and branch details are registered.
            </p>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-150 space-y-1">
            <span className="font-bold text-slate-900 block">2. Processing</span>
            <p className="text-[11px] leading-relaxed text-slate-500">
              Items are verified and prepared for shipment.
            </p>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-150 space-y-1">
            <span className="font-bold text-slate-900 block">3. Delivery</span>
            <p className="text-[11px] leading-relaxed text-slate-500">
              Dispatched to your designated school branch location.
            </p>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-slate-500">
            <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
            <span>Questions regarding this order? Contact the school textbook coordinator.</span>
          </div>
          <Link
            href="/books"
            className={buttonVariants({
              variant: 'ghost',
              size: 'sm',
              className: 'inline-flex items-center gap-1.5',
            })}
          >
            <span>Browse More Books</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function OrderConfirmationPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-xs text-slate-500">
          Loading Order Confirmation...
        </div>
      }
    >
      <ConfirmationContent />
    </Suspense>
  );
}
