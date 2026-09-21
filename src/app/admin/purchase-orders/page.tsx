'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  FileText,
  Plus,
  Search,
  Filter,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Truck,
  RotateCcw,
  Building2,
  Trash2,
  BookOpen,
  Calendar,
  IndianRupee,
  PackageCheck,
  PackageX,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { usePurchaseOrders } from '@/context/PurchaseOrderContext';
import { useSuppliers } from '@/context/SupplierContext';
import { useProducts } from '@/context/ProductContext';
import { PurchaseOrder, PurchaseOrderItem } from '@/types';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';

type SortOption = 'date-desc' | 'date-asc' | 'cost-desc' | 'cost-asc' | 'po-asc';

interface NewItemLine {
  productId: string;
  productTitle: string;
  isbn: string;
  publisher: string;
  quantityOrdered: number;
  unitCost: number;
}

export default function AdminPurchaseOrdersPage() {
  const { purchaseOrders, createPurchaseOrder, resetPurchaseOrdersToDefaults } = usePurchaseOrders();
  const { suppliers } = useSuppliers();
  const { products } = useProducts();

  // Search, Filter & Sort State
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedSupplier, setSelectedSupplier] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOption>('date-desc');

  // Create PO Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // Form State
  const [formSupplierId, setFormSupplierId] = useState('');
  const [formOrderDate, setFormOrderDate] = useState(new Date().toISOString().split('T')[0]);
  const [formExpectedDate, setFormExpectedDate] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formItems, setFormItems] = useState<NewItemLine[]>([
    { productId: '', productTitle: '', isbn: '', publisher: '', quantityOrdered: 50, unitCost: 150 },
  ]);

  // Summary Metrics
  const stats = useMemo(() => {
    const totalCount = purchaseOrders.length;
    const activeCount = purchaseOrders.filter(
      (po) => po.status === 'Sent' || po.status === 'Partially Received'
    ).length;
    const completedCount = purchaseOrders.filter((po) => po.status === 'Completed').length;
    const draftCount = purchaseOrders.filter((po) => po.status === 'Draft').length;
    const totalProcurementValue = purchaseOrders
      .filter((po) => po.status !== 'Cancelled')
      .reduce((acc, po) => acc + (po.totalCost || 0), 0);

    return {
      totalCount,
      activeCount,
      completedCount,
      draftCount,
      totalProcurementValue,
    };
  }, [purchaseOrders]);

  // Filter & Sort Logic
  const filteredOrders = useMemo(() => {
    return purchaseOrders
      .filter((po) => {
        const q = search.trim().toLowerCase();
        const matchesSearch =
          !q ||
          po.poNumber.toLowerCase().includes(q) ||
          po.supplierName.toLowerCase().includes(q) ||
          (po.notes && po.notes.toLowerCase().includes(q)) ||
          po.items.some(
            (item) =>
              item.productTitle.toLowerCase().includes(q) ||
              item.isbn.toLowerCase().includes(q) ||
              item.publisher.toLowerCase().includes(q)
          );

        const matchesStatus = selectedStatus === 'all' || po.status === selectedStatus;
        const matchesSupplier =
          selectedSupplier === 'all' || po.supplierId.toLowerCase() === selectedSupplier.toLowerCase();

        return matchesSearch && matchesStatus && matchesSupplier;
      })
      .sort((a, b) => {
        if (sortBy === 'date-desc') {
          return new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime();
        }
        if (sortBy === 'date-asc') {
          return new Date(a.orderDate).getTime() - new Date(b.orderDate).getTime();
        }
        if (sortBy === 'cost-desc') {
          return (b.totalCost || 0) - (a.totalCost || 0);
        }
        if (sortBy === 'cost-asc') {
          return (a.totalCost || 0) - (b.totalCost || 0);
        }
        if (sortBy === 'po-asc') {
          return a.poNumber.localeCompare(b.poNumber);
        }
        return 0;
      });
  }, [purchaseOrders, search, selectedStatus, selectedSupplier, sortBy]);

  const handleResetFilters = () => {
    setSearch('');
    setSelectedStatus('all');
    setSelectedSupplier('all');
    setSortBy('date-desc');
  };

  const handleOpenCreateModal = () => {
    // Default expected delivery date: 14 days from now
    const next14Days = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    setFormSupplierId(suppliers.length > 0 ? suppliers[0].id : '');
    setFormOrderDate(new Date().toISOString().split('T')[0]);
    setFormExpectedDate(next14Days);
    setFormNotes('');
    setFormItems([
      {
        productId: products.length > 0 ? products[0].id : '',
        productTitle: products.length > 0 ? products[0].title : '',
        isbn: products.length > 0 ? products[0].isbn : '',
        publisher: products.length > 0 ? products[0].publisher : '',
        quantityOrdered: 100,
        unitCost: 0,
      },
    ]);
    setFormError(null);
    setFormSuccess(null);
    setIsCreateModalOpen(true);
  };

  const handleProductSelect = (index: number, productId: string) => {
    const selectedProd = products.find((p) => p.id === productId);
    setFormItems((prev) => {
      const updated = [...prev];
      if (selectedProd) {
        updated[index] = {
          ...updated[index],
          productId: selectedProd.id,
          productTitle: selectedProd.title,
          isbn: selectedProd.isbn,
          publisher: selectedProd.publisher,
          // unitCost is explicitly entered by the administrator per supplier agreement
        };
      } else {
        updated[index] = {
          ...updated[index],
          productId: '',
          productTitle: '',
          isbn: '',
          publisher: '',
        };
      }
      return updated;
    });
  };

  const handleItemChange = (index: number, field: keyof NewItemLine, value: any) => {
    setFormItems((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        [field]: value,
      };
      return updated;
    });
  };

  const handleAddItemRow = () => {
    setFormItems((prev) => [
      ...prev,
      {
        productId: '',
        productTitle: '',
        isbn: '',
        publisher: '',
        quantityOrdered: 50,
        unitCost: 0,
      },
    ]);
  };

  const handleRemoveItemRow = (index: number) => {
    if (formItems.length <= 1) {
      setFormError('A purchase order must contain at least one item.');
      return;
    }
    setFormItems((prev) => prev.filter((_, i) => i !== index));
  };

  const calculateFormTotal = useMemo(() => {
    return formItems.reduce((acc, item) => {
      const qty = Number(item.quantityOrdered) || 0;
      const cost = Number(item.unitCost) || 0;
      return acc + qty * cost;
    }, 0);
  }, [formItems]);

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError(null);

    if (!formSupplierId) {
      setFormError('Please select a supplier.');
      setIsSubmitting(false);
      return;
    }

    const matchedSupplier = suppliers.find((s) => s.id === formSupplierId);
    const supplierName = matchedSupplier ? matchedSupplier.name : 'Direct Publisher';

    if (!formExpectedDate) {
      setFormError('Please provide an expected delivery date.');
      setIsSubmitting(false);
      return;
    }

    if (formItems.length === 0) {
      setFormError('Please add at least one line item.');
      setIsSubmitting(false);
      return;
    }

    for (let i = 0; i < formItems.length; i++) {
      const item = formItems[i];
      if (!item.productTitle.trim()) {
        setFormError(`Item #${i + 1} requires a book title.`);
        setIsSubmitting(false);
        return;
      }
      if (item.quantityOrdered <= 0) {
        setFormError(`Item #${i + 1} ordered quantity must be greater than 0.`);
        setIsSubmitting(false);
        return;
      }
      if (item.unitCost < 0) {
        setFormError(`Item #${i + 1} unit cost cannot be negative.`);
        setIsSubmitting(false);
        return;
      }
    }

    const result = createPurchaseOrder({
      supplierId: formSupplierId,
      supplierName,
      orderDate: formOrderDate,
      expectedDeliveryDate: formExpectedDate,
      notes: formNotes,
      items: formItems.map((item) => ({
        productId: item.productId,
        productTitle: item.productTitle,
        isbn: item.isbn,
        publisher: item.publisher,
        quantityOrdered: Number(item.quantityOrdered),
        unitCost: Number(item.unitCost),
      })),
    });

    setIsSubmitting(false);

    if (result.success && result.purchaseOrder) {
      setFormSuccess(`Purchase Order ${result.purchaseOrder.poNumber} created successfully!`);
      setTimeout(() => {
        setIsCreateModalOpen(false);
        setFormSuccess(null);
      }, 900);
    } else {
      setFormError(result.error || 'Failed to create purchase order.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <AdminPageHeader
        title="Purchase Order Management"
        description="Record, monitor, and manage procurement purchase orders placed with textbook publishers and educational suppliers."
        breadcrumbs={[{ label: 'Purchase Orders' }]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={resetPurchaseOrdersToDefaults}
              className="text-xs text-slate-600 hover:text-slate-900"
              title="Reset purchase orders to default mock data"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
              Reset Defaults
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleOpenCreateModal}
              className="bg-emerald-700 hover:bg-emerald-800 text-white"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Create Purchase Order
            </Button>
          </div>
        }
      />

      {/* Metric KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Purchase Orders
            </p>
            <p className="text-2xl font-bold text-slate-900">{stats.totalCount}</p>
            <p className="text-xs text-slate-400">All recorded procurement indents</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 shrink-0">
            <FileText className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-amber-600">
              Active / In-Transit
            </p>
            <p className="text-2xl font-bold text-amber-700">{stats.activeCount}</p>
            <p className="text-xs text-slate-400">Sent & Partially Received orders</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
            <Truck className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600">
              Completed Orders
            </p>
            <p className="text-2xl font-bold text-emerald-700">{stats.completedCount}</p>
            <p className="text-xs text-slate-400">Fully received shipments</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
            <PackageCheck className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Procurement Volume
            </p>
            <p className="text-2xl font-bold text-slate-900">
              ₹{stats.totalProcurementValue.toLocaleString('en-IN')}
            </p>
            <p className="text-xs text-slate-400">Cumulative value (excl. cancelled)</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-700 shrink-0">
            <IndianRupee className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search PO#, supplier, book, ISBN..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
            >
              <option value="all">All Statuses ({purchaseOrders.length})</option>
              <option value="Draft">Draft</option>
              <option value="Sent">Sent</option>
              <option value="Partially Received">Partially Received</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          {/* Supplier Filter */}
          <div>
            <select
              value={selectedSupplier}
              onChange={(e) => setSelectedSupplier(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
            >
              <option value="all">All Suppliers / Publishers</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.code})
                </option>
              ))}
            </select>
          </div>

          {/* Sort Option */}
          <div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
            >
              <option value="date-desc">Order Date: Newest First</option>
              <option value="date-asc">Order Date: Oldest First</option>
              <option value="cost-desc">Total Cost: High to Low</option>
              <option value="cost-asc">Total Cost: Low to High</option>
              <option value="po-asc">PO Number: Ascending</option>
            </select>
          </div>
        </div>

        {/* Active Filters Display */}
        {(search || selectedStatus !== 'all' || selectedSupplier !== 'all' || sortBy !== 'date-desc') && (
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
            <span>
              Showing <strong className="text-slate-800">{filteredOrders.length}</strong> of{' '}
              {purchaseOrders.length} purchase orders
            </span>
            <button
              onClick={handleResetFilters}
              className="text-emerald-700 hover:text-emerald-800 font-medium hover:underline flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* Purchase Orders Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {filteredOrders.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900">No Purchase Orders Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No purchase orders match your search criteria. Try clearing filters or create a new purchase order.
            </p>
            <div className="pt-2 flex justify-center gap-3">
              {(search || selectedStatus !== 'all' || selectedSupplier !== 'all') && (
                <Button variant="outline" size="sm" onClick={handleResetFilters}>
                  Clear Filters
                </Button>
              )}
              <Button
                variant="primary"
                size="sm"
                onClick={handleOpenCreateModal}
                className="bg-emerald-700 hover:bg-emerald-800 text-white"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Create Purchase Order
              </Button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3.5 px-4">PO Number</th>
                  <th className="py-3.5 px-4">Supplier / Publisher</th>
                  <th className="py-3.5 px-4">Order Date</th>
                  <th className="py-3.5 px-4">Expected Delivery</th>
                  <th className="py-3.5 px-4 text-center">Items & Units</th>
                  <th className="py-3.5 px-4 text-right">Total Cost</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {filteredOrders.map((po) => {
                  const totalUnits = po.items.reduce((acc, i) => acc + i.quantityOrdered, 0);
                  const receivedUnits = po.items.reduce((acc, i) => acc + (i.quantityReceived || 0), 0);
                  const matchedSupplier = suppliers.find((s) => s.id === po.supplierId);

                  return (
                    <tr key={po.id} className="hover:bg-slate-50/70 transition-colors group">
                      <td className="py-3.5 px-4 font-mono font-semibold text-slate-900">
                        <Link
                          href={`/admin/purchase-orders/${po.id}`}
                          className="hover:text-emerald-700 transition-colors flex items-center gap-1.5"
                        >
                          <FileText className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-700" />
                          <span>{po.poNumber}</span>
                        </Link>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col">
                          {matchedSupplier ? (
                            <Link
                              href={`/admin/suppliers/${matchedSupplier.id}`}
                              className="font-medium text-slate-900 hover:text-emerald-700 transition-colors flex items-center gap-1"
                            >
                              <span>{po.supplierName}</span>
                              <ExternalLink className="w-2.5 h-2.5 text-slate-400" />
                            </Link>
                          ) : (
                            <span className="font-medium text-slate-900">{po.supplierName}</span>
                          )}
                          <span className="text-[11px] text-slate-400 font-mono">
                            {matchedSupplier?.code || po.supplierId}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                        {po.orderDate}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="text-slate-700">{po.expectedDeliveryDate}</span>
                        {po.receivedDate && (
                          <div className="text-[10px] text-emerald-600 font-medium">
                            Recvd: {po.receivedDate}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex flex-col items-center">
                          <span className="font-medium text-slate-800">
                            {po.items.length} {po.items.length === 1 ? 'line' : 'lines'}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {receivedUnits} / {totalUnits} units
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                        ₹{po.totalCost.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <StatusBadge status={po.status} />
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Link
                          href={`/admin/purchase-orders/${po.id}`}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100/80 px-2.5 py-1.5 rounded-lg transition-colors"
                        >
                          <span>View Details</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Purchase Order Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create Purchase Order"
        description="Draft a new textbook procurement indent for an educational supplier or publisher."
        maxWidth="2xl"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-5">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-rose-700 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          {formSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2 text-emerald-700 text-xs">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{formSuccess}</span>
            </div>
          )}

          {/* Supplier & Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Supplier / Publisher <span className="text-rose-500">*</span>
              </label>
              <select
                value={formSupplierId}
                onChange={(e) => setFormSupplierId(e.target.value)}
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              >
                <option value="">-- Select Supplier --</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Order Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={formOrderDate}
                onChange={(e) => setFormOrderDate(e.target.value)}
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Expected Delivery Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={formExpectedDate}
                onChange={(e) => setFormExpectedDate(e.target.value)}
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Line Items Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-emerald-700" />
                Procurement Line Items
              </h4>
              <button
                type="button"
                onClick={handleAddItemRow}
                className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Item Line
              </button>
            </div>

            <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
              {formItems.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2 relative"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                    {/* Catalog Lookup */}
                    <div className="sm:col-span-6">
                      <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                        Catalog Book Title <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={item.productId}
                        onChange={(e) => handleProductSelect(idx, e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      >
                        <option value="">-- Choose from Catalog or Type Below --</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.title} ({p.publisher})
                          </option>
                        ))}
                      </select>
                      {!item.productId && (
                        <input
                          type="text"
                          placeholder="Or enter custom book title..."
                          value={item.productTitle}
                          onChange={(e) => handleItemChange(idx, 'productTitle', e.target.value)}
                          className="mt-1 w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900"
                        />
                      )}
                    </div>

                    {/* Quantity */}
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                        Quantity <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={item.quantityOrdered}
                        onChange={(e) =>
                          handleItemChange(idx, 'quantityOrdered', parseInt(e.target.value) || 0)
                        }
                        className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 font-mono text-right"
                      />
                    </div>

                    {/* Unit Cost */}
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                        Unit Cost (₹) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unitCost}
                        onChange={(e) =>
                          handleItemChange(idx, 'unitCost', parseFloat(e.target.value) || 0)
                        }
                        className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 font-mono text-right"
                      />
                    </div>

                    {/* Line Total */}
                    <div className="sm:col-span-2 flex items-center justify-between sm:justify-end gap-2 pt-4 sm:pt-0">
                      <div className="text-right">
                        <span className="block text-[10px] text-slate-400">Total</span>
                        <span className="text-xs font-bold font-mono text-slate-900">
                          ₹{(item.quantityOrdered * item.unitCost).toLocaleString('en-IN')}
                        </span>
                      </div>
                      {formItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItemRow(idx)}
                          className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                          title="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Notes & Grand Total */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end pt-2 border-t border-slate-200">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Order Notes / Delivery Instructions (Optional)
              </label>
              <textarea
                rows={2}
                placeholder="e.g., Deliver to Central Warehouse Bay #2, urgent requirement for academic term..."
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200 text-right space-y-0.5">
              <p className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wide">
                Total Procurement Cost
              </p>
              <p className="text-lg font-bold font-mono text-emerald-900">
                ₹{calculateFormTotal.toLocaleString('en-IN')}
              </p>
            </div>
          </div>

          {/* Actions */}
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
              disabled={isSubmitting}
              className="bg-emerald-700 hover:bg-emerald-800 text-white"
            >
              {isSubmitting ? 'Creating PO...' : 'Create Purchase Order (Draft)'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
