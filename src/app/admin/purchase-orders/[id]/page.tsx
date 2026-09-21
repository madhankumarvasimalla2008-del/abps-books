'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  FileText,
  ArrowLeft,
  Building2,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Truck,
  IndianRupee,
  BookOpen,
  Package,
  PackageCheck,
  PackageX,
  Edit3,
  Send,
  ExternalLink,
  Info,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';
import { usePurchaseOrders } from '@/context/PurchaseOrderContext';
import { useSuppliers } from '@/context/SupplierContext';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { PurchaseOrder } from '@/types';

export default function PurchaseOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const rawId = Array.isArray(params?.id) ? params.id[0] : params?.id;

  const {
    getPurchaseOrder,
    updatePurchaseOrderStatus,
    updateReceivedQuantity,
    updatePurchaseOrder,
    cancelPurchaseOrder,
  } = usePurchaseOrders();
  const { suppliers } = useSuppliers();

  const po = useMemo(() => {
    return rawId ? getPurchaseOrder(rawId) : undefined;
  }, [rawId, getPurchaseOrder]);

  const matchedSupplier = useMemo(() => {
    if (!po) return undefined;
    return suppliers.find((s) => s.id === po.supplierId);
  }, [po, suppliers]);

  // Modals state
  const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isEditNotesModalOpen, setIsEditNotesModalOpen] = useState(false);

  // Partial receiving form state
  const [receivingItems, setReceivingItems] = useState<{ [productId: string]: number }>({});
  const [cancelReason, setCancelReason] = useState('');
  const [editedNotes, setEditedNotes] = useState('');
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  if (!po) {
    return (
      <div className="space-y-6">
        <div className="bg-white p-12 rounded-2xl border border-slate-200/80 shadow-xs text-center space-y-4">
          <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto">
            <PackageX className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Purchase Order Not Found</h2>
            <p className="text-xs text-slate-500 mt-1">
              The purchase order indent reference &ldquo;{rawId}&rdquo; does not exist in administrative records.
            </p>
          </div>
          <div>
            <Link
              href="/admin/purchase-orders"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Return to Purchase Orders
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Calculations
  const totalOrderedUnits = po.items.reduce((acc, item) => acc + item.quantityOrdered, 0);
  const totalReceivedUnits = po.items.reduce((acc, item) => acc + (item.quantityReceived || 0), 0);
  const fulfillmentPercentage =
    totalOrderedUnits > 0 ? Math.round((totalReceivedUnits / totalOrderedUnits) * 100) : 0;

  const handleSendToSupplier = () => {
    const res = updatePurchaseOrderStatus(po.id, 'Sent');
    if (res.success) {
      setActionSuccess('Purchase order status updated to "Sent" to supplier.');
      setTimeout(() => setActionSuccess(null), 3500);
    }
  };

  const handleMarkComplete = () => {
    const res = updatePurchaseOrderStatus(po.id, 'Completed');
    if (res.success) {
      setActionSuccess('Purchase order marked as Completed. All line items marked fulfilled.');
      setTimeout(() => setActionSuccess(null), 3500);
    }
  };

  const handleOpenReceiveModal = () => {
    const initial: { [productId: string]: number } = {};
    po.items.forEach((item) => {
      initial[item.productId] = item.quantityReceived || 0;
    });
    setReceivingItems(initial);
    setIsReceiveModalOpen(true);
  };

  const handleSaveReceivedQuantities = (e: React.FormEvent) => {
    e.preventDefault();
    Object.entries(receivingItems).forEach(([productId, qty]) => {
      updateReceivedQuantity(po.id, productId, qty);
    });
    setIsReceiveModalOpen(false);
    setActionSuccess('Received item quantities successfully recorded.');
    setTimeout(() => setActionSuccess(null), 3500);
  };

  const handleConfirmCancel = (e: React.FormEvent) => {
    e.preventDefault();
    const res = cancelPurchaseOrder(po.id, cancelReason);
    if (res.success) {
      setIsCancelModalOpen(false);
      setCancelReason('');
      setActionSuccess('Purchase order has been marked as Cancelled.');
      setTimeout(() => setActionSuccess(null), 3500);
    }
  };

  const handleOpenEditNotes = () => {
    setEditedNotes(po.notes || '');
    setIsEditNotesModalOpen(true);
  };

  const handleSaveNotes = (e: React.FormEvent) => {
    e.preventDefault();
    updatePurchaseOrder(po.id, { notes: editedNotes });
    setIsEditNotesModalOpen(false);
    setActionSuccess('Purchase order notes updated.');
    setTimeout(() => setActionSuccess(null), 3500);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <AdminPageHeader
        title={`Purchase Order: ${po.poNumber}`}
        description={`Procurement record placed with ${po.supplierName} on ${po.orderDate}.`}
        breadcrumbs={[
          { label: 'Purchase Orders', href: '/admin/purchase-orders' },
          { label: po.poNumber },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Link
              href="/admin/purchase-orders"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              All POs
            </Link>

            {po.status === 'Draft' && (
              <>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleSendToSupplier}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white"
                >
                  <Send className="w-3.5 h-3.5 mr-1.5" />
                  Mark as Sent
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCancelModalOpen(true)}
                  className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200"
                >
                  Cancel PO
                </Button>
              </>
            )}

            {(po.status === 'Sent' || po.status === 'Partially Received') && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleOpenReceiveModal}
                  className="text-emerald-700 border-emerald-300 hover:bg-emerald-50"
                >
                  <PackageCheck className="w-3.5 h-3.5 mr-1.5" />
                  Record Received Stock
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleMarkComplete}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                  Mark as Completed
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCancelModalOpen(true)}
                  className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200"
                >
                  Cancel PO
                </Button>
              </>
            )}
          </div>
        }
      />

      {/* Success Banner */}
      {actionSuccess && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between text-emerald-800 text-xs shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-medium">{actionSuccess}</span>
          </div>
          <button
            onClick={() => setActionSuccess(null)}
            className="text-emerald-600 hover:text-emerald-900 font-bold"
          >
            ×
          </button>
        </div>
      )}

      {/* Top Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Supplier Info */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              Supplier / Publisher
            </span>
            {matchedSupplier && (
              <Link
                href={`/admin/suppliers/${matchedSupplier.id}`}
                className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-0.5"
              >
                Profile <ExternalLink className="w-2.5 h-2.5" />
              </Link>
            )}
          </div>

          <div>
            <h3 className="text-base font-bold text-slate-900">{po.supplierName}</h3>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              Code: {matchedSupplier?.code || po.supplierId}
            </p>
          </div>

          <div className="pt-2 border-t border-slate-100 text-xs space-y-1 text-slate-600">
            {matchedSupplier ? (
              <>
                <p>
                  <strong className="text-slate-700 font-medium">Contact:</strong>{' '}
                  {matchedSupplier.contactPerson}
                </p>
                <p>
                  <strong className="text-slate-700 font-medium">Email:</strong> {matchedSupplier.email}
                </p>
                <p>
                  <strong className="text-slate-700 font-medium">Location:</strong> {matchedSupplier.city}
                  , {matchedSupplier.state}
                </p>
              </>
            ) : (
              <p className="text-slate-400 italic">Direct publisher / vendor snapshot</p>
            )}
          </div>
        </div>

        {/* Order Dates & Timeline */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              Procurement Timeline
            </span>
            <StatusBadge status={po.status} />
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="space-y-0.5">
              <p className="text-[10px] uppercase font-semibold text-slate-400">Order Placed Date</p>
              <p className="text-xs font-bold text-slate-900">{po.orderDate}</p>
            </div>
            <div className="space-y-0.5">
              <p className="text-[10px] uppercase font-semibold text-slate-400">Expected Delivery</p>
              <p className="text-xs font-bold text-slate-900">{po.expectedDeliveryDate}</p>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 text-xs space-y-1">
            <div className="flex justify-between items-center text-slate-600">
              <span>Actual Received Date:</span>
              <strong className={po.receivedDate ? 'text-emerald-700 font-semibold' : 'text-slate-400'}>
                {po.receivedDate || 'Pending Delivery'}
              </strong>
            </div>
          </div>
        </div>

        {/* Fulfillment & Valuation */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <IndianRupee className="w-3.5 h-3.5 text-slate-400" />
              Valuation & Fulfillment
            </span>
            <span className="text-xs font-mono font-bold text-slate-900">
              {fulfillmentPercentage}% Fulfilled
            </span>
          </div>

          <div>
            <p className="text-2xl font-bold font-mono text-slate-900">
              ₹{po.totalCost.toLocaleString('en-IN')}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              {totalReceivedUnits} of {totalOrderedUnits} units received
            </p>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                po.status === 'Completed'
                  ? 'bg-emerald-600'
                  : po.status === 'Cancelled'
                  ? 'bg-rose-500'
                  : 'bg-amber-500'
              }`}
              style={{ width: `${fulfillmentPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Scope Boundary Notice */}
      <div className="bg-slate-100/80 border border-slate-200 rounded-2xl p-4 flex items-start gap-3 text-xs text-slate-600">
        <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <p className="font-semibold text-slate-800">
            Administrative Inventory & Historical Snapshot Boundary
          </p>
          <p className="text-slate-500">
            Purchase orders serve as procurement records. Modifying status or recording received quantities does
            not mutate warehouse inventory counts automatically. Item titles, ISBNs, publishers, and unit costs
            are permanently preserved as historical snapshots from the order date.
          </p>
        </div>
      </div>

      {/* Line Items Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-emerald-700" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Procurement Line Items ({po.items.length})
            </h3>
          </div>
          {(po.status === 'Sent' || po.status === 'Partially Received') && (
            <button
              type="button"
              onClick={handleOpenReceiveModal}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
            >
              <Edit3 className="w-3.5 h-3.5" />
              Update Received Counts
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-4">#</th>
                <th className="py-3 px-4">Book Title / Snapshot</th>
                <th className="py-3 px-4">ISBN</th>
                <th className="py-3 px-4">Publisher</th>
                <th className="py-3 px-4 text-right">Unit Cost</th>
                <th className="py-3 px-4 text-center">Ordered</th>
                <th className="py-3 px-4 text-center">Received</th>
                <th className="py-3 px-4 text-right">Line Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {po.items.map((item, idx) => (
                <tr key={item.productId || idx} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3.5 px-4 font-mono text-slate-400">{idx + 1}</td>
                  <td className="py-3.5 px-4 font-semibold text-slate-900">
                    <div className="flex flex-col">
                      <span>{item.productTitle}</span>
                      <span className="text-[10px] font-mono text-slate-400 font-normal">
                        Item ID: {item.productId}
                      </span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-600">{item.isbn}</td>
                  <td className="py-3.5 px-4 text-slate-700">{item.publisher}</td>
                  <td className="py-3.5 px-4 text-right font-mono font-medium text-slate-900">
                    ₹{item.unitCost.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3.5 px-4 text-center font-mono font-semibold text-slate-800">
                    {item.quantityOrdered}
                  </td>
                  <td className="py-3.5 px-4 text-center font-mono">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-md font-bold text-xs ${
                        item.quantityReceived >= item.quantityOrdered
                          ? 'bg-emerald-50 text-emerald-700'
                          : item.quantityReceived > 0
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {item.quantityReceived || 0}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                    ₹{item.totalCost.toLocaleString('en-IN')}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-slate-50/90 border-t border-slate-200 font-semibold text-xs text-slate-900">
                <td colSpan={5} className="py-3.5 px-4 text-right uppercase tracking-wider text-slate-500">
                  Total Procurement Summary:
                </td>
                <td className="py-3.5 px-4 text-center font-mono font-bold">{totalOrderedUnits}</td>
                <td className="py-3.5 px-4 text-center font-mono font-bold text-emerald-700">
                  {totalReceivedUnits}
                </td>
                <td className="py-3.5 px-4 text-right font-mono font-bold text-base text-emerald-800">
                  ₹{po.totalCost.toLocaleString('en-IN')}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Notes & Operational Remarks */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Order Notes
          </h4>
          <button
            type="button"
            onClick={handleOpenEditNotes}
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
          >
            <Edit3 className="w-3 h-3" />
            Edit Notes
          </button>
        </div>
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-700">
          {po.notes ? (
            <p className="whitespace-pre-line leading-relaxed">{po.notes}</p>
          ) : (
            <p className="text-slate-400 italic">No special instructions or remarks recorded for this purchase order.</p>
          )}
        </div>
      </div>

      {/* Record Received Quantities Modal */}
      <Modal
        isOpen={isReceiveModalOpen}
        onClose={() => setIsReceiveModalOpen(false)}
        title="Record Received Stock Quantities"
        description="Update the physical quantity of books delivered and verified against this purchase order."
        maxWidth="lg"
      >
        <form onSubmit={handleSaveReceivedQuantities} className="space-y-4">
          <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
            {po.items.map((item) => (
              <div
                key={item.productId}
                className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-4"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-900 truncate">{item.productTitle}</p>
                  <p className="text-[10px] text-slate-500 font-mono">
                    Ordered: {item.quantityOrdered} units | ISBN: {item.isbn}
                  </p>
                </div>

                <div className="w-32">
                  <label className="block text-[10px] font-semibold text-slate-600 mb-0.5 text-right">
                    Quantity Received
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={item.quantityOrdered}
                    value={receivingItems[item.productId] ?? item.quantityReceived ?? 0}
                    onChange={(e) =>
                      setReceivingItems({
                        ...receivingItems,
                        [item.productId]: Math.min(
                          item.quantityOrdered,
                          Math.max(0, parseInt(e.target.value) || 0)
                        ),
                      })
                    }
                    className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 font-mono text-right focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsReceiveModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              className="bg-emerald-700 hover:bg-emerald-800 text-white"
            >
              Save Received Quantities
            </Button>
          </div>
        </form>
      </Modal>

      {/* Cancel PO Modal */}
      <Modal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        title="Cancel Purchase Order"
        description={`Are you sure you want to cancel purchase order ${po.poNumber}?`}
        maxWidth="md"
      >
        <form onSubmit={handleConfirmCancel} className="space-y-4">
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-rose-800 text-xs">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
            <span>
              Cancelling this purchase order marks the indent as void. This action records the cancellation reason for audit purposes.
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Cancellation Reason (Optional)
            </label>
            <textarea
              rows={3}
              placeholder="e.g. Publisher out of stock, curriculum revision, duplicate indent..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsCancelModalOpen(false)}
            >
              Keep Order
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              className="bg-rose-600 hover:bg-rose-700 text-white"
            >
              Confirm Cancellation
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Notes Modal */}
      <Modal
        isOpen={isEditNotesModalOpen}
        onClose={() => setIsEditNotesModalOpen(false)}
        title="Edit Order Remarks"
        description="Update operational remarks and special instructions for this purchase order."
        maxWidth="md"
      >
        <form onSubmit={handleSaveNotes} className="space-y-4">
          <div>
            <textarea
              rows={4}
              value={editedNotes}
              onChange={(e) => setEditedNotes(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsEditNotesModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              className="bg-emerald-700 hover:bg-emerald-800 text-white"
            >
              Save Notes
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
