'use client';

import React, { use } from 'react';
import Link from 'next/link';
import {
  Truck,
  ArrowLeft,
  FileText,
  Calendar,
  Building2,
  HelpCircle,
} from 'lucide-react';
import { useOrders } from '@/context/OrderContext';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { OrderStatusBadge } from '@/components/customer/orders/OrderStatusBadge';
import { TrackingStatusCard } from '@/components/customer/tracking/TrackingStatusCard';
import { TrackingTimeline } from '@/components/customer/tracking/TrackingTimeline';
import { TrackingDeliveryInfo } from '@/components/customer/tracking/TrackingDeliveryInfo';
import { TrackingNotFound } from '@/components/customer/tracking/TrackingNotFound';
import { buttonVariants } from '@/components/ui/Button';

export default function OrderTrackingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const { getOrder, isInitialized } = useOrders();

  const order = getOrder(resolvedParams.id);

  // If order is not found after context initialization
  if (!order && isInitialized) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto pb-8">
        <Breadcrumbs
          items={[
            { label: 'Order History', href: '/orders' },
            { label: `Order ${resolvedParams.id}`, href: `/orders/${resolvedParams.id}` },
            { label: 'Tracking' },
          ]}
        />
        <TrackingNotFound referenceQuery={resolvedParams.id} />
      </div>
    );
  }

  // Initial loading state before hydration
  if (!order || !isInitialized) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto pb-8">
        <Breadcrumbs
          items={[
            { label: 'Order History', href: '/orders' },
            { label: 'Loading Order Tracking...' },
          ]}
        />
        <div className="p-12 text-center text-xs text-[#61717B] bg-white rounded-sm border border-[#DDDCD3] ">
          Loading Order Tracking...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-8">
      {/* Breadcrumb Navigation */}
      <Breadcrumbs
        items={[
          { label: 'Order History', href: '/orders' },
          { label: `Order ${order.id}`, href: `/orders/${order.id}` },
          { label: 'Order Tracking' },
        ]}
      />

      {/* Main Header Card */}
      <div className="bg-white p-5 sm:p-6 rounded-sm border border-[#DDDCD3]  flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="text-xs font-bold text-[#28657A] uppercase tracking-wider bg-[#EDF2F1] px-2 py-0.5 rounded-full">
              Order Tracking
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-[#142C43] font-mono tracking-tight">
              {order.id}
            </h1>
            <OrderStatusBadge status={order.status} type="order" />
          </div>

          <p className="text-xs text-[#61717B] flex items-center gap-2 flex-wrap">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
              Placed on {order.createdAt}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
              {order.branchName}
            </span>
          </p>
        </div>

        {/* Header Action Links */}
        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href={`/orders/${order.id}`}
            className={buttonVariants({
              variant: 'outline',
              size: 'sm',
              className: 'text-xs font-semibold gap-1.5',
            })}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Order Details</span>
          </Link>
          <Link
            href="/orders"
            className={buttonVariants({
              variant: 'secondary',
              size: 'sm',
              className: 'text-xs font-semibold gap-1.5',
            })}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Order History</span>
          </Link>
        </div>
      </div>

      {/* Main 2-Column Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (8 cols): Current Status Card & Detailed Chronological Timeline */}
        <div className="lg:col-span-8 space-y-6">
          <TrackingStatusCard order={order} showOrderLink={false} />
          <TrackingTimeline order={order} />
        </div>

        {/* Right Column (4 cols): Delivery Destination Snapshot & Support */}
        <div className="lg:col-span-4 space-y-6">
          <TrackingDeliveryInfo order={order} />

          {/* Need Help / Support Note */}
          <div className="p-5 bg-[#FAF8F3] rounded-sm border border-[#DDDCD3] text-xs text-[#526570] space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-[#142C43]">
              <HelpCircle className="w-4 h-4 text-[#28657A] shrink-0" aria-hidden="true" />
              <span>Need Assistance?</span>
            </div>
            <p className="text-[11px] leading-relaxed text-[#61717B]">
              For questions regarding this order, please quote reference{' '}
              <strong className="font-mono text-[#142C43]">{order.id}</strong>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
