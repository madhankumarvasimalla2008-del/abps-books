'use client';

import React from 'react';
import Link from 'next/link';
import {
  Package,
  Calendar,
  Truck,
  Building2,
  Clock,
  ExternalLink,
  Info,
} from 'lucide-react';
import { Order } from '@/types';
import { OrderStatusBadge } from '@/components/customer/orders/OrderStatusBadge';
import { buttonVariants } from '@/components/ui/Button';

export interface TrackingStatusCardProps {
  order: Order;
  showOrderLink?: boolean;
}

export const TrackingStatusCard: React.FC<TrackingStatusCardProps> = ({
  order,
  showOrderLink = true,
}) => {
  // Safe date formatting
  const formatDateTime = (dateStr?: string) => {
    if (!dateStr) return null;
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  const lastUpdatedDisplay =
    formatDateTime(order.updatedAt) || formatDateTime(order.createdAt) || 'Time information unavailable';

  const carrierName = order.courierPartner || order.carrier;
  const trackingNumber = order.trackingNumber;

  return (
    <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
      {/* Top Bar: Order Identifier & Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider bg-emerald-50 px-2 py-0.5 rounded-full">
              Fulfillment Status
            </span>
            <span className="font-mono font-bold text-slate-900 text-sm sm:text-base">
              Order {order.id}
            </span>
            <OrderStatusBadge status={order.status} type="order" />
          </div>
          <p className="text-xs text-slate-500 flex items-center gap-2 flex-wrap">
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

        {showOrderLink && (
          <Link
            href={`/orders/${order.id}`}
            className={buttonVariants({
              variant: 'outline',
              size: 'sm',
              className: 'text-xs font-semibold gap-1.5',
            })}
          >
            <span>Order Details</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>

      {/* Snapshot Information Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        {/* Tracking Reference */}
        <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200/80 space-y-1">
          <span className="text-[11px] font-semibold text-slate-500 block uppercase tracking-wider">
            Tracking Reference
          </span>
          {trackingNumber ? (
            <span className="font-mono font-bold text-slate-900 text-xs sm:text-sm block">
              {trackingNumber}
            </span>
          ) : (
            <span className="text-xs text-slate-400 italic block">
              Reference assigned upon dispatch
            </span>
          )}
        </div>

        {/* Carrier / Delivery Partner */}
        <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200/80 space-y-1">
          <span className="text-[11px] font-semibold text-slate-500 block uppercase tracking-wider">
            Delivery Partner
          </span>
          {carrierName ? (
            <span className="font-semibold text-slate-900 text-xs sm:text-sm flex items-center gap-1.5">
              <Truck className="w-3.5 h-3.5 text-emerald-700 shrink-0" aria-hidden="true" />
              <span className="truncate">{carrierName}</span>
            </span>
          ) : (
            <span className="text-xs text-slate-500 block">
              Carrier information will appear when available.
            </span>
          )}
        </div>

        {/* Last Updated Timestamp */}
        <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200/80 space-y-1">
          <span className="text-[11px] font-semibold text-slate-500 block uppercase tracking-wider">
            Last Updated
          </span>
          <span className="text-xs text-slate-700 font-medium flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" aria-hidden="true" />
            <span>{lastUpdatedDisplay}</span>
          </span>
        </div>
      </div>

      {/* Estimated Delivery Note (only if present in mock data) */}
      {order.estimatedDelivery && (
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 text-xs text-slate-600 flex items-start gap-2">
          <Info className="w-4 h-4 text-emerald-800 shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <span className="font-semibold text-slate-800">Estimated Delivery: </span>
            <span>{order.estimatedDelivery}</span>
          </div>
        </div>
      )}
    </div>
  );
};
