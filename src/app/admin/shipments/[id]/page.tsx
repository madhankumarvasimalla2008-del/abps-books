'use client';

import React, { use, useState } from 'react';
import Link from 'next/link';
import {
  Truck,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  MapPin,
  Package,
  FileText,
  User,
  ExternalLink,
  ArrowLeft,
  AlertCircle,
  Plus,
  Edit3,
  ShieldCheck,
  RotateCcw,
} from 'lucide-react';
import { useShipments } from '@/context/ShipmentContext';
import { useOrders } from '@/context/OrderContext';
import { ShipmentStatus } from '@/types';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';

const SHIPMENT_STATUSES: ShipmentStatus[] = [
  'Created',
  'In Transit',
  'Out for Delivery',
  'Delivered',
  'Delayed',
  'Returned',
];

export default function AdminShipmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const shipmentId = resolvedParams.id;

  const { getShipment, updateShipmentStatus, addShipmentMilestone } = useShipments();
  const { getOrder } = useOrders();

  const shipment = getShipment(shipmentId);
  const linkedOrder = shipment ? getOrder(shipment.orderId) : undefined;

  // Status Update Modal State
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<ShipmentStatus>('In Transit');
  const [statusLocation, setStatusLocation] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Add Milestone Modal State
  const [isMilestoneModalOpen, setIsMilestoneModalOpen] = useState(false);
  const [milestoneTitle, setMilestoneTitle] = useState('');
  const [milestoneLocation, setMilestoneLocation] = useState('');
  const [milestoneTimestamp, setMilestoneTimestamp] = useState(
    new Date().toISOString().replace('T', ' ').substring(0, 16)
  );
  const [milestoneNotes, setMilestoneNotes] = useState('');
  const [isAddingMilestone, setIsAddingMilestone] = useState(false);

  // Feedback notifications
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  if (!shipment) {
    return (
      <div className="space-y-6">
        <AdminPageHeader
          title="Shipment Not Found"
          breadcrumbs={[
            { label: 'Shipments', href: '/admin/shipments' },
            { label: 'Not Found' },
          ]}
        />
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center max-w-lg mx-auto space-y-4">
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-slate-900">Shipment Record Not Found</h2>
          <p className="text-xs text-slate-500">
            No shipment record exists matching the ID or tracking number &quot;{shipmentId}&quot;. It may have been reset or removed.
          </p>
          <Link href="/admin/shipments">
            <Button variant="primary" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
              Back to Shipments Directory
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const handleOpenStatusModal = () => {
    setNewStatus(shipment.status);
    setStatusLocation(shipment.destinationCity ? `${shipment.destinationCity} Logistics Hub` : '');
    setStatusNote('');
    setIsStatusModalOpen(true);
  };

  const handleUpdateStatusSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingStatus(true);
    const result = updateShipmentStatus(
      shipment.id,
      newStatus,
      statusNote.trim() || undefined,
      statusLocation.trim() || undefined
    );
    setIsUpdatingStatus(false);
    if (result.success) {
      setIsStatusModalOpen(false);
      setActionSuccess(`Shipment status updated to ${newStatus}.`);
      setTimeout(() => setActionSuccess(null), 4000);
    }
  };

  const handleOpenMilestoneModal = () => {
    setMilestoneTitle('');
    setMilestoneLocation(shipment.destinationCity ? `${shipment.destinationCity} Hub` : '');
    setMilestoneTimestamp(new Date().toISOString().replace('T', ' ').substring(0, 16));
    setMilestoneNotes('');
    setIsMilestoneModalOpen(true);
  };

  const handleAddMilestoneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!milestoneTitle.trim()) return;

    setIsAddingMilestone(true);
    const result = addShipmentMilestone(shipment.id, {
      title: milestoneTitle.trim(),
      location: milestoneLocation.trim() || undefined,
      timestamp: milestoneTimestamp,
      notes: milestoneNotes.trim() || undefined,
      completed: true,
    });
    setIsAddingMilestone(false);
    if (result.success) {
      setIsMilestoneModalOpen(false);
      setActionSuccess('New operational milestone added to audit history.');
      setTimeout(() => setActionSuccess(null), 4000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <AdminPageHeader
        title={shipment.shipmentNumber}
        description={`Operational shipment record for ${shipment.branchName}`}
        badge={<StatusBadge status={shipment.status} type="shipment" />}
        breadcrumbs={[
          { label: 'Shipments', href: '/admin/shipments' },
          { label: shipment.shipmentNumber },
        ]}
        actions={
          <div className="flex items-center gap-2.5 flex-wrap">
            <Link href={`/tracking?trackingNumber=${shipment.trackingNumber}`} target="_blank">
              <Button
                variant="outline"
                size="sm"
                leftIcon={<ExternalLink className="w-3.5 h-3.5" />}
                title="View customer-facing tracking page"
              >
                Customer Tracking
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Plus className="w-3.5 h-3.5" />}
              onClick={handleOpenMilestoneModal}
            >
              Add Milestone
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Edit3 className="w-3.5 h-3.5" />}
              onClick={handleOpenStatusModal}
            >
              Update Status
            </Button>
          </div>
        }
      />

      {/* Success Banner */}
      {actionSuccess && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2 shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Top Shipment Snapshot Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4.5 rounded-xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Carrier Partner
          </span>
          <div className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
            <Truck className="w-4 h-4 text-emerald-700 shrink-0" />
            {shipment.carrier}
          </div>
          <div className="font-mono text-xs text-slate-600">
            Tracking #: <strong className="text-slate-900">{shipment.trackingNumber}</strong>
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Shipment Volume
          </span>
          <div className="text-sm font-bold text-slate-900 flex items-center gap-1.5 font-mono">
            <Package className="w-4 h-4 text-emerald-700 shrink-0" />
            {shipment.totalPackages} {shipment.totalPackages === 1 ? 'Package' : 'Packages'}
          </div>
          <div className="font-mono text-xs text-slate-600">
            Gross Wt: <strong className="text-slate-900">{shipment.totalWeightKg} kg</strong>
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Dispatch & ETA
          </span>
          <div className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            Dispatched: {new Date(shipment.dispatchDate).toLocaleDateString('en-IN')}
          </div>
          <div className="text-xs text-slate-600">
            {shipment.status === 'Delivered' && shipment.deliveredDate ? (
              <span className="text-emerald-700 font-semibold">
                Delivered on {new Date(shipment.deliveredDate).toLocaleDateString('en-IN')}
              </span>
            ) : (
              <span>ETA: {new Date(shipment.estimatedArrival).toLocaleDateString('en-IN')}</span>
            )}
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Linked Customer Order
          </span>
          <div>
            <Link
              href={`/admin/orders/${shipment.orderId}`}
              className="text-xs font-mono font-bold text-emerald-700 hover:underline flex items-center gap-1"
            >
              <FileText className="w-3.5 h-3.5" />
              {shipment.orderNumber}
            </Link>
          </div>
          <div className="text-[11px] text-slate-500 truncate">
            {shipment.branchName}
          </div>
        </div>
      </div>

      {/* Main Grid: Left Milestone Audit Timeline, Right Destination & Order Specs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Milestone Audit History */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="font-bold text-slate-900 text-sm">
                  Shipment Milestone Timeline
                </h2>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Chronological operational transit updates recorded for this shipment
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Plus className="w-3.5 h-3.5" />}
                onClick={handleOpenMilestoneModal}
              >
                Add Milestone
              </Button>
            </div>

            {(!shipment.milestones || shipment.milestones.length === 0) ? (
              <div className="text-center py-8 text-slate-500 text-xs">
                No intermediate milestones recorded yet. Use &quot;Add Milestone&quot; to append transit updates.
              </div>
            ) : (
              <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-emerald-500">
                {shipment.milestones.map((m, idx) => (
                  <div key={m.id || idx} className="relative group">
                    <div className="absolute -left-[27px] top-1 w-4 h-4 rounded-full bg-emerald-600 border-2 border-white shadow-xs" />
                    <div className="text-xs space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-slate-900 text-xs">{m.title}</span>
                        <span className="font-mono text-[10px] text-slate-400 shrink-0">
                          {m.timestamp}
                        </span>
                      </div>
                      {m.location && (
                        <div className="text-slate-600 text-[11px] flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{m.location}</span>
                        </div>
                      )}
                      {m.notes && (
                        <div className="bg-slate-50 p-2 rounded text-[11px] text-slate-600 border border-slate-100 mt-1">
                          {m.notes}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Shipment Notes Card */}
          {shipment.notes && (
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-2 text-xs">
              <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-slate-500">
                Shipment Handling & Dispatch Notes
              </h3>
              <p className="text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-200/60">
                {shipment.notes}
              </p>
            </div>
          )}
        </div>

        {/* Right 1 Col: Destination & Recipient Snapshot */}
        <div className="space-y-6">
          {/* Destination Snapshot Card */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3.5 text-xs">
            <h2 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-2 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-slate-500" />
              Branch / Destination
            </h2>

            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                Branch / Destination
              </span>
              <p className="font-bold text-slate-900 mt-0.5">{shipment.branchName}</p>
              <p className="text-slate-600 text-xs mt-1">
                {shipment.destinationCity}, {shipment.destinationState}
              </p>
            </div>

            {linkedOrder?.deliveryAddress && (
              <div className="pt-2 border-t border-slate-100 space-y-1">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                  Full Delivery Address
                </span>
                <p className="text-slate-700">
                  {linkedOrder.deliveryAddress.addressLine1}
                  {linkedOrder.deliveryAddress.addressLine2 && `, ${linkedOrder.deliveryAddress.addressLine2}`}
                </p>
                <p className="text-slate-700">
                  {linkedOrder.deliveryAddress.city}, {linkedOrder.deliveryAddress.state} -{' '}
                  <span className="font-mono">{linkedOrder.deliveryAddress.pincode}</span>
                </p>
                {linkedOrder.deliveryAddress.contactPerson && (
                  <div className="mt-2 pt-2 border-t border-slate-100 text-[11px]">
                    <span className="text-slate-400 block text-[10px]">Contact Person:</span>
                    <p className="font-semibold text-slate-800">
                      {linkedOrder.deliveryAddress.contactPerson}
                    </p>
                    {linkedOrder.deliveryAddress.contactPhone && (
                      <p className="font-mono text-slate-500">
                        {linkedOrder.deliveryAddress.contactPhone}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Linked Order Items Preview */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h2 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <FileText className="w-4 h-4 text-slate-500" />
                Linked Order
              </h2>
              <Link
                href={`/admin/orders/${shipment.orderId}`}
                className="font-mono text-emerald-700 hover:underline font-semibold text-[11px]"
              >
                {shipment.orderNumber}
              </Link>
            </div>

            {linkedOrder?.items && linkedOrder.items.length > 0 ? (
              <div className="space-y-2">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                  Shipment Book Line Items ({linkedOrder.items.length})
                </span>
                <div className="divide-y divide-slate-100 max-h-56 overflow-y-auto pr-1">
                  {linkedOrder.items.map((item, idx) => (
                    <div key={item.id || idx} className="py-1.5 flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-800 text-[11px] truncate">
                          {item.productTitle || item.title}
                        </p>
                        <p className="text-[10px] text-slate-400 font-mono">
                          ISBN: {item.isbn} • {item.grade || 'Standard'}
                        </p>
                      </div>
                      <span className="font-mono font-bold text-slate-800 text-[11px] shrink-0">
                        {item.quantity} copies
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-slate-500 text-xs">
                Shipment is registered under order #{shipment.orderNumber}.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Status Update Modal */}
      <Modal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        title={`Update Status: ${shipment.shipmentNumber}`}
        description="Update operational transit status and log milestone checkpoint."
        maxWidth="md"
      >
        <form onSubmit={handleUpdateStatusSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Select New Transit Status <span className="text-red-500">*</span>
            </label>
            <select
              aria-label="Select New Transit Status"
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value as ShipmentStatus)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 text-slate-900"
            >
              {SHIPMENT_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Current Location / Checkpoint
            </label>
            <input
              type="text"
              placeholder="e.g. Surat Transshipment Centre, Gujarat"
              value={statusLocation}
              onChange={(e) => setStatusLocation(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 text-slate-900"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Operational Status Note
            </label>
            <textarea
              rows={2}
              placeholder="Optional remarks (e.g. handed over to last-mile delivery partner)"
              value={statusNote}
              onChange={(e) => setStatusNote(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 text-slate-900"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsStatusModalOpen(false)}
              disabled={isUpdatingStatus}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isUpdatingStatus}
            >
              Save Status
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add Milestone Modal */}
      <Modal
        isOpen={isMilestoneModalOpen}
        onClose={() => setIsMilestoneModalOpen(false)}
        title="Add Transit Milestone"
        description="Append an operational milestone to this shipment's audit timeline."
        maxWidth="md"
      >
        <form onSubmit={handleAddMilestoneSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Milestone Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Arrived at Regional Transshipment Hub"
              value={milestoneTitle}
              onChange={(e) => setMilestoneTitle(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 text-slate-900"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Location / Hub</label>
              <input
                type="text"
                placeholder="e.g. Surat Delivery Hub"
                value={milestoneLocation}
                onChange={(e) => setMilestoneLocation(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 text-slate-900"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Timestamp</label>
              <input
                type="text"
                placeholder="YYYY-MM-DD HH:MM"
                value={milestoneTimestamp}
                onChange={(e) => setMilestoneTimestamp(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 font-mono text-slate-900"
                required
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Notes / Remarks</label>
            <textarea
              rows={2}
              placeholder="Optional remarks regarding this transit event"
              value={milestoneNotes}
              onChange={(e) => setMilestoneNotes(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 text-slate-900"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsMilestoneModalOpen(false)}
              disabled={isAddingMilestone}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isAddingMilestone}
            >
              Append Milestone
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
