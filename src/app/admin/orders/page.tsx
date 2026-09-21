'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  ShoppingBag,
  Search,
  Filter,
  Eye,
  FileSpreadsheet,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Truck,
  ArrowRight,
  Copy,
  Check,
  X,
  RotateCcw,
  ExternalLink,
  PackageOpen,
  AlertCircle,
} from 'lucide-react';
import { useOrders } from '@/context/OrderContext';
import { OrderStatus, PaymentStatus } from '@/types';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { StatCard } from '@/components/ui/StatCard';
import { Button } from '@/components/ui/Button';

type SortKey = 'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc' | 'items-desc';

export default function AdminOrdersPage() {
  const { orders, isInitialized } = useOrders();

  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState<string>('all');
  const [selectedBranch, setSelectedBranch] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortKey>('date-desc');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Extract unique branch names from active orders
  const branches = useMemo(() => {
    const list = Array.from(new Set(orders.map((o) => o.branchName).filter(Boolean)));
    return list.sort();
  }, [orders]);

  // Copy order ID helper
  const handleCopyId = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filter and Sort Pipeline
  const filteredOrders = useMemo(() => {
    return orders
      .filter((order) => {
        const q = search.toLowerCase().trim();
        const matchSearch =
          q === '' ||
          order.id.toLowerCase().includes(q) ||
          (order.orderNumber && order.orderNumber.toLowerCase().includes(q)) ||
          (order.customerName && order.customerName.toLowerCase().includes(q)) ||
          (order.customerEmail && order.customerEmail.toLowerCase().includes(q)) ||
          (order.branchName && order.branchName.toLowerCase().includes(q)) ||
          (order.poNumber && order.poNumber.toLowerCase().includes(q)) ||
          (order.schoolPoNumber && order.schoolPoNumber.toLowerCase().includes(q)) ||
          (order.trackingNumber && order.trackingNumber.toLowerCase().includes(q));

        const matchStatus = selectedStatus === 'all' || order.status === selectedStatus;
        const matchPayment =
          selectedPaymentStatus === 'all' || order.paymentStatus === selectedPaymentStatus;
        const matchBranch = selectedBranch === 'all' || order.branchName === selectedBranch;

        return matchSearch && matchStatus && matchPayment && matchBranch;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case 'date-asc':
            return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          case 'amount-desc':
            return b.totalAmount - a.totalAmount;
          case 'amount-asc':
            return a.totalAmount - b.totalAmount;
          case 'items-desc':
            return b.totalQuantity - a.totalQuantity;
          case 'date-desc':
          default:
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
      });
  }, [orders, search, selectedStatus, selectedPaymentStatus, selectedBranch, sortBy]);

  // Aggregate Metrics
  const totalRevenue = useMemo(
    () => orders.reduce((acc, o) => acc + o.totalAmount, 0),
    [orders]
  );

  const pendingCount = useMemo(
    () =>
      orders.filter(
        (o) =>
          o.status === 'Pending' ||
          o.status === 'Confirmed' ||
          o.status === 'Processing' ||
          o.status === 'Packed'
      ).length,
    [orders]
  );

  const transitCount = useMemo(
    () =>
      orders.filter((o) => o.status === 'Shipped' || o.status === 'Out for Delivery').length,
    [orders]
  );

  const deliveredCount = useMemo(
    () => orders.filter((o) => o.status === 'Delivered').length,
    [orders]
  );

  const hasActiveFilters =
    search.trim() !== '' ||
    selectedStatus !== 'all' ||
    selectedPaymentStatus !== 'all' ||
    selectedBranch !== 'all';

  const handleResetFilters = () => {
    setSearch('');
    setSelectedStatus('all');
    setSelectedPaymentStatus('all');
    setSelectedBranch('all');
    setSortBy('date-desc');
  };

  // Export CSV Handler
  const handleExportCSV = () => {
    const headers = [
      'Order ID',
      'Order Number',
      'PO Number',
      'Created Date',
      'Customer Name',
      'Customer Email',
      'Branch Name',
      'Total Quantity',
      'Subtotal',
      'Discount',
      'Total Amount',
      'Payment Status',
      'Order Status',
      'Tracking Number',
    ];

    const rows = filteredOrders.map((o) => [
      o.id,
      o.orderNumber,
      o.schoolPoNumber || o.poNumber || '',
      o.createdAt,
      `"${(o.customerName || '').replace(/"/g, '""')}"`,
      o.customerEmail,
      `"${(o.branchName || '').replace(/"/g, '""')}"`,
      o.totalQuantity,
      o.subtotal,
      o.discountAmount || o.discount || 0,
      o.totalAmount,
      o.paymentStatus,
      o.status,
      o.trackingNumber || '',
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `abps_admin_orders_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header & Demo Indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
              Orders &amp; Fulfillment
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200/60">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
              Demo / Mock State
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Review, filter, and manage orders across school branches
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            leftIcon={<FileSpreadsheet className="w-4 h-4 text-emerald-700" />}
            disabled={filteredOrders.length === 0}
          >
            Export Orders CSV
          </Button>
        </div>
      </div>

      {/* Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Orders"
          value={orders.length.toString()}
          change={{ value: `${deliveredCount} delivered`, positive: true }}
          icon={<ShoppingBag className="w-5 h-5 text-emerald-700" />}
        />
        <StatCard
          title="Pending / Processing"
          value={pendingCount.toString()}
          change={{ value: 'Awaiting fulfillment', positive: pendingCount === 0 }}
          icon={<Clock className="w-5 h-5 text-amber-600" />}
        />
        <StatCard
          title="Shipped / In Transit"
          value={transitCount.toString()}
          change={{ value: 'Active shipments', positive: true }}
          icon={<Truck className="w-5 h-5 text-blue-700" />}
        />
        <StatCard
          title="Total Revenue"
          value={`₹${totalRevenue.toLocaleString('en-IN')}`}
          change={{ value: 'Cumulative order value', positive: true }}
          icon={<CheckCircle2 className="w-5 h-5 text-indigo-700" />}
        />
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Search Input */}
          <div className="md:col-span-4 relative">
            <input
              type="text"
              placeholder="Search by Order ID, PO #, Customer, Branch, Tracking..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-all"
              aria-label="Search orders"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                aria-label="Clear search query"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Branch Filter */}
          <div className="md:col-span-3">
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-all text-slate-700"
              aria-label="Filter by school branch"
            >
              <option value="all">All ABPS Branches ({branches.length})</option>
              {branches.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="md:col-span-2">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-all text-slate-700"
              aria-label="Filter by fulfillment status"
            >
              <option value="all">All Order Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Confirmed">Confirmed</option>
              <option value="Processing">Processing</option>
              <option value="Packed">Packed</option>
              <option value="Shipped">Shipped</option>
              <option value="Out for Delivery">Out for Delivery</option>
              <option value="Delivered">Delivered</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          {/* Payment Status Filter */}
          <div className="md:col-span-3 flex items-center gap-2">
            <select
              value={selectedPaymentStatus}
              onChange={(e) => setSelectedPaymentStatus(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-all text-slate-700"
              aria-label="Filter by payment status"
            >
              <option value="all">All Payment Statuses</option>
              <option value="Paid">Paid</option>
              <option value="Pending">Pending Payment</option>
              <option value="Partial">Partial</option>
              <option value="Failed">Failed</option>
              <option value="Refunded">Refunded</option>
            </select>

            {/* Sort Control */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortKey)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-all text-slate-700"
              aria-label="Sort orders"
            >
              <option value="date-desc">Newest First</option>
              <option value="date-asc">Oldest First</option>
              <option value="amount-desc">Amount: High to Low</option>
              <option value="amount-asc">Amount: Low to High</option>
              <option value="items-desc">Quantity: High to Low</option>
            </select>
          </div>
        </div>

        {/* Active Filter Indicators & Reset Button */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
            <div className="flex flex-wrap items-center gap-1.5 text-slate-500">
              <span>Active filters:</span>
              {search && (
                <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-800 px-2 py-0.5 rounded-lg">
                  Search: &quot;{search}&quot;
                  <button
                    type="button"
                    onClick={() => setSearch('')}
                    className="hover:text-red-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {selectedBranch !== 'all' && (
                <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-800 px-2 py-0.5 rounded-lg">
                  Branch: {selectedBranch}
                  <button
                    type="button"
                    onClick={() => setSelectedBranch('all')}
                    className="hover:text-red-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {selectedStatus !== 'all' && (
                <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-800 px-2 py-0.5 rounded-lg">
                  Status: {selectedStatus}
                  <button
                    type="button"
                    onClick={() => setSelectedStatus('all')}
                    className="hover:text-red-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {selectedPaymentStatus !== 'all' && (
                <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-800 px-2 py-0.5 rounded-lg">
                  Payment: {selectedPaymentStatus}
                  <button
                    type="button"
                    onClick={() => setSelectedPaymentStatus('all')}
                    className="hover:text-red-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1 text-emerald-800 hover:text-emerald-900 font-semibold"
            >
              <RotateCcw className="w-3 h-3" />
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* Orders Table Container */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
          <span>
            Showing <strong className="text-slate-900">{filteredOrders.length}</strong> of{' '}
            <strong className="text-slate-900">{orders.length}</strong> orders
          </span>
          {sortBy !== 'date-desc' && (
            <span className="text-[11px] text-slate-400">
              Sorted by: <strong className="text-slate-600">{sortBy.replace('-', ' ')}</strong>
            </span>
          )}
        </div>

        {filteredOrders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Order ID &amp; Date</th>
                  <th className="py-3 px-3">Customer &amp; Branch</th>
                  <th className="py-3 px-3 text-right">Items / Books</th>
                  <th className="py-3 px-3 text-right">Total Net Amount</th>
                  <th className="py-3 px-3">Payment</th>
                  <th className="py-3 px-3">Fulfillment Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOrders.map((order) => {
                  const isCopied = copiedId === order.id;

                  return (
                    <tr key={order.id} className="hover:bg-slate-50/60 transition-colors group">
                      {/* Order & Date */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="flex items-center gap-1.5">
                          <Link
                            href={`/admin/orders/${order.id}`}
                            className="font-bold text-slate-900 hover:text-emerald-700 font-mono"
                          >
                            {order.id}
                          </Link>
                          <button
                            type="button"
                            onClick={(e) => handleCopyId(order.id, e)}
                            className="text-slate-400 hover:text-slate-600 p-0.5 rounded transition-colors"
                            title="Copy Order ID"
                            aria-label={`Copy Order ID ${order.id}`}
                          >
                            {isCopied ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                        <span className="text-[11px] text-slate-400 block mt-0.5">
                          {new Date(order.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                        {order.schoolPoNumber && (
                          <span className="font-mono text-[10px] text-slate-500 block">
                            PO: {order.schoolPoNumber}
                          </span>
                        )}
                      </td>

                      {/* Customer & Branch */}
                      <td className="py-3.5 px-3 align-top">
                        <p className="font-semibold text-slate-900 leading-snug">
                          {order.branchName || 'ABPS Main Branch'}
                        </p>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          <span>{order.customerName}</span>
                          {order.customerEmail && (
                            <span className="text-slate-400 block">{order.customerEmail}</span>
                          )}
                        </div>
                      </td>

                      {/* Items */}
                      <td className="py-3.5 px-3 align-top text-right">
                        <span className="font-mono font-bold text-slate-900">
                          {order.totalQuantity} units
                        </span>
                        <span className="text-[10px] text-slate-400 block">
                          {order.items.length} {order.items.length === 1 ? 'title' : 'titles'}
                        </span>
                      </td>

                      {/* Total Amount */}
                      <td className="py-3.5 px-3 align-top text-right">
                        <span className="font-bold text-slate-900 font-mono text-sm">
                          ₹{order.totalAmount.toLocaleString('en-IN')}
                        </span>
                        {order.discountAmount > 0 && (
                          <span className="text-[10px] text-emerald-700 block">
                            Saved ₹{order.discountAmount.toLocaleString('en-IN')}
                          </span>
                        )}
                      </td>

                      {/* Payment Status */}
                      <td className="py-3.5 px-3 align-top">
                        <div className="space-y-1">
                          <StatusBadge status={order.paymentStatus} type="payment" />
                          <span className="text-[10px] text-slate-400 block">
                            {order.paymentMethod}
                          </span>
                        </div>
                      </td>

                      {/* Fulfillment Status */}
                      <td className="py-3.5 px-3 align-top">
                        <div className="space-y-1">
                          <StatusBadge status={order.status} type="order" />
                          {order.trackingNumber && (
                            <span className="text-[10px] font-mono text-slate-500 block truncate max-w-[120px]">
                              {order.trackingNumber}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 align-top text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link href={`/admin/orders/${order.id}`}>
                            <Button
                              variant="outline"
                              size="sm"
                              rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                            >
                              Manage
                            </Button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          /* No results state */
          <div className="py-12 px-4 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <PackageOpen className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">No matching orders found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                {hasActiveFilters
                  ? 'No orders match your active search or filter criteria. Try adjusting your parameters.'
                  : 'There are currently no customer orders in the system.'}
              </p>
            </div>
            {hasActiveFilters && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetFilters}
                leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
              >
                Reset All Filters
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
