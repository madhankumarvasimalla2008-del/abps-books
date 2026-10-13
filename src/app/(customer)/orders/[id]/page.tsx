'use client';

import React, { use, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Calendar,
  Building2,
  Truck,
  RotateCcw,
  CheckCircle2,
  HelpCircle,
} from 'lucide-react';
import { useOrders } from '@/context/OrderContext';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { OrderStatusBadge } from '@/components/customer/orders/OrderStatusBadge';
import { OrderItems } from '@/components/customer/orders/OrderItems';
import { OrderSummaryCard } from '@/components/customer/orders/OrderSummaryCard';
import { OrderCustomerInfo } from '@/components/customer/orders/OrderCustomerInfo';
import { OrderPaymentInfo } from '@/components/customer/orders/OrderPaymentInfo';
import { OrderStatusTimeline } from '@/components/customer/orders/OrderStatusTimeline';
import { OrderNotFound } from '@/components/customer/orders/OrderNotFound';
import { Button, buttonVariants } from '@/components/ui/Button';

export default function CustomerOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const resolvedParams = use(params);
  const { getOrder, reorder, isInitialized } = useOrders();
  const [reorderFeedback, setReorderFeedback] = useState<string | null>(null);

  const order = getOrder(resolvedParams.id);

  const handleReorder = () => {
    if (!order) return;
    const res = reorder(order.id);
    if (res.success) {
      setReorderFeedback(res.message);
      setTimeout(() => {
        router.push('/cart');
      }, 700);
    }
  };

  // If order is not found after initial hydration
  if (!order && isInitialized) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto pb-8">
        <Breadcrumbs
          items={[
            { label: 'Order History', href: '/orders' },
            { label: `Order ${resolvedParams.id}` },
          ]}
        />
        <OrderNotFound orderId={resolvedParams.id} />
      </div>
    );
  }

  // Fallback for SSR or during initial load before hydration
  const activeOrder = order;

  if (!activeOrder || !isInitialized) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto pb-8">
        <Breadcrumbs
          items={[
            { label: 'Order History', href: '/orders' },
            { label: 'Loading Order...' },
          ]}
        />
        <div className="p-12 text-center text-xs text-[#61717B] bg-white rounded-sm border border-[#DDDCD3] ">
          Loading Order Details...
        </div>
      </div>
    );
  }

  const poRef = activeOrder.poNumber || activeOrder.schoolPoNumber;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-8">
      {/* Breadcrumb Navigation */}
      <div>
        <Breadcrumbs
          items={[
            { label: 'Order History', href: '/orders' },
            { label: `Order ${activeOrder.id}` },
          ]}
        />
      </div>

      {/* Top Header Card */}
      <div className="bg-white p-5 sm:p-6 rounded-sm border border-[#DDDCD3]  flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="text-xs font-bold text-[#28657A] uppercase tracking-wider bg-[#EDF2F1] px-2 py-0.5 rounded-full">
              Order Details
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-[#142C43] font-mono tracking-tight">
              {activeOrder.orderNumber || activeOrder.id}
            </h1>
            <OrderStatusBadge status={activeOrder.status} type="order" />
            <OrderStatusBadge status={activeOrder.paymentStatus} type="payment" />
            {activeOrder.isDemo && (
              <span className="text-[10px] font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                Demo Session
              </span>
            )}
          </div>
          <p className="text-xs text-[#61717B] flex items-center gap-2 flex-wrap">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" /> Placed on {activeOrder.createdAt}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-slate-400" /> {activeOrder.branchName}
            </span>
            {poRef && (
              <>
                <span>•</span>
                <span className="font-mono text-[#526570]">
                  PO: {poRef}
                </span>
              </>
            )}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleReorder}
            leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
            className="text-xs font-semibold"
          >
            Buy Again
          </Button>

          <Link
            href={`/orders/${activeOrder.id}/track`}
            className={buttonVariants({
              variant: 'primary',
              size: 'sm',
              className: 'text-xs font-semibold  inline-flex items-center gap-1.5',
            })}
          >
            <Truck className="w-3.5 h-3.5" />
            <span>View Tracking</span>
          </Link>
        </div>
      </div>

      {/* Reorder Feedback Notification */}
      {reorderFeedback && (
        <div className="p-3 bg-[#EDF2F1] text-[#28657A] border border-[#DDDCD3] rounded-sm text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-[#4C8794]" />
          <span>{reorderFeedback} Redirecting to your cart...</span>
        </div>
      )}

      {/* 2-Column Responsive Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (8 cols): Itemized Titles and Tracking Timeline */}
        <div className="lg:col-span-8 space-y-6">
          <OrderItems items={activeOrder.items} />
          <OrderStatusTimeline order={activeOrder} showFullLink={true} />
        </div>

        {/* Right Column (4 cols): Financial Summary, Consignee Details, Payment State */}
        <div className="lg:col-span-4 space-y-6">
          <OrderSummaryCard order={activeOrder} />

          <OrderCustomerInfo order={activeOrder} />

          <OrderPaymentInfo
            order={activeOrder}
            onPaymentSuccess={() => {
              setReorderFeedback('Payment successful! Order is now confirmed.');
              setTimeout(() => setReorderFeedback(null), 4000);
            }}
          />

          {/* Help Note */}
          <div className="p-4 bg-[#FAF8F3] rounded-sm border border-[#DDDCD3] text-[11px] text-[#61717B] space-y-1">
            <span className="font-bold text-[#526570] block flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-slate-400" /> Need Help With This Order?
            </span>
            <p className="leading-relaxed">
              For inquiries regarding this order, please contact your school textbook coordinator quoting order reference{' '}
              <strong className="font-mono text-[#526570]">{activeOrder.orderNumber || activeOrder.id}</strong>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
