'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Package,
  Calendar,
  Building2,
  ChevronRight,
  Truck,
  RotateCcw,
  CheckCircle2,
  BookOpen,
} from 'lucide-react';
import { Order } from '@/types';
import { OrderStatusBadge } from './OrderStatusBadge';
import { Button, buttonVariants } from '@/components/ui/Button';
import { useOrders } from '@/context/OrderContext';

export interface OrderCardProps {
  order: Order;
}

export const OrderCard: React.FC<OrderCardProps> = ({ order }) => {
  const router = useRouter();
  const { reorder } = useOrders();
  const [reorderFeedback, setReorderFeedback] = useState<string | null>(null);

  const totalCopies =
    order.totalQuantity || order.items.reduce((acc, i) => acc + i.quantity, 0);

  const handleReorder = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const res = reorder(order.id);
    if (res.success) {
      setReorderFeedback(res.message);
      setTimeout(() => {
        router.push('/cart');
      }, 700);
    }
  };

  const previewItems = order.items.slice(0, 3);
  const remainingCount = order.items.length - 3;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden hover:border-slate-300 transition-all">
      {/* Header Section */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white border border-slate-200/90 flex items-center justify-center text-emerald-800 shadow-2xs shrink-0 mt-0.5 sm:mt-0">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono font-bold text-slate-900 text-sm">
                {order.id}
              </span>
              <OrderStatusBadge status={order.status} type="order" />
              <OrderStatusBadge status={order.paymentStatus} type="payment" />
            </div>
            <div className="flex items-center gap-2 sm:gap-3 text-[11px] text-slate-500 mt-1 flex-wrap">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3 text-slate-400" /> {order.createdAt}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 truncate max-w-[200px] sm:max-w-none">
                <Building2 className="w-3 h-3 text-slate-400" /> {order.branchName}
              </span>
            </div>
          </div>
        </div>

        {/* Pricing & Quantity Info */}
        <div className="text-left sm:text-right border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
          <span className="text-[11px] text-slate-500 block">
            {order.items.length} {order.items.length === 1 ? 'Title' : 'Titles'} ({totalCopies} {totalCopies === 1 ? 'Copy' : 'Copies'})
          </span>
          <span className="text-base sm:text-lg font-extrabold text-slate-900">
            ₹{order.totalAmount.toLocaleString('en-IN')}
          </span>
        </div>
      </div>

      {/* Items Preview List */}
      <div className="p-4 sm:p-5 space-y-3">
        <div className="space-y-2">
          {previewItems.map((item, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between text-xs py-1 border-b border-slate-50 last:border-0"
            >
              <div className="flex items-center gap-2 min-w-0 pr-3">
                <BookOpen className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                <span className="font-medium text-slate-800 truncate">
                  {item.productTitle || item.title}
                </span>
                <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium shrink-0">
                  {item.grade}
                </span>
              </div>
              <div className="text-slate-600 font-medium whitespace-nowrap text-[11px] shrink-0">
                {item.quantity} × ₹{item.unitPrice} ={' '}
                <strong className="text-slate-900">
                  ₹{(item.totalPrice || item.unitPrice * item.quantity).toLocaleString('en-IN')}
                </strong>
              </div>
            </div>
          ))}

          {remainingCount > 0 && (
            <div className="text-[11px] text-slate-500 pt-1">
              + {remainingCount} more {remainingCount === 1 ? 'item' : 'items'} in this order
            </div>
          )}
        </div>

        {/* Reorder Feedback Notification */}
        {reorderFeedback && (
          <div className="p-2.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-700" />
            <span>{reorderFeedback} Opening cart...</span>
          </div>
        )}

        {/* Footer Actions */}
        <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-xs text-slate-500 flex items-center gap-2">
            {order.trackingNumber ? (
              <span className="flex items-center gap-1 text-emerald-900 font-mono text-[11px] bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-150">
                <Truck className="w-3.5 h-3.5 text-emerald-700" /> Tracking: {order.trackingNumber}
              </span>
            ) : (
              <span className="text-slate-400 text-[11px]">
                Standard delivery processing
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleReorder}
              leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
              className="text-xs"
            >
              Buy Again
            </Button>

            <Link
              href={`/orders/${order.id}/track`}
              className={buttonVariants({
                variant: 'outline',
                size: 'sm',
                className: 'text-xs gap-1.5',
              })}
            >
              <Truck className="w-3.5 h-3.5" />
              <span>View Tracking</span>
            </Link>

            <Link
              href={`/orders/${order.id}`}
              className={buttonVariants({
                variant: 'secondary',
                size: 'sm',
                className: 'text-xs font-semibold gap-1.5',
              })}
            >
              <span>View Details</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
