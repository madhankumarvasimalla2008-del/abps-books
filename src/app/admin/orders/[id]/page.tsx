'use client';

import React, { useState, use, useMemo } from 'react';
import Link from 'next/link';
import {
  ShoppingBag,
  Building2,
  Printer,
  Truck,
  CheckCircle2,
  Clock,
  FileText,
  CreditCard,
  User,
  MapPin,
  Send,
  Package,
  ArrowRight,
  ExternalLink,
  Copy,
  Check,
  AlertTriangle,
  ArrowLeft,
  Calendar,
  Layers,
  ChevronRight,
  ShieldCheck,
  XCircle,
} from 'lucide-react';
import { useOrders } from '@/context/OrderContext';
import { OrderStatus, PaymentStatus, OrderTrackingStep } from '@/types';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { Button, buttonVariants } from '@/components/ui/Button';

const ORDER_STATUS_FLOW: OrderStatus[] = [
  'Pending',
  'Confirmed',
  'Processing',
  'Packed',
  'Shipped',
  'Out for Delivery',
  'Delivered',
];

export default function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const { getOrder, updateOrderStatus, updateOrderTracking, isInitialized } = useOrders();

  const order = getOrder(resolvedParams.id);

  const [copiedId, setCopiedId] = useState(false);
  const [carrier, setCarrier] = useState('');
  const [trackingNo, setTrackingNo] = useState('');
  const [statusNotes, setStatusNotes] = useState('');
  const [actionFeedback, setActionFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  // Sync tracking input initial state when order is found
  React.useEffect(() => {
    if (order) {
      setCarrier(order.courierPartner || order.carrier || 'Delhivery Logistics');
      setTrackingNo(order.trackingNumber || '');
    }
  }, [order]);

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleStatusTransition = (targetStatus: OrderStatus) => {
    if (!order) return;
    setIsUpdatingStatus(true);
    const result = updateOrderStatus(order.id, targetStatus, {
      notes: statusNotes || undefined,
    });

    if (result.success) {
      setActionFeedback({
        type: 'success',
        message: `Order status successfully updated to "${targetStatus}"`,
      });
      setStatusNotes('');
      setShowCancelConfirm(false);
    } else {
      setActionFeedback({
        type: 'error',
        message: result.error || 'Failed to update order status.',
      });
    }
    setIsUpdatingStatus(false);
    setTimeout(() => setActionFeedback(null), 4000);
  };

  const handleSaveLogistics = (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;

    const result = updateOrderTracking(order.id, {
      courierPartner: carrier,
      carrier: carrier,
      trackingNumber: trackingNo,
    });

    if (result.success) {
      setActionFeedback({
        type: 'success',
        message: 'Logistics carrier partner and tracking reference updated.',
      });
    } else {
      setActionFeedback({
        type: 'error',
        message: result.error || 'Failed to update tracking details.',
      });
    }
    setTimeout(() => setActionFeedback(null), 4000);
  };

  if (!order && isInitialized) {
    return (
      <div className="space-y-6">
        <Breadcrumbs
          items={[
            { label: 'School Indents', href: '/admin/orders' },
            { label: `Indent ${resolvedParams.id}` },
          ]}
        />
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Order Not Found</h2>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              No order matches identifier &quot;{resolvedParams.id}&quot;. The order may have been removed or the ID was entered incorrectly.
            </p>
          </div>
          <Link
            href="/admin/orders"
            className={buttonVariants({
              variant: 'outline',
              size: 'sm',
              className: 'gap-1.5',
            })}
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to School Indents</span>
          </Link>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="space-y-6">
        <Breadcrumbs
          items={[
            { label: 'School Indents', href: '/admin/orders' },
            { label: `Indent ${resolvedParams.id}` },
          ]}
        />
        <div className="py-16 text-center space-y-3 bg-white rounded-2xl border border-slate-200/80">
          <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500">Loading order fulfillment details for Indent {resolvedParams.id}...</p>
        </div>
      </div>
    );
  }

  // Safely extract address fields
  const address = order.deliveryAddress || order.shippingAddress;
  const addressStreet =
    address.street ||
    address.streetAddress ||
    [address.addressLine1, address.addressLine2].filter(Boolean).join(', ');

  const currentWorkflowIdx = ORDER_STATUS_FLOW.indexOf(order.status);
  const isCancelled = order.status === 'Cancelled';

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: 'School Indents', href: '/admin/orders' },
          { label: `Indent ${order.id}` },
        ]}
      />

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 font-mono">
              Indent {order.id}
            </h1>
            <button
              type="button"
              onClick={() => handleCopyId(order.id)}
              className="p-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 transition-colors"
              title="Copy Order ID"
              aria-label={`Copy Order ID ${order.id}`}
            >
              {copiedId ? (
                <Check className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
            <StatusBadge status={order.status} type="order" />
            <StatusBadge status={order.paymentStatus} type="payment" />
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200/60">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
              Immutable Snapshot
            </span>
          </div>

          <p className="text-xs text-slate-500 mt-1">
            Official PO Reference:{' '}
            <strong className="text-slate-800 font-mono">
              {order.schoolPoNumber || order.poNumber || 'N/A'}
            </strong>{' '}
            • Placed on{' '}
            <span className="font-medium text-slate-700">
              {new Date(order.createdAt).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </span>{' '}
            • Order Ref: <span className="font-mono text-slate-600">{order.orderNumber}</span>
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href={`/orders/${order.id}`}
            target="_blank"
            className={buttonVariants({
              variant: 'outline',
              size: 'sm',
              className: 'gap-1.5',
            })}
          >
            <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
            <span>Customer Order View</span>
          </Link>
          <Link
            href={`/orders/${order.id}/track`}
            target="_blank"
            className={buttonVariants({
              variant: 'outline',
              size: 'sm',
              className: 'gap-1.5',
            })}
          >
            <Truck className="w-3.5 h-3.5 text-slate-500" />
            <span>Live Tracking View</span>
          </Link>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            leftIcon={<Printer className="w-3.5 h-3.5 text-slate-500" />}
          >
            Print Order
          </Button>
        </div>
      </div>

      {/* Action Feedback Banner */}
      {actionFeedback && (
        <div
          className={`p-3.5 rounded-xl border flex items-center gap-2 text-xs animate-in fade-in duration-200 ${
            actionFeedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-red-50 border-red-200 text-red-900'
          }`}
        >
          {actionFeedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
          )}
          <span className="font-medium">{actionFeedback.message}</span>
        </div>
      )}

      {/* Order Status Transition Control Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-700" />
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Order Status Transition
            </h2>
          </div>
          {isCancelled && (
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-100 text-red-800">
              Order Cancelled
            </span>
          )}
        </div>

        {/* Step Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          {ORDER_STATUS_FLOW.map((st, idx) => {
            const isCurrent = order.status === st;
            const isPassed =
              !isCancelled && currentWorkflowIdx !== -1 && currentWorkflowIdx >= idx;

            return (
              <button
                key={st}
                type="button"
                onClick={() => handleStatusTransition(st)}
                disabled={isUpdatingStatus || isCurrent}
                className={`p-3 text-left rounded-xl border text-xs transition-all ${
                  isCurrent
                    ? 'bg-emerald-800 text-white border-emerald-800 font-bold shadow-xs'
                    : isPassed
                    ? 'bg-emerald-50 text-emerald-900 border-emerald-200/80 hover:bg-emerald-100/70'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                } ${isCurrent ? 'cursor-default' : 'cursor-pointer'}`}
              >
                <div className="flex items-center justify-between text-[10px] mb-1 opacity-80">
                  <span>Step {idx + 1}</span>
                  {isPassed && <Check className="w-3 h-3 text-emerald-700 font-bold" />}
                </div>
                <div className="font-semibold leading-tight">{st}</div>
              </button>
            );
          })}
        </div>

        {/* Cancellation / Reversal & Transition Notes Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
          <div className="flex-1 w-full sm:max-w-md">
            <input
              type="text"
              placeholder="Optional dispatch notes / status remark (appended to timeline)"
              value={statusNotes}
              onChange={(e) => setStatusNotes(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
            />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {!isCancelled ? (
              showCancelConfirm ? (
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-red-600 font-medium">Confirm cancel?</span>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleStatusTransition('Cancelled')}
                    disabled={isUpdatingStatus}
                  >
                    Yes, Cancel Order
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowCancelConfirm(false)}
                  >
                    No
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCancelConfirm(true)}
                  className="text-red-700 hover:text-red-800 hover:bg-red-50 border-red-200"
                >
                  Cancel Order
                </Button>
              )
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleStatusTransition('Confirmed')}
                disabled={isUpdatingStatus}
                leftIcon={<ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />}
              >
                Reopen as Confirmed
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Order Manifest Snapshot & Historical Timeline */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Manifest (Immutable Historical Snapshot) */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="font-bold text-slate-900 text-xs">
                  Order Items Snapshot ({order.items.length}{' '}
                  {order.items.length === 1 ? 'Title' : 'Titles'})
                </h2>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Unit rates, quantities, and line totals frozen at time of order placement
                </p>
              </div>
              <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
                {order.totalQuantity} total items
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                  <tr>
                    <th className="py-3 px-4">Title &amp; Academic Details</th>
                    <th className="py-3 px-3 text-right">Unit Price</th>
                    <th className="py-3 px-3 text-right">Quantity</th>
                    <th className="py-3 px-4 text-right">Line Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {order.items.map((item, idx) => {
                    const linePrice = item.unitPrice || item.price;
                    const lineTotal = item.totalPrice || linePrice * item.quantity;
                    const itemTitle = item.productTitle || item.title;

                    return (
                      <tr key={item.id || idx} className="hover:bg-slate-50/50">
                        <td className="py-3.5 px-4">
                          <p className="font-bold text-slate-900">{itemTitle}</p>
                          <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5 flex-wrap">
                            <span className="font-mono text-slate-400">SKU: {item.sku}</span>
                            {item.isbn && item.isbn !== 'N/A' && (
                              <span className="font-mono text-slate-400">• ISBN: {item.isbn}</span>
                            )}
                            {item.grade && (
                              <span className="bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded font-medium">
                                {item.grade}
                              </span>
                            )}
                            {item.subject && (
                              <span className="text-slate-500">• {item.subject}</span>
                            )}
                            {item.publisher && (
                              <span className="text-slate-400">({item.publisher})</span>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 px-3 text-right font-mono text-slate-700">
                          ₹{linePrice.toLocaleString('en-IN')}
                        </td>
                        <td className="py-3.5 px-3 text-right font-mono font-bold text-slate-900">
                          {item.quantity}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                          ₹{lineTotal.toLocaleString('en-IN')}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Financial Totals Breakdown */}
            <div className="p-4 bg-slate-50/50 border-t border-slate-100 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span className="font-mono font-semibold">
                  ₹{order.subtotal.toLocaleString('en-IN')}
                </span>
              </div>
              {(order.discountAmount > 0 || order.discount > 0) && (
                <div className="flex justify-between text-emerald-800">
                  <span>Discount:</span>
                  <span className="font-mono font-semibold">
                    -₹{(order.discountAmount || order.discount).toLocaleString('en-IN')}
                  </span>
                </div>
              )}
              {order.tax !== undefined && order.tax > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>Tax:</span>
                  <span className="font-mono font-semibold">
                    ₹{order.tax.toLocaleString('en-IN')}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-slate-600">
                <span>Shipping Fee:</span>
                <span className="font-mono font-semibold">
                  {order.shippingFee ? `₹${order.shippingFee.toLocaleString('en-IN')}` : '₹0.00'}
                </span>
              </div>
              <div className="flex justify-between text-slate-900 text-sm font-bold pt-2.5 border-t border-slate-200">
                <span>Total Amount:</span>
                <span className="font-mono text-emerald-800">
                  ₹{order.totalAmount.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>

          {/* Historical Order Timeline / Tracking Log */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-700" />
                <h2 className="text-xs font-bold text-slate-900">
                  Order Timeline
                </h2>
              </div>
              <span className="text-[11px] text-slate-400">
                Updated: {order.updatedAt || order.createdAt}
              </span>
            </div>

            {order.timeline && order.timeline.length > 0 ? (
              <div className="space-y-4 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {order.timeline.map((step, idx) => {
                  const isDone = step.completed;
                  const isCurrent = step.current;

                  return (
                    <div key={idx} className="relative flex items-start gap-3 pl-8 text-xs">
                      {/* Step Circle Marker */}
                      <div
                        className={`absolute left-1.5 -translate-x-1/2 top-0.5 w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center transition-colors ${
                          isCurrent
                            ? 'bg-emerald-700 border-emerald-700 ring-4 ring-emerald-100'
                            : isDone
                            ? 'bg-emerald-600 border-emerald-600'
                            : 'bg-white border-slate-300'
                        }`}
                      />

                      <div className="flex-1">
                        <div className="flex items-center justify-between flex-wrap gap-1">
                          <p
                            className={`font-semibold ${
                              isCurrent
                                ? 'text-emerald-950 font-bold'
                                : isDone
                                ? 'text-slate-900'
                                : 'text-slate-400'
                            }`}
                          >
                            {step.label}
                          </p>
                          {step.timestamp && (
                            <span className="text-[10px] text-slate-400 font-mono">
                              {new Date(step.timestamp).toLocaleString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          )}
                        </div>

                        <p
                          className={`mt-0.5 text-[11px] ${
                            isDone ? 'text-slate-600' : 'text-slate-400'
                          }`}
                        >
                          {step.description}
                        </p>

                        {step.location && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-slate-500 mt-1">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            {step.location}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">No timeline entries recorded yet.</p>
            )}
          </div>
        </div>

        {/* Right 1 Column: Logistics Form, Customer Info, Address & Payment */}
        <div className="space-y-6">
          {/* Logistics & Tracking Updater */}
          <form
            onSubmit={handleSaveLogistics}
            className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4 text-xs"
          >
            <div className="flex items-center gap-2 text-slate-900 font-bold border-b border-slate-100 pb-2">
              <Truck className="w-4 h-4 text-emerald-700" />
              <span>Tracking &amp; Logistics</span>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Courier / Carrier
              </label>
              <select
                value={carrier}
                onChange={(e) => setCarrier(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600"
              >
                <option value="Delhivery Logistics">Delhivery Logistics</option>
                <option value="Blue Dart Express">Blue Dart Express</option>
                <option value="DTDC Surface">DTDC Surface</option>
                <option value="Ekart Surface">Ekart Surface</option>
                <option value="Gati KWE">Gati KWE</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Tracking Number
              </label>
              <input
                type="text"
                placeholder="e.g. TRK-88392019"
                value={trackingNo}
                onChange={(e) => setTrackingNo(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>

            <Button type="submit" variant="primary" size="sm" className="w-full">
              Update Tracking Info
            </Button>
          </form>

          {/* Customer & Branch Profile */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3.5 text-xs">
            <div className="flex items-center gap-2 text-slate-900 font-bold border-b border-slate-100 pb-2">
              <Building2 className="w-4 h-4 text-emerald-700" />
              <span>Branch &amp; Customer Details</span>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Branch
              </span>
              <p className="font-bold text-slate-900 mt-0.5">
                {order.branchName || 'Aditya Birla Public School Campus'}
              </p>
              {order.branchCode && (
                <span className="font-mono text-[10px] text-slate-500">
                  Branch Code: {order.branchCode}
                </span>
              )}
            </div>

            <div className="pt-2 border-t border-slate-100">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Customer Contact
              </span>
              <p className="font-semibold text-slate-800 mt-0.5">{order.customerName}</p>
              <p className="text-slate-500">{order.customerEmail}</p>
              {order.customerPhone && (
                <p className="font-mono text-slate-500">{order.customerPhone}</p>
              )}
            </div>
          </div>

          {/* Delivery Destination Address */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3 text-xs">
            <div className="flex items-center gap-2 text-slate-900 font-bold border-b border-slate-100 pb-2">
              <MapPin className="w-4 h-4 text-emerald-700" />
              <span>Delivery Address</span>
            </div>

            <div>
              <p className="font-semibold text-slate-900">
                {address.recipientName || address.contactPerson || order.customerName}
              </p>
              <p className="text-slate-600 mt-0.5 leading-relaxed">{addressStreet}</p>
              <p className="text-slate-600">
                {address.city}, {address.state} -{' '}
                <span className="font-mono font-semibold">{address.pincode}</span>
              </p>
            </div>

            {(address.recipientPhone || address.phone || address.contactPhone) && (
              <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                <span>Phone: </span>
                <span className="font-mono font-medium text-slate-800">
                  {address.recipientPhone || address.phone || address.contactPhone}
                </span>
              </div>
            )}

            {order.notes && (
              <div className="pt-2 border-t border-slate-100 bg-amber-50/60 p-2.5 rounded-lg text-amber-900">
                <span className="font-bold text-[10px] uppercase block">Delivery Instruction:</span>
                <p className="text-[11px] mt-0.5">{order.notes}</p>
              </div>
            )}
          </div>

          {/* Payment Information */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3 text-xs">
            <div className="flex items-center gap-2 text-slate-900 font-bold border-b border-slate-100 pb-2">
              <CreditCard className="w-4 h-4 text-emerald-700" />
              <span>Payment Details</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-500">Payment Status:</span>
              <StatusBadge status={order.paymentStatus} type="payment" />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-500">Method:</span>
              <span className="font-semibold text-slate-800">
                {order.paymentMethod}
                {order.upiSubMethod ? ` (${order.upiSubMethod.toUpperCase()})` : ''}
              </span>
            </div>

            {order.paymentReference && (
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Reference:</span>
                <span className="font-mono text-slate-700">{order.paymentReference}</span>
              </div>
            )}

            {order.paymentAttempts && order.paymentAttempts.length > 0 && (
              <div className="pt-2 border-t border-slate-100 space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Payment Attempts ({order.paymentAttempts.length})
                </span>
                <div className="space-y-1">
                  {order.paymentAttempts.map((att) => (
                    <div
                      key={att.id}
                      className="p-1.5 bg-slate-50 rounded-lg text-[10px] flex items-center justify-between"
                    >
                      <span className="text-slate-700">
                        #{att.attemptNumber} {att.paymentMethod}
                      </span>
                      <span
                        className={`font-semibold ${
                          att.status === 'Paid'
                            ? 'text-emerald-700'
                            : att.status === 'Failed'
                            ? 'text-rose-600'
                            : 'text-amber-600'
                        }`}
                      >
                        {att.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between font-bold">
              <span className="text-slate-900">Total:</span>
              <span className="font-mono text-emerald-800 text-sm">
                ₹{order.totalAmount.toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
