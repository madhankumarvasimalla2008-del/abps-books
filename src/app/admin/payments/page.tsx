'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  CreditCard,
  Search,
  Filter,
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  AlertCircle,
  Building2,
  RefreshCw,
} from 'lucide-react';
import { useOrders } from '@/context/OrderContext';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Button, buttonVariants } from '@/components/ui/Button';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { StatCard } from '@/components/ui/StatCard';
import { PaymentStatus } from '@/types';

export default function AdminPaymentsPage() {
  const { orders } = useOrders();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | PaymentStatus>('all');
  const [methodFilter, setMethodFilter] = useState<string>('all');

  const totalCollected = orders
    .filter((o) => o.paymentStatus === 'Paid')
    .reduce((s, o) => s + o.totalAmount, 0);

  const totalPending = orders
    .filter((o) => o.paymentStatus === 'Pending' || o.paymentStatus === 'Processing')
    .reduce((s, o) => s + o.totalAmount, 0);

  const totalRefunded = orders
    .filter((o) => o.paymentStatus === 'Refunded' || o.paymentStatus === 'Partially Refunded')
    .reduce((s, o) => s + o.totalAmount, 0);

  const filtered = orders.filter((o) => {
    const q = search.toLowerCase();
    const matchSearch =
      q === '' ||
      o.id.toLowerCase().includes(q) ||
      (o.orderNumber && o.orderNumber.toLowerCase().includes(q)) ||
      o.branchName.toLowerCase().includes(q) ||
      (o.paymentReference && o.paymentReference.toLowerCase().includes(q));

    const matchStatus = statusFilter === 'all' || o.paymentStatus === statusFilter;
    const matchMethod = methodFilter === 'all' || o.paymentMethod === methodFilter;

    return matchSearch && matchStatus && matchMethod;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
            Payments &amp; Transactions Overview
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitor digital gateway payments (UPI, Cards, Net Banking) and pending orders across school branches
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/payments/transactions"
            className={buttonVariants({
              variant: 'outline',
              size: 'sm',
              className: 'gap-1.5',
            })}
          >
            <CreditCard className="w-4 h-4" />
            <span>Transaction Logs</span>
          </Link>
          <Button variant="primary" size="sm" leftIcon={<FileSpreadsheet className="w-4 h-4" />}>
            Export Financial Report
          </Button>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Paid Payments"
          value={`₹${totalCollected.toLocaleString('en-IN')}`}
          change={{ value: 'Cleared via UPI / Cards / Net Banking', positive: true }}
          icon={<CheckCircle2 className="w-5 h-5 text-emerald-700" />}
        />
        <StatCard
          title="Pending Payments"
          value={`₹${totalPending.toLocaleString('en-IN')}`}
          change={{ value: 'Pending payment or verification', positive: false }}
          icon={<Clock className="w-5 h-5 text-amber-600" />}
        />
        <StatCard
          title="Payment Volume"
          value={orders.length.toString()}
          change={{ value: `${orders.filter((o) => o.paymentStatus === 'Paid').length} paid successfully`, positive: true }}
          icon={<CreditCard className="w-5 h-5 text-blue-700" />}
        />
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative flex-1 w-full">
          <input
            type="text"
            placeholder="Search by Order ID, Branch, or Payment Ref..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>

        <div className="flex items-center gap-1.5 flex-wrap w-full sm:w-auto">
          {(['all', 'Paid', 'Pending', 'Failed', 'Cancelled', 'Refunded'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl capitalize transition-colors ${
                statusFilter === st
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Payment Ledger Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">Order Ref &amp; Date</th>
                <th className="py-3 px-3">School Branch</th>
                <th className="py-3 px-3">Payment Method</th>
                <th className="py-3 px-3">Payment Ref</th>
                <th className="py-3 px-3 text-right">Invoiced Amount</th>
                <th className="py-3 px-3">Payment Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No orders matching your payment filter.
                  </td>
                </tr>
              ) : (
                filtered.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 px-4">
                      <span className="font-mono font-bold text-slate-900 block">
                        {o.orderNumber || o.id}
                      </span>
                      <span className="text-[10px] text-slate-400">{o.createdAt}</span>
                    </td>
                    <td className="py-3.5 px-3 font-semibold text-slate-800">{o.branchName}</td>
                    <td className="py-3.5 px-3 text-slate-600">
                      <span className="font-medium text-slate-700">{o.paymentMethod || 'Online / UPI'}</span>
                      {o.upiSubMethod && (
                        <span className="block text-[10px] text-slate-400 capitalize">
                          UPI {o.upiSubMethod}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-3 font-mono text-[11px] text-slate-600">
                      {o.paymentReference || '—'}
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono font-bold text-slate-900">
                      ₹{o.totalAmount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-3">
                      <StatusBadge status={o.paymentStatus} type="payment" />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        href={`/admin/orders/${o.id}`}
                        className={buttonVariants({
                          variant: 'outline',
                          size: 'sm',
                        })}
                      >
                        View Order
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
