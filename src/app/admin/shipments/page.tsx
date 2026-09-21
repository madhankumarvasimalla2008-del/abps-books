'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Truck,
  Plus,
  Search,
  Filter,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Building2,
  Calendar,
  Package,
  Weight,
  Layers,
  MapPin,
  ExternalLink,
} from 'lucide-react';
import { useShipments } from '@/context/ShipmentContext';
import { useOrders } from '@/context/OrderContext';
import { Shipment, ShipmentStatus } from '@/types';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';

type SortOption = 'date-desc' | 'date-asc' | 'packages-desc' | 'weight-desc' | 'number-asc';

const CARRIER_OPTIONS = [
  'Blue Dart Express',
  'Delhivery Logistics',
  'Ekart Surface',
  'DTDC Express',
  'Gati KWE',
  'Safexpress Cargo',
  'TCI Freight',
];

export default function AdminShipmentsPage() {
  const { shipments, createShipment, resetShipmentsToDefaults } = useShipments();
  const { orders } = useOrders();

  // Search, Filter & Sort State
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedCarrier, setSelectedCarrier] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOption>('date-desc');

  // Create Shipment Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // Form Fields
  const [formOrderId, setFormOrderId] = useState('');
  const [formOrderNumber, setFormOrderNumber] = useState('');
  const [formBranchName, setFormBranchName] = useState('');
  const [formDestinationCity, setFormDestinationCity] = useState('');
  const [formDestinationState, setFormDestinationState] = useState('');
  const [formCarrier, setFormCarrier] = useState(CARRIER_OPTIONS[0]);
  const [formCustomCarrier, setFormCustomCarrier] = useState('');
  const [formTrackingNumber, setFormTrackingNumber] = useState('');
  const [formPackages, setFormPackages] = useState(2);
  const [formWeightKg, setFormWeightKg] = useState(25);
  const [formDispatchDate, setFormDispatchDate] = useState(new Date().toISOString().split('T')[0]);
  const [formEstimatedArrival, setFormEstimatedArrival] = useState(
    new Date(Date.now() + 4 * 86400000).toISOString().split('T')[0]
  );
  const [formNotes, setFormNotes] = useState('');

  // Auto-fill branch & address when order is selected
  const handleOrderSelectionChange = (orderId: string) => {
    setFormOrderId(orderId);
    const selected = orders.find((o) => o.id === orderId);
    if (selected) {
      setFormOrderNumber(selected.orderNumber || selected.id);
      setFormBranchName(selected.branchName || 'The Aditya Birla Public School');
      setFormDestinationCity(selected.deliveryAddress?.city || selected.shippingAddress?.city || 'Central Hub');
      setFormDestinationState(selected.deliveryAddress?.state || selected.shippingAddress?.state || 'Gujarat');
      if (selected.carrier) {
        setFormCarrier(selected.carrier);
      }
      if (selected.trackingNumber) {
        setFormTrackingNumber(selected.trackingNumber);
      } else {
        const randNum = Math.floor(10000000 + Math.random() * 90000000);
        setFormTrackingNumber(`BD-${randNum}`);
      }
      const totalItems = selected.items?.reduce((acc, item) => acc + (item.quantity || 0), 0) || 50;
      setFormPackages(Math.max(1, Math.ceil(totalItems / 40)));
      setFormWeightKg(Math.max(1, Math.round(totalItems * 0.45)));
    }
  };

  // KPI Metrics Calculation
  const stats = useMemo(() => {
    const totalCount = shipments.length;
    const inTransitCount = shipments.filter((s) => s.status === 'In Transit').length;
    const outForDeliveryCount = shipments.filter((s) => s.status === 'Out for Delivery').length;
    const deliveredCount = shipments.filter((s) => s.status === 'Delivered').length;
    const delayedCount = shipments.filter((s) => s.status === 'Delayed').length;
    const totalPackagesSum = shipments.reduce((acc, s) => acc + (s.totalPackages || 0), 0);

    return {
      totalCount,
      inTransitCount,
      outForDeliveryCount,
      deliveredCount,
      delayedCount,
      totalPackagesSum,
    };
  }, [shipments]);

  // Filter & Sort Logic
  const filteredShipments = useMemo(() => {
    return shipments
      .filter((s) => {
        const q = search.trim().toLowerCase();
        const matchesSearch =
          !q ||
          s.shipmentNumber.toLowerCase().includes(q) ||
          s.trackingNumber.toLowerCase().includes(q) ||
          s.orderNumber.toLowerCase().includes(q) ||
          s.branchName.toLowerCase().includes(q) ||
          s.destinationCity.toLowerCase().includes(q) ||
          s.destinationState.toLowerCase().includes(q) ||
          s.carrier.toLowerCase().includes(q) ||
          (s.notes && s.notes.toLowerCase().includes(q));

        const matchesStatus = selectedStatus === 'all' || s.status === selectedStatus;
        const matchesCarrier = selectedCarrier === 'all' || s.carrier === selectedCarrier;

        return matchesSearch && matchesStatus && matchesCarrier;
      })
      .sort((a, b) => {
        if (sortBy === 'date-desc') {
          return new Date(b.dispatchDate).getTime() - new Date(a.dispatchDate).getTime();
        }
        if (sortBy === 'date-asc') {
          return new Date(a.dispatchDate).getTime() - new Date(b.dispatchDate).getTime();
        }
        if (sortBy === 'packages-desc') {
          return b.totalPackages - a.totalPackages;
        }
        if (sortBy === 'weight-desc') {
          return b.totalWeightKg - a.totalWeightKg;
        }
        if (sortBy === 'number-asc') {
          return a.shipmentNumber.localeCompare(b.shipmentNumber);
        }
        return 0;
      });
  }, [shipments, search, selectedStatus, selectedCarrier, sortBy]);

  const handleCreateShipment = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (!formOrderId) {
      setFormError('Please select a customer order to link this shipment with.');
      return;
    }

    const carrierToUse = formCarrier === 'Other' ? formCustomCarrier.trim() : formCarrier;
    if (!carrierToUse) {
      setFormError('Please specify the carrier name.');
      return;
    }

    if (!formTrackingNumber.trim()) {
      setFormError('Please enter the tracking number.');
      return;
    }

    if (!formDestinationCity.trim() || !formDestinationState.trim()) {
      setFormError('Destination city and state are required.');
      return;
    }

    setIsSubmitting(true);

    const result = createShipment({
      orderId: formOrderId,
      orderNumber: formOrderNumber || formOrderId,
      branchName: formBranchName || 'The Aditya Birla Public School',
      destinationCity: formDestinationCity.trim(),
      destinationState: formDestinationState.trim(),
      carrier: carrierToUse,
      trackingNumber: formTrackingNumber.trim(),
      totalPackages: Number(formPackages) || 1,
      totalWeightKg: Number(formWeightKg) || 1.0,
      dispatchDate: formDispatchDate,
      estimatedArrival: formEstimatedArrival,
      notes: formNotes.trim() || undefined,
    });

    setIsSubmitting(false);

    if (result.success && result.shipment) {
      setFormSuccess(`Shipment ${result.shipment.shipmentNumber} created successfully.`);
      setTimeout(() => {
        setIsCreateModalOpen(false);
        setFormSuccess(null);
      }, 1000);
    } else {
      setFormError(result.error || 'Failed to create shipment.');
    }
  };

  const handleOpenCreateModal = () => {
    setFormError(null);
    setFormSuccess(null);
    if (orders.length > 0) {
      handleOrderSelectionChange(orders[0].id);
    }
    setIsCreateModalOpen(true);
  };

  const resetFilters = () => {
    setSearch('');
    setSelectedStatus('all');
    setSelectedCarrier('all');
    setSortBy('date-desc');
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb Header */}
      <AdminPageHeader
        title="Shipment Management"
        description="Track customer shipments, carrier details, and delivery milestones."
        breadcrumbs={[{ label: 'Shipments' }]}
        actions={
          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
              onClick={resetShipmentsToDefaults}
              title="Reset mock shipments to default dataset"
            >
              Reset Data
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={handleOpenCreateModal}
            >
              Create Shipment
            </Button>
          </div>
        }
      />

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3.5">
          <div className="p-2.5 rounded-lg bg-slate-100 text-slate-700">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-slate-900">{stats.totalCount}</div>
            <div className="text-xs text-slate-500 font-medium">Total Shipments</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3.5">
          <div className="p-2.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-100">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-blue-900">{stats.inTransitCount}</div>
            <div className="text-xs text-blue-600 font-medium">In Transit</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3.5">
          <div className="p-2.5 rounded-lg bg-purple-50 text-purple-700 border border-purple-100">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-purple-900">{stats.outForDeliveryCount}</div>
            <div className="text-xs text-purple-600 font-medium">Out for Delivery</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3.5">
          <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-emerald-900">{stats.deliveredCount}</div>
            <div className="text-xs text-emerald-600 font-medium">Delivered</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3.5">
          <div className="p-2.5 rounded-lg bg-amber-50 text-amber-700 border border-amber-100">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-amber-900">{stats.delayedCount}</div>
            <div className="text-xs text-amber-600 font-medium">Transit Exceptions</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by shipment #, tracking number, order #, branch or city..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9.5 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 text-slate-900 placeholder:text-slate-400"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="text-[11px] text-slate-400 hover:text-slate-600 absolute right-3 top-1/2 -translate-y-1/2"
              >
                Clear
              </button>
            )}
          </div>

          {/* Status Filter */}
          <div className="w-full md:w-44">
            <select
              aria-label="Filter by Status"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 text-slate-700"
            >
              <option value="all">All Statuses</option>
              <option value="Created">Created</option>
              <option value="In Transit">In Transit</option>
              <option value="Out for Delivery">Out for Delivery</option>
              <option value="Delivered">Delivered</option>
              <option value="Delayed">Delayed</option>
              <option value="Returned">Returned</option>
            </select>
          </div>

          {/* Carrier Filter */}
          <div className="w-full md:w-48">
            <select
              aria-label="Filter by Carrier"
              value={selectedCarrier}
              onChange={(e) => setSelectedCarrier(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 text-slate-700"
            >
              <option value="all">All Carriers</option>
              {CARRIER_OPTIONS.map((carrier) => (
                <option key={carrier} value={carrier}>
                  {carrier}
                </option>
              ))}
            </select>
          </div>

          {/* Sort Dropdown */}
          <div className="w-full md:w-44">
            <select
              aria-label="Sort Shipments By"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 text-slate-700"
            >
              <option value="date-desc">Dispatch Date (Newest)</option>
              <option value="date-asc">Dispatch Date (Oldest)</option>
              <option value="packages-desc">Packages (High to Low)</option>
              <option value="weight-desc">Weight (High to Low)</option>
              <option value="number-asc">Shipment # (A-Z)</option>
            </select>
          </div>
        </div>

        {/* Active Filter Tags & Reset */}
        {(search || selectedStatus !== 'all' || selectedCarrier !== 'all') && (
          <div className="flex items-center gap-2 pt-2 border-t border-slate-100 text-xs text-slate-600 flex-wrap">
            <span className="font-semibold">Active filters:</span>
            {search && (
              <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px]">
                Search: &quot;{search}&quot;
              </span>
            )}
            {selectedStatus !== 'all' && (
              <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px]">
                Status: {selectedStatus}
              </span>
            )}
            {selectedCarrier !== 'all' && (
              <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px]">
                Carrier: {selectedCarrier}
              </span>
            )}
            <button
              type="button"
              onClick={resetFilters}
              className="text-emerald-700 hover:text-emerald-800 text-[11px] font-semibold underline ml-1 cursor-pointer"
            >
              Reset all
            </button>
            <span className="text-slate-400 ml-auto text-[11px]">
              Showing {filteredShipments.length} of {shipments.length} shipments
            </span>
          </div>
        )}
      </div>

      {/* Shipments Directory Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {filteredShipments.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <Truck className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">No shipments found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {search || selectedStatus !== 'all' || selectedCarrier !== 'all'
                ? 'No shipment records match your active search and filter criteria.'
                : 'No shipment records have been created yet.'}
            </p>
            {(search || selectedStatus !== 'all' || selectedCarrier !== 'all') && (
              <Button variant="outline" size="sm" onClick={resetFilters} className="mt-4">
                Clear Filters
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200/80">
                <tr>
                  <th className="py-3 px-4">Shipment # & Tracking Number</th>
                  <th className="py-3 px-3">Linked Order</th>
                  <th className="py-3 px-3">Destination Branch</th>
                  <th className="py-3 px-3">Carrier Partner</th>
                  <th className="py-3 px-3 text-right">Packages / Gross Wt</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Dispatch / ETA</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredShipments.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4">
                      <Link
                        href={`/admin/shipments/${s.id}`}
                        className="font-bold font-mono text-slate-900 hover:text-emerald-700 hover:underline block"
                      >
                        {s.shipmentNumber}
                      </Link>
                      <span className="font-mono text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <Truck className="w-3 h-3 text-slate-400" />
                        {s.trackingNumber}
                      </span>
                    </td>

                    <td className="py-3.5 px-3 font-mono">
                      <Link
                        href={`/admin/orders/${s.orderId}`}
                        className="text-emerald-700 font-semibold hover:underline"
                      >
                        {s.orderNumber}
                      </Link>
                    </td>

                    <td className="py-3.5 px-3">
                      <div className="font-semibold text-slate-900 line-clamp-1">{s.branchName}</div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        {s.destinationCity}, {s.destinationState}
                      </div>
                    </td>

                    <td className="py-3.5 px-3">
                      <span className="font-medium text-slate-800 block">{s.carrier}</span>
                    </td>

                    <td className="py-3.5 px-3 text-right font-mono">
                      <span className="font-bold text-slate-900 block">
                        {s.totalPackages} {s.totalPackages === 1 ? 'pkg' : 'pkgs'}
                      </span>
                      <span className="text-[10px] text-slate-500">{s.totalWeightKg} kg gross</span>
                    </td>

                    <td className="py-3.5 px-3">
                      <StatusBadge status={s.status} type="shipment" />
                    </td>

                    <td className="py-3.5 px-3 text-[11px]">
                      <div className="text-slate-900 font-medium">
                        Dispatched: {new Date(s.dispatchDate).toLocaleDateString('en-IN')}
                      </div>
                      <div className="text-slate-500 mt-0.5">
                        {s.status === 'Delivered' && s.deliveredDate ? (
                          <span className="text-emerald-700 font-semibold">
                            Delivered: {new Date(s.deliveredDate).toLocaleDateString('en-IN')}
                          </span>
                        ) : (
                          <span>ETA: {new Date(s.estimatedArrival).toLocaleDateString('en-IN')}</span>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <Link href={`/admin/shipments/${s.id}`}>
                        <Button
                          variant="outline"
                          size="sm"
                          rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                        >
                          Details
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Shipment Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Shipment Record"
        description="Manifest an operational dispatch record for a confirmed customer book order."
        maxWidth="lg"
      >
        <form onSubmit={handleCreateShipment} className="space-y-4 text-xs">
          {formError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          {formSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{formSuccess}</span>
            </div>
          )}

          {/* Select Linked Order */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Select Customer Order <span className="text-red-500">*</span>
            </label>
            <select
              aria-label="Select Customer Order"
              value={formOrderId}
              onChange={(e) => handleOrderSelectionChange(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 text-slate-900"
              required
            >
              <option value="">-- Choose confirmed customer order --</option>
              {orders.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.orderNumber || o.id} - {o.branchName} ({o.items?.length || 0} items, {o.status})
                </option>
              ))}
            </select>
          </div>

          {/* Branch & Destination Snapshot */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200/80">
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Branch / Destination
              </label>
              <input
                type="text"
                value={formBranchName}
                onChange={(e) => setFormBranchName(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded text-slate-800"
                required
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Destination City <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formDestinationCity}
                onChange={(e) => setFormDestinationCity(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded text-slate-800"
                required
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Destination State <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formDestinationState}
                onChange={(e) => setFormDestinationState(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded text-slate-800"
                required
              />
            </div>
          </div>

          {/* Carrier Partner & Tracking Number */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Carrier Partner <span className="text-red-500">*</span>
              </label>
              <select
                aria-label="Carrier Partner"
                value={formCarrier}
                onChange={(e) => setFormCarrier(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 text-slate-900"
              >
                {CARRIER_OPTIONS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
                <option value="Other">Other Logistics Service</option>
              </select>
              {formCarrier === 'Other' && (
                <input
                  type="text"
                  placeholder="Enter carrier name"
                  value={formCustomCarrier}
                  onChange={(e) => setFormCustomCarrier(e.target.value)}
                  className="w-full mt-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 text-slate-900"
                  required
                />
              )}
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Tracking Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formTrackingNumber}
                onChange={(e) => setFormTrackingNumber(e.target.value)}
                placeholder="e.g. BD-88392019"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 font-mono text-slate-900"
                required
              />
            </div>
          </div>

          {/* Packages & Weight */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Total Packages (Boxes)</label>
              <input
                type="number"
                min="1"
                step="1"
                value={formPackages}
                onChange={(e) => setFormPackages(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 text-slate-900 font-mono"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Total Gross Weight (kg)</label>
              <input
                type="number"
                min="0.1"
                step="0.5"
                value={formWeightKg}
                onChange={(e) => setFormWeightKg(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 text-slate-900 font-mono"
                required
              />
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Dispatch Date</label>
              <input
                type="date"
                value={formDispatchDate}
                onChange={(e) => setFormDispatchDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 text-slate-900"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Estimated Arrival (ETA)</label>
              <input
                type="date"
                value={formEstimatedArrival}
                onChange={(e) => setFormEstimatedArrival(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 text-slate-900"
                required
              />
            </div>
          </div>

          {/* Operational Notes */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Operational Notes / Special Remarks</label>
            <textarea
              rows={2}
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
              placeholder="e.g., Heavy cartons sealed with waterproof tape; deliver to school store dock."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 text-slate-900"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsCreateModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isSubmitting}
            >
              Create Shipment
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
