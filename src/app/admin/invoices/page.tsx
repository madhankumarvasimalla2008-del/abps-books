'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  FileText,
  Search,
  Download,
  Printer,
  Eye,
  CheckCircle2,
  Calendar,
  Building2,
} from 'lucide-react';
import { MOCK_ORDERS } from '@/data/mockData';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Button, buttonVariants } from '@/components/ui/Button';

export default function AdminInvoicesPage() {
  const [search, setSearch] = useState('');

  const invoices = MOCK_ORDERS.map((o, idx) => ({
    id: `INV-2026-${(idx + 101).toString()}`,
    orderId: o.id,
    branchName: o.branchName,
    date: new Date(o.createdAt).toLocaleDateString('en-IN'),
    subtotal: o.totalAmount + o.discountAmount,
    discount: o.discountAmount,
    total: o.totalAmount,
    gstExempt: true,
    status: o.paymentStatus === 'Paid' ? 'Settled' : 'Pending Payment',
  }));

  const filtered = invoices.filter(
    (inv) =>
      inv.id.toLowerCase().includes(search.toLowerCase()) ||
      inv.branchName.toLowerCase().includes(search.toLowerCase()) ||
      inv.orderId.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: 'Institutional Invoices & GST Notes' }]} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
            Institutional Tax Invoices
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            GST-exempt educational textbook supply invoices and institutional billing records
          </p>
        </div>

        <Button variant="outline" size="sm" leftIcon={<Download className="w-4 h-4" />}>
          Export Invoices ZIP
        </Button>
      </div>

      {/* Search Filter */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search by Invoice ID, Order ID, or School Campus..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">Invoice ID & Date</th>
                <th className="py-3 px-3">School Branch Campus</th>
                <th className="py-3 px-3">Order Ref</th>
                <th className="py-3 px-3 text-right">Taxable Gross</th>
                <th className="py-3 px-3 text-right">Rebate Discount</th>
                <th className="py-3 px-3 text-right">Net Billed</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3.5 px-4">
                    <span className="font-bold text-slate-900 block font-mono">{inv.id}</span>
                    <span className="text-[11px] text-slate-400">{inv.date}</span>
                  </td>
                  <td className="py-3.5 px-3 font-semibold text-slate-800">{inv.branchName}</td>
                  <td className="py-3.5 px-3 font-mono text-slate-500">{inv.orderId}</td>
                  <td className="py-3.5 px-3 text-right font-mono text-slate-500">
                    ₹{inv.subtotal.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3.5 px-3 text-right font-mono text-emerald-800 font-semibold">
                    -₹{inv.discount.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3.5 px-3 text-right font-mono font-bold text-slate-900 text-sm">
                    ₹{inv.total.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3.5 px-3">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                        inv.status === 'Settled'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : 'bg-amber-50 text-amber-800 border-amber-200'
                      }`}
                    >
                      {inv.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Link
                        href={`/orders/${inv.orderId}`}
                        target="_blank"
                        className={buttonVariants({
                          variant: 'outline',
                          size: 'sm',
                          className: 'gap-1.5',
                        })}
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Print</span>
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
