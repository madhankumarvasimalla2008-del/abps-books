'use client';

import React from 'react';
import {
  CheckCircle2,
  Clock,
  Circle,
  MapPin,
  Package,
} from 'lucide-react';
import { Order, OrderTrackingStep, OrderStatus } from '@/types';

export interface TrackingTimelineProps {
  order: Order;
}

interface TimelineStageConfig {
  status: OrderStatus;
  label: string;
  description: string;
}

const DEFAULT_STAGES: TimelineStageConfig[] = [
  {
    status: 'Pending',
    label: 'Order Placed',
    description: 'Order has been recorded',
  },
  {
    status: 'Confirmed',
    label: 'Order Confirmed',
    description: 'Order details verified',
  },
  {
    status: 'Processing',
    label: 'Processing',
    description: 'Order is being prepared',
  },
  {
    status: 'Shipped',
    label: 'Shipped',
    description: 'Order dispatched for delivery',
  },
  {
    status: 'Delivered',
    label: 'Delivered',
    description: 'Order delivered',
  },
];

const ORDERED_STATUSES: OrderStatus[] = [
  'Pending',
  'Confirmed',
  'Processing',
  'Shipped',
  'Delivered',
];

export const TrackingTimeline: React.FC<TrackingTimelineProps> = ({ order }) => {
  const currentStatusIndex = ORDERED_STATUSES.indexOf(order.status);

  // If order has existing timeline steps from mock data, merge them with stages
  const steps: OrderTrackingStep[] = React.useMemo(() => {
    if (order.timeline && order.timeline.length > 0) {
      return order.timeline;
    }

    return DEFAULT_STAGES.map((stage, idx) => {
      const isCompleted = currentStatusIndex >= 0 ? idx < currentStatusIndex : false;
      const isCurrent = currentStatusIndex >= 0 ? idx === currentStatusIndex : idx === 0;

      return {
        status: stage.status,
        label: stage.label,
        description: stage.description,
        completed: isCompleted,
        current: isCurrent,
        timestamp: isCompleted || isCurrent ? order.updatedAt || order.createdAt : undefined,
      };
    });
  }, [order, currentStatusIndex]);

  const formatTimestamp = (ts?: string) => {
    if (!ts) return null;
    try {
      const d = new Date(ts);
      if (isNaN(d.getTime())) return ts;
      return d.toLocaleDateString('en-IN', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return ts;
    }
  };

  return (
    <div className="bg-white p-5 sm:p-6 rounded-sm border border-[#DDDCD3]  space-y-6">
      <div className="flex items-center justify-between border-b border-[#DDDCD3]/60 pb-3">
        <div className="flex items-center gap-2">
          <Package className="w-4 h-4 text-[#28657A]" aria-hidden="true" />
          <h2 className="text-sm sm:text-base font-bold text-[#142C43]">
            Fulfillment Timeline
          </h2>
        </div>
        <span className="text-xs text-[#61717B] font-medium">
          Step {Math.max(1, currentStatusIndex + 1)} of {ORDERED_STATUSES.length}
        </span>
      </div>

      {/* Semantic Ordered List Timeline */}
      <ol
        className="relative pl-6 sm:pl-8 space-y-7 before:absolute before:left-2.5 sm:before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200"
        aria-label="Order tracking timeline"
      >
        {steps.map((step, idx) => {
          const isDone = step.completed;
          const isCurrent = step.current;
          const isUpcoming = !isDone && !isCurrent;
          const formattedTime = formatTimestamp(step.timestamp);

          return (
            <li
              key={idx}
              className="relative group list-none"
              aria-current={isCurrent ? 'step' : undefined}
            >
              {/* Node Icon */}
              <div
                className={`absolute -left-6 sm:-left-8 top-0.5 w-6 h-6 rounded-full flex items-center justify-center ring-4 ring-white transition-all ${
                  isDone
                    ? 'bg-[#28657A] text-white'
                    : isCurrent
                    ? 'bg-amber-600 text-white ring-amber-100 animate-pulse'
                    : 'bg-[#F0EEE7] text-slate-400 border border-slate-300'
                }`}
              >
                {isDone ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                    <span className="sr-only">Completed: </span>
                  </>
                ) : isCurrent ? (
                  <>
                    <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                    <span className="sr-only">Current stage: </span>
                  </>
                ) : (
                  <>
                    <Circle className="w-3.5 h-3.5" aria-hidden="true" />
                    <span className="sr-only">Upcoming: </span>
                  </>
                )}
              </div>

              {/* Step Content */}
              <div className="space-y-1">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs sm:text-sm font-bold ${
                        isDone || isCurrent ? 'text-[#142C43]' : 'text-slate-400'
                      }`}
                    >
                      {step.label}
                    </span>
                    {isCurrent && (
                      <span className="text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200/80 px-2 py-0.2 rounded-full uppercase tracking-wider">
                        In Progress
                      </span>
                    )}
                    {isDone && (
                      <span className="text-[10px] font-medium text-[#28657A] bg-[#EDF2F1] px-1.5 py-0.2 rounded">
                        Done
                      </span>
                    )}
                  </div>

                  {formattedTime ? (
                    <span className="text-[11px] text-slate-400 font-mono">
                      {formattedTime}
                    </span>
                  ) : isUpcoming ? (
                    <span className="text-[10px] text-slate-400 italic">
                      Pending
                    </span>
                  ) : null}
                </div>

                <p
                  className={`text-xs leading-relaxed ${
                    isDone || isCurrent ? 'text-[#526570]' : 'text-slate-400'
                  }`}
                >
                  {step.description}
                </p>

                {/* Location indicator (only if present in mock data) */}
                {step.location && (
                  <p className="text-[11px] text-[#61717B] flex items-center gap-1 pt-0.5">
                    <MapPin className="w-3 h-3 text-slate-400 shrink-0" aria-hidden="true" />
                    <span>{step.location}</span>
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
};
