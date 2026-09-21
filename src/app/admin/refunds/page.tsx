'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  RotateCcw,
  Search,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Plus,
  X,
  Building2,
  Receipt,
} from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Button } from '@/components/ui/Button';
import { useOrders } from '@/context/OrderContext';
import { useTransactions } from '@/context/TransactionContext';

interface RefundCreditNote {
  id: string;
  orderId: string;
  orderNumber?: string;
  branchName: string;
  date: string;
  amount: number;
  reason: string;
  status: 'Approved & Credited' | 'Under Inspection' | 'Rejected';
}

const INITIAL_REFUNDS: RefundCreditNote[] = [
  {
    id: 'CRN-2026-008',
    orderId: 'ORD-2026-0891',
    orderNumber: 'ORD-2026-0891',
    branchName: 'The Aditya Birla Public School, Kharia Khangarh',
    date: '18 Sep 2026',
    amount: 1450,
    reason: '6 copies Class 10 Science received with spine binding defect',
    status: 'Approved & Credited',
  },
  {
    id: 'CRN-2026-007',
    orderId: 'ORD-2026-0889',
    orderNumber: 'ORD-2026-0889',
    branchName: 'The Aditya Birla Public School, Renukoot',
    date: '12 Sep 2026',
    amount: 3200,
    reason: 'Surplus unassigned textbooks returned in original bundle wrap',
    status: 'Approved & Credited',
  },
];

export default function AdminRefundsPage() {
  const { orders, updateOrderPaymentStatus } = useOrders();
  const { recordTransaction } = useTransactions();
  const [search, setSearch] = useState('');
  const [refunds, setRefunds] = useState<RefundCreditNote[]>(INITIAL_REFUNDS);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State for new refund
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [refundAmount, setRefundAmount] = useState<number>(0);
  const [refundReason, setRefundReason] = useState('');

  const eligibleOrders = orders.filter((o) => o.paymentStatus === 'Paid' || o.paymentStatus === 'Partial');

  const handleOrderChange = (orderId: string) => {
    setSelectedOrderId(orderId);
    const ord = orders.find((o) => o.id === orderId);
    if (ord) {
      setRefundAmount(ord.totalAmount);
    }
  };

  const handleCreateRefund = (e: React.FormEvent) => {
    e.preventDefault();
    const ord = orders.find((o) => o.id === selectedOrderId);
    if (!ord || refundAmount <= 0) return;

    const crnId = `CRN-2026-${String(refunds.length + 10).padStart(3, '0')}`;
    const newRefund: RefundCreditNote = {
      id: crnId,
      orderId: ord.id,
      orderNumber: ord.orderNumber || ord.id,
      branchName: ord.branchName,
      date: new Date().toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }),
      amount: refundAmount,
      reason: refundReason || 'Institutional surplus / damage return credit note',
      status: 'Approved & Credited',
    };

    setRefunds([newRefund, ...refunds]);

    // Update order payment status
    const newStatus = refundAmount >= ord.totalAmount ? 'Refunded' : 'Partially Refunded';
    updateOrderPaymentStatus(ord.id, newStatus);

    // Record in unified transaction ledger
    recordTransaction({
      orderId: ord.id,
      orderNumber: ord.orderNumber,
      customerName: ord.customerName,
      branchName: ord.branchName,
      amount: refundAmount,
      currency: 'INR',
      paymentMethod: ord.paymentMethod || 'Institutional Credit Note',
      referenceNumber: `REF-${crnId}`,
      status: 'Successful',
      type: 'Refund',
      provider: 'Internal Treasury Credit',
      notes: refundReason,
    });

    setIsModalOpen(false);
    setSelectedOrderId('');
    setRefundAmount(0);
    setRefundReason('');
  };

  const filtered = refunds.filter(
    (r) =>
      r.id.toLowerCase().includes(search.toLowerCase()) ||
      r.branchName.toLowerCase().includes(search.toLowerCase()) ||
      r.orderId.toLowerCase().includes(search.toLowerCase()) ||
      (r.orderNumber && r.orderNumber.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: 'Credit Notes & Damaged Returns' }]} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
            Credit Notes &amp; Returns Adjustments
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Credit notes issued to school accounts for damaged press copies or syllabus surplus returns
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => setIsModalOpen(true)}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Issue Credit Note
        </Button>
      </div>

      {/* Search Filter */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search by Credit Note ID, Order ID, or Campus..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>
      </div>

      {/* Refunds Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">Credit Note ID &amp; Date</th>
                <th className="py-3 px-3">School Branch Campus</th>
                <th className="py-3 px-3">Order Ref</th>
                <th className="py-3 px-3 text-right">Credit Value</th>
                <th className="py-3 px-4">Reason / Discrepancy</th>
                <th className="py-3 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3.5 px-4">
                    <span className="font-bold text-slate-900 block font-mono">{r.id}</span>
                    <span className="text-[11px] text-slate-400">{r.date}</span>
                  </td>
                  <td className="py-3.5 px-3 font-semibold text-slate-800">{r.branchName}</td>
                  <td className="py-3.5 px-3 font-mono text-slate-600">
                    <Link href={`/admin/orders/${r.orderId}`} className="text-emerald-800 hover:underline">
                      {r.orderNumber || r.orderId}
                    </Link>
                  </td>
                  <td className="py-3.5 px-3 text-right font-mono font-bold text-amber-700 text-sm">
                    ₹{r.amount.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 max-w-sm truncate">{r.reason}</td>
                  <td className="py-3.5 px-3">
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 inline-flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      {r.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Issue Credit Note */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center">
                  <Receipt className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Issue Institutional Credit Note</h3>
                  <p className="text-xs text-slate-500">Record refund or damaged stock allowance against an order</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateRefund} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Select Paid Order / Indent:
                </label>
                <select
                  required
                  value={selectedOrderId}
                  onChange={(e) => handleOrderChange(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600"
                >
                  <option value="">-- Choose an Order --</option>
                  {eligibleOrders.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.orderNumber || o.id} — {o.branchName} (₹{o.totalAmount})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Credit / Refund Amount (₹):
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  value={refundAmount || ''}
                  onChange={(e) => setRefundAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Reason for Credit Note / Return:
                </label>
                <textarea
                  required
                  rows={3}
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  placeholder="e.g. 5 copies returned with misprinted chapters / courier damage."
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={!selectedOrderId || refundAmount <= 0}
                >
                  Confirm &amp; Record Credit Note
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
