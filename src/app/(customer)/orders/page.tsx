'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Package,
  Search,
  Truck,
  FileText,
  Calendar,
  Building2,
  ChevronRight,
  Clock,
  CheckCircle2,
  BookOpen,
  Filter,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { useOrders } from '@/context/OrderContext';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Button, buttonVariants } from '@/components/ui/Button';
import { OrderCard } from '@/components/customer/orders/OrderCard';
import { OrderEmptyState } from '@/components/customer/orders/OrderEmptyState';

export default function CustomerOrdersPage() {
  const { orders } = useOrders();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        q === '' ||
        order.id.toLowerCase().includes(q) ||
        order.branchName.toLowerCase().includes(q) ||
        order.items.some(
          (item) =>
            item.title?.toLowerCase().includes(q) ||
            item.productTitle?.toLowerCase().includes(q)
        );

      const matchesStatus =
        statusFilter === 'all' ||
        order.status.toLowerCase() === statusFilter.toLowerCase();

      return matchesSearch && matchesStatus;
    });
  }, [orders, searchQuery, statusFilter]);

  // Aggregate Metrics Summary
  const metrics = useMemo(() => {
    const totalOrders = orders.length;
    const totalCopies = orders.reduce((sum, order) => {
      const q = order.totalQuantity || order.items.reduce((s, i) => s + i.quantity, 0);
      return sum + q;
    }, 0);
    const activeOrders = orders.filter((o) =>
      ['Pending', 'Confirmed', 'Processing', 'Packed', 'Shipped', 'Out for Delivery'].includes(
        o.status
      )
    ).length;
    const totalValue = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

    return { totalOrders, totalCopies, activeOrders, totalValue };
  }, [orders]);

  const tabs = [
    { id: 'all', label: 'All Orders', count: orders.length },
    {
      id: 'confirmed',
      label: 'Confirmed',
      count: orders.filter((o) => o.status.toLowerCase() === 'confirmed').length,
    },
    {
      id: 'processing',
      label: 'Processing',
      count: orders.filter((o) => ['processing', 'packed'].includes(o.status.toLowerCase())).length,
    },
    {
      id: 'shipped',
      label: 'In Transit',
      count: orders.filter((o) =>
        ['shipped', 'out for delivery'].includes(o.status.toLowerCase())
      ).length,
    },
    {
      id: 'delivered',
      label: 'Delivered',
      count: orders.filter((o) => o.status.toLowerCase() === 'delivered').length,
    },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-8">
      <Breadcrumbs items={[{ label: 'Order History' }]} />

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider bg-emerald-50 px-2.5 py-1 rounded-full">
            My Orders
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1.5">
            Order History
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Track order status, view item details, and manage textbook orders for your branch.
          </p>
        </div>

        <Link
          href="/books"
          className={buttonVariants({
            variant: 'primary',
            size: 'md',
            className: 'w-full sm:w-auto text-xs sm:text-sm font-semibold shadow-2xs inline-flex items-center gap-2',
          })}
        >
          <span>Browse Books</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Metrics Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-1">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Total Orders
          </span>
          <span className="text-xl sm:text-2xl font-extrabold text-slate-900 block font-mono">
            {metrics.totalOrders}
          </span>
          <span className="text-[11px] text-slate-400">All recorded orders</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-1">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Total Copies
          </span>
          <span className="text-xl sm:text-2xl font-extrabold text-emerald-800 block font-mono">
            {metrics.totalCopies.toLocaleString('en-IN')}
          </span>
          <span className="text-[11px] text-slate-400">Curriculum units</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-1">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Active Orders
          </span>
          <span className="text-xl sm:text-2xl font-extrabold text-amber-700 block font-mono">
            {metrics.activeOrders}
          </span>
          <span className="text-[11px] text-slate-400">In fulfillment pipeline</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-1">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Total Order Value
          </span>
          <span className="text-xl sm:text-2xl font-extrabold text-slate-900 block font-mono">
            ₹{metrics.totalValue.toLocaleString('en-IN')}
          </span>
          <span className="text-[11px] text-slate-400">Cumulative order value</span>
        </div>
      </div>

      {/* Tabs & Search Filter Card */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Status Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            {tabs.map((tab) => {
              const isActive = statusFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      isActive ? 'bg-slate-700 text-slate-200' : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-72">
            <input
              type="text"
              placeholder="Search by Order #, branch, or title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200/90 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:bg-white transition-all placeholder:text-slate-400"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-[10px] font-bold text-slate-400 hover:text-slate-600 absolute right-2.5 top-1/2 -translate-y-1/2 bg-slate-200 px-1 rounded"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Orders List / Empty State */}
      {filteredOrders.length > 0 ? (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      ) : (
        <OrderEmptyState
          isFiltered={orders.length > 0 && (searchQuery !== '' || statusFilter !== 'all')}
          onResetFilters={() => {
            setSearchQuery('');
            setStatusFilter('all');
          }}
        />
      )}
    </div>
  );
}
