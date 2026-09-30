'use client';

import React from 'react';
import Link from 'next/link';
import { CheckCircle2, Clock, Truck, ChevronRight } from 'lucide-react';
import { Order, OrderTrackingStep } from '@/types';
import { buttonVariants } from '@/components/ui/Button';

export interface OrderStatusTimelineProps {
  order: Order;
  showFullLink?: boolean;
}

export const OrderStatusTimeline: React.FC<OrderStatusTimelineProps> = ({
  order,
  showFullLink = true,
}) => {
  const steps: OrderTrackingStep[] =
    order.timeline && order.timeline.length > 0
      ? order.timeline
      : [
          {
            status: 'Pending',
            label: 'Order Placed',
            description: 'Order has been recorded',
            completed: true,
            current: order.status === 'Pending',
          },
          {
            status: 'Confirmed',
            label: 'Order Confirmed',
            description: 'Order details verified',
            completed: order.status !== 'Pending',
            current: order.status === 'Confirmed',
          },
          {
            status: 'Processing',
            label: 'Processing',
            description: 'Order is being prepared',
            completed: ['Processing', 'Shipped', 'Delivered'].includes(order.status),
            current: order.status === 'Processing',
          },
          {
            status: 'Shipped',
            label: 'Shipped',
            description: 'Order dispatched for delivery',
            completed: ['Shipped', 'Delivered'].includes(order.status),
            current: order.status === 'Shipped',
          },
          {
            status: 'Delivered',
            label: 'Delivered',
            description: 'Order delivered',
            completed: order.status === 'Delivered',
            current: order.status === 'Delivered',
          },
        ];

  return (
    <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <Truck className="w-4 h-4 text-emerald-800" />
          <h2 className="text-sm sm:text-base font-bold text-slate-900">
            Order Status Timeline
          </h2>
        </div>
        {order.trackingNumber && (
          <span className="font-mono text-xs text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
            Tracking Ref: {order.trackingNumber}
          </span>
        )}
      </div>

      {/* Timeline Steps */}
      <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-2.5 sm:before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
        {steps.map((step, idx) => {
          const isDone = step.completed;
          const isCurrent = step.current;

          return (
            <div key={idx} className="relative group">
              {/* Step Node Icon */}
              <div
                className={`absolute -left-6 sm:-left-8 top-0.5 w-6 h-6 rounded-full flex items-center justify-center ring-4 ring-white ${
                  isDone
                    ? 'bg-emerald-700 text-white'
                    : isCurrent
                    ? 'bg-emerald-600 text-white ring-emerald-100 animate-pulse'
                    : 'bg-slate-200 text-slate-400'
                }`}
              >
                {isDone ? (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                ) : (
                  <Clock className="w-3.5 h-3.5" />
                )}
              </div>

              {/* Step Info */}
              <div className="space-y-0.5">
                <div className="flex items-baseline justify-between gap-2 flex-wrap">
                  <span
                    className={`text-xs sm:text-sm font-bold ${
                      isDone || isCurrent ? 'text-slate-900' : 'text-slate-400'
                    }`}
                  >
                    {step.label}
                  </span>
                  {step.timestamp && (
                    <span className="text-[10px] text-slate-400 font-medium">
                      {new Date(step.timestamp).toLocaleDateString('en-IN', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">{step.description}</p>
              </div>
            </div>
          );
        })}
      </div>

      {showFullLink && (
        <div className="pt-2 border-t border-slate-100">
          <Link
            href={`/orders/${order.id}/track`}
            className={buttonVariants({
              variant: 'outline',
              size: 'sm',
              className: 'w-full text-xs font-semibold gap-1.5',
            })}
          >
            <span>View Tracking Information</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}
    </div>
  );
};
