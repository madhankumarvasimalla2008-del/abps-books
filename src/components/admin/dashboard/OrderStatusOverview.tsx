import React from 'react';
import Link from 'next/link';
import { ArrowRight, Clock, CheckCircle2, RefreshCw, Truck, PackageCheck, XCircle } from 'lucide-react';
import { Order, OrderStatus } from '@/types';

export interface OrderStatusOverviewProps {
  orders?: Order[];
  statusCounts?: Record<string, number>;
  totalOrdersCount?: number;
}

const STATUS_CONFIG: {
  status: OrderStatus;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
  borderColor: string;
}[] = [
  {
    status: 'Pending',
    label: 'Pending',
    icon: Clock,
    color: 'text-amber-700',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200/80',
  },
  {
    status: 'Confirmed',
    label: 'Confirmed',
    icon: CheckCircle2,
    color: 'text-blue-700',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200/80',
  },
  {
    status: 'Processing',
    label: 'Processing',
    icon: RefreshCw,
    color: 'text-indigo-700',
    bgColor: 'bg-indigo-50',
    borderColor: 'border-indigo-200/80',
  },
  {
    status: 'Shipped',
    label: 'Shipped',
    icon: Truck,
    color: 'text-purple-700',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200/80',
  },
  {
    status: 'Delivered',
    label: 'Delivered',
    icon: PackageCheck,
    color: 'text-emerald-700',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200/80',
  },
  {
    status: 'Cancelled',
    label: 'Cancelled',
    icon: XCircle,
    color: 'text-rose-700',
    bgColor: 'bg-rose-50',
    borderColor: 'border-rose-200/80',
  },
];

export const OrderStatusOverview: React.FC<OrderStatusOverviewProps> = ({
  orders,
  statusCounts,
  totalOrdersCount,
}) => {
  const counts = React.useMemo(() => {
    if (statusCounts) {
      return statusCounts;
    }
    const derived: Record<string, number> = {
      Pending: 0,
      Confirmed: 0,
      Processing: 0,
      Shipped: 0,
      Delivered: 0,
      Cancelled: 0,
    };
    if (orders && orders.length > 0) {
      orders.forEach((o) => {
        if (derived[o.status] !== undefined) {
          derived[o.status]++;
        }
      });
    }
    return derived;
  }, [orders, statusCounts]);

  const totalCount =
    totalOrdersCount !== undefined
      ? totalOrdersCount
      : orders
        ? orders.length
        : Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-900">Order Status Overview</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Distribution of {totalCount} {totalCount === 1 ? 'order' : 'orders'} across fulfillment stages
          </p>
        </div>
        <Link
          href="/admin/orders"
          className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 inline-flex items-center gap-1 group"
        >
          <span>View All</span>
          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {STATUS_CONFIG.map(({ status, label, icon: Icon, color, bgColor, borderColor }) => {
          const count = counts[status] || 0;
          return (
            <Link
              key={status}
              href="/admin/orders"
              className={`p-3 rounded-lg border ${borderColor} ${bgColor} flex flex-col justify-between hover:shadow-xs transition-shadow`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`text-[11px] font-bold uppercase tracking-wider ${color}`}>
                  {label}
                </span>
                <Icon className={`w-4 h-4 ${color}`} />
              </div>
              <div className="text-xl font-bold text-slate-900">{count}</div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};
