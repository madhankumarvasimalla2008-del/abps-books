'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  CreditCard,
  Search,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  FileSpreadsheet,
  ArrowDownLeft,
  ArrowUpRight,
  ShieldCheck,
} from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Button } from '@/components/ui/Button';
import { useTransactions } from '@/context/TransactionContext';

export default function BankTransactionsPage() {
  const { transactions } = useTransactions();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'Payment' | 'Refund'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Successful' | 'Pending' | 'Failed'>('all');

  const filtered = transactions.filter((t) => {
    const q = search.toLowerCase();
    const matchSearch =
      q === '' ||
      t.referenceNumber.toLowerCase().includes(q) ||
      t.orderId.toLowerCase().includes(q) ||
      (t.orderNumber && t.orderNumber.toLowerCase().includes(q)) ||
      (t.branchName && t.branchName.toLowerCase().includes(q)) ||
      (t.customerName && t.customerName.toLowerCase().includes(q));

    const matchType = typeFilter === 'all' || t.type === typeFilter;
    const matchStatus = statusFilter === 'all' || t.status === statusFilter;

    return matchSearch && matchType && matchStatus;
  });

  const totalSuccessfulAmount = transactions
    .filter((t) => t.status === 'Successful' && t.type === 'Payment')
    .reduce((s, t) => s + t.amount, 0);

  const totalRefundAmount = transactions
    .filter((t) => t.status === 'Successful' && t.type === 'Refund')
    .reduce((s, t) => s + t.amount, 0);

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: 'Payments & Settlement', href: '/admin/payments' },
          { label: 'Bank Transaction Logs' },
        ]}
      />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
            Unified Transaction &amp; Settlement Ledger
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit logs for all incoming UPI/Card/Bank collections and outgoing institutional refund adjustments
          </p>
        </div>

        <Button variant="outline" size="sm" leftIcon={<FileSpreadsheet className="w-4 h-4" />}>
          Export Bank Ledger
        </Button>
      </div>

      {/* Summary Chips */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="text-xs text-slate-500 font-medium">Total Inflow Settled</div>
          <div className="text-xl font-bold text-slate-900 font-mono mt-1">
            ₹{totalSuccessfulAmount.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-emerald-700 flex items-center gap-1 mt-1 font-semibold">
            <ArrowDownLeft className="w-3.5 h-3.5" /> Customer Inward Collections
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="text-xs text-slate-500 font-medium">Total Credit / Refund Outflow</div>
          <div className="text-xl font-bold text-slate-900 font-mono mt-1">
            ₹{totalRefundAmount.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-amber-700 flex items-center gap-1 mt-1 font-semibold">
            <ArrowUpRight className="w-3.5 h-3.5" /> Returns &amp; Discrepancy Adjustments
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="text-xs text-slate-500 font-medium">Recorded Log Entries</div>
          <div className="text-xl font-bold text-slate-900 font-mono mt-1">
            {transactions.length}
          </div>
          <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" /> Unified Transaction Ledger
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative flex-1 w-full">
          <input
            type="text"
            placeholder="Search by Reference, Order, Branch, or Customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>

        <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
          {/* Type Filter */}
          <div className="flex items-center gap-1">
            {(['all', 'Payment', 'Refund'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-xl capitalize transition-colors ${
                  typeFilter === t
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">Txn Reference &amp; Date</th>
                <th className="py-3 px-3">Order / Indent</th>
                <th className="py-3 px-3">Branch &amp; Customer</th>
                <th className="py-3 px-3">Channel / Provider</th>
                <th className="py-3 px-3 text-right">Amount</th>
                <th className="py-3 px-3">Type</th>
                <th className="py-3 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No transactions found matching your criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-slate-900 block font-mono">
                        {t.referenceNumber}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(t.createdAt).toLocaleString('en-IN', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </td>
                    <td className="py-3.5 px-3">
                      <Link
                        href={`/admin/orders/${t.orderId}`}
                        className="font-mono font-bold text-emerald-800 hover:underline"
                      >
                        {t.orderNumber || t.orderId}
                      </Link>
                    </td>
                    <td className="py-3.5 px-3">
                      <span className="font-semibold text-slate-800 block">
                        {t.branchName || 'Central Branch'}
                      </span>
                      {t.customerName && (
                        <span className="text-[10px] text-slate-500">{t.customerName}</span>
                      )}
                    </td>
                    <td className="py-3.5 px-3 text-slate-600">
                      <span className="font-medium text-slate-700 block">{t.paymentMethod}</span>
                      <span className="text-[10px] text-slate-400">{t.provider}</span>
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono font-bold text-sm">
                      <span className={t.type === 'Refund' ? 'text-amber-700' : 'text-emerald-800'}>
                        {t.type === 'Refund' ? '-' : '+'}₹{t.amount.toLocaleString('en-IN')}
                      </span>
                    </td>
                    <td className="py-3.5 px-3">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          t.type === 'Refund'
                            ? 'bg-amber-50 text-amber-800 border border-amber-200'
                            : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        }`}
                      >
                        {t.type}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded border inline-flex items-center gap-1 ${
                          t.status === 'Successful'
                            ? 'text-emerald-800 bg-emerald-50 border-emerald-200'
                            : t.status === 'Failed'
                            ? 'text-rose-700 bg-rose-50 border-rose-200'
                            : 'text-amber-700 bg-amber-50 border-amber-200'
                        }`}
                      >
                        {t.status === 'Successful' && <CheckCircle2 className="w-3 h-3" />}
                        {t.status === 'Failed' && <XCircle className="w-3 h-3" />}
                        {t.status === 'Pending' && <Clock className="w-3 h-3" />}
                        {t.status}
                      </span>
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
