'use client';

import React, { use, useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Truck,
  Building2,
  Phone,
  Mail,
  ArrowRight,
  Edit,
  Power,
  CheckCircle2,
  XCircle,
  AlertCircle,
  BookOpen,
  MapPin,
  FileText,
  Package,
  X,
  ArrowLeft,
} from 'lucide-react';
import { useSuppliers, UpdateSupplierInput } from '@/context/SupplierContext';
import { useProducts } from '@/context/ProductContext';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Button, buttonVariants } from '@/components/ui/Button';
import { Product } from '@/types';

export default function AdminSupplierDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const { getSupplier, updateSupplier, toggleSupplierStatus } = useSuppliers();
  const { products } = useProducts();

  const supplier = getSupplier(resolvedParams.id);

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // Status Action State
  const [statusFeedback, setStatusFeedback] = useState<string | null>(null);

  // Edit Form Fields
  const [formData, setFormData] = useState<UpdateSupplierInput>({
    name: '',
    code: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    gstin: '',
    suppliedPublishers: [],
    status: 'active',
  });
  const [publishersInput, setPublishersInput] = useState('');

  // Associated Catalog Books matching this Publisher / Supplier (Read-only derived relationship)
  const relatedProducts = useMemo(() => {
    if (!supplier) return [];
    const supName = supplier.name.toLowerCase();
    const supPubs = (supplier.suppliedPublishers || []).map((p) => p.toLowerCase());

    return products.filter((p: Product) => {
      const pub = (p.publisher || '').toLowerCase();
      if (!pub) return false;
      if (pub === supName || supName.includes(pub) || pub.includes(supName)) return true;
      return supPubs.some((sp) => pub.includes(sp) || sp.includes(pub));
    });
  }, [supplier, products]);

  // Handle Missing / Invalid Supplier
  if (!supplier) {
    return (
      <div className="space-y-6">
        <Breadcrumbs
          items={[
            { label: 'Publishers & Suppliers', href: '/admin/suppliers' },
            { label: 'Supplier Not Found' },
          ]}
        />
        <div className="bg-white rounded-2xl border border-slate-200/80 p-8 sm:p-12 text-center shadow-xs">
          <Truck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-slate-900">Supplier Not Found</h2>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-6">
            The supplier record with ID <code className="font-mono text-emerald-700 font-semibold">{resolvedParams.id}</code> does not exist in the administrative directory or may have been reset.
          </p>
          <Link
            href="/admin/suppliers"
            className={buttonVariants({
              variant: 'primary',
              size: 'sm',
              className: 'gap-1.5',
            })}
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Suppliers Directory</span>
          </Link>
        </div>
      </div>
    );
  }

  const handleOpenEditModal = () => {
    setFormData({
      name: supplier.name,
      code: supplier.code,
      contactPerson: supplier.contactPerson,
      email: supplier.email,
      phone: supplier.phone,
      address: supplier.address,
      city: supplier.city,
      state: supplier.state,
      gstin: supplier.gstin,
      suppliedPublishers: supplier.suppliedPublishers || [supplier.name],
      status: supplier.status,
    });
    setPublishersInput((supplier.suppliedPublishers || []).join(', '));
    setFormError(null);
    setFormSuccess(null);
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setFormError(null);

    const parsedPublishers = publishersInput
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean);

    const result = updateSupplier(supplier.id, {
      ...formData,
      suppliedPublishers: parsedPublishers.length > 0 ? parsedPublishers : [formData.name?.trim() || supplier.name],
    });

    if (result.success && result.supplier) {
      setFormSuccess('Supplier details updated successfully.');
      setTimeout(() => {
        setIsEditModalOpen(false);
        setFormSuccess(null);
      }, 800);
    } else {
      setFormError(result.error || 'Failed to update supplier.');
    }
    setIsSaving(false);
  };

  const handleToggleStatus = () => {
    const res = toggleSupplierStatus(supplier.id);
    if (res.success && res.supplier) {
      setStatusFeedback(
        `Supplier status changed to ${res.supplier.status.toUpperCase()}.`
      );
      setTimeout(() => setStatusFeedback(null), 3000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: 'Publishers & Suppliers', href: '/admin/suppliers' },
          { label: supplier.name },
        ]}
      />

      {/* Status Feedback Toast Banner */}
      {statusFeedback && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{statusFeedback}</span>
          </div>
          <button
            type="button"
            onClick={() => setStatusFeedback(null)}
            className="text-emerald-700 hover:text-emerald-900"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Supplier Profile Card */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-xs space-y-6">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                  supplier.status === 'active'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-slate-100 text-slate-600 border-slate-200'
                }`}
              >
                {supplier.status === 'active' ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Active Supplier
                  </>
                ) : (
                  <>
                    <XCircle className="w-3.5 h-3.5 text-slate-400" />
                    Inactive Supplier
                  </>
                )}
              </span>

              <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                Code: {supplier.code}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 leading-tight">
              {supplier.name}
            </h1>

            <p className="text-xs sm:text-sm text-slate-600 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>
                {supplier.address}, {supplier.city}, {supplier.state}
              </span>
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={handleToggleStatus}
              leftIcon={<Power className="w-4 h-4" />}
            >
              {supplier.status === 'active' ? 'Deactivate' : 'Activate'}
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleOpenEditModal}
              leftIcon={<Edit className="w-4 h-4" />}
            >
              Edit Supplier
            </Button>
          </div>
        </div>

        {/* Core Attributes Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-slate-100 text-xs">
          <div className="bg-slate-50 p-3.5 rounded-xl">
            <span className="text-slate-400 block text-[11px]">Contact Person</span>
            <span className="text-sm font-bold text-slate-900 truncate block mt-1">
              {supplier.contactPerson}
            </span>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-xl">
            <span className="text-slate-400 block text-[11px]">Official Email</span>
            <a
              href={`mailto:${supplier.email}`}
              className="text-xs font-semibold text-emerald-700 hover:underline truncate block mt-1"
            >
              {supplier.email}
            </a>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-xl">
            <span className="text-slate-400 block text-[11px]">Phone Number</span>
            <a
              href={`tel:${supplier.phone}`}
              className="text-xs font-semibold text-slate-900 hover:text-emerald-700 truncate block mt-1"
            >
              {supplier.phone}
            </a>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-xl">
            <span className="text-slate-400 block text-[11px]">GSTIN Tax ID</span>
            <span className="text-xs font-bold font-mono text-slate-900 truncate block mt-1">
              {supplier.gstin}
            </span>
          </div>
        </div>
      </div>

      {/* Supplied Imprints (Read-Only Supplier Info) */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-emerald-700" />
          <h2 className="text-sm font-bold text-slate-900">
            Supplied Publisher Imprints & Lines
          </h2>
        </div>
        <p className="text-xs text-slate-500">
          Publishing labels and imprint catalogs distributed by this supplier.
        </p>

        <div className="flex flex-wrap gap-2 pt-2">
          {supplier.suppliedPublishers && supplier.suppliedPublishers.length > 0 ? (
            supplier.suppliedPublishers.map((pub, idx) => (
              <span
                key={idx}
                className="bg-emerald-50 text-emerald-800 border border-emerald-200/70 text-xs font-semibold px-2.5 py-1 rounded-lg"
              >
                {pub}
              </span>
            ))
          ) : (
            <span className="text-xs text-slate-500 italic">
              Direct publisher catalog ({supplier.name})
            </span>
          )}
        </div>
      </div>

      {/* Associated Catalog Products (Read-Only Derived Relationship) */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Associated Catalog Titles ({relatedProducts.length})
            </h2>
            <p className="text-xs text-slate-500">
              Textbooks and course materials in the catalog published or supplied by {supplier.name}.
            </p>
          </div>

          <Link
            href="/admin/products"
            className={buttonVariants({
              variant: 'outline',
              size: 'sm',
              className: 'gap-1.5',
            })}
          >
            <span>View All Products</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {relatedProducts.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-8 text-center shadow-xs">
            <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-xs text-slate-500 font-medium">
              No catalog books are currently mapped to &ldquo;{supplier.name}&rdquo; or its supplied imprints.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-100">
                  <tr>
                    <th className="py-3 px-4">Book Title & Details</th>
                    <th className="py-3 px-3">Grade & Subject</th>
                    <th className="py-3 px-3">Publisher</th>
                    <th className="py-3 px-3 text-right">MRP</th>
                    <th className="py-3 px-3 text-right">Selling Price</th>
                    <th className="py-3 px-3 text-right">Stock</th>
                    <th className="py-3 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {relatedProducts.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4">
                        <p className="font-bold text-slate-900 leading-snug">{p.title}</p>
                        <span className="font-mono text-[10px] text-slate-400 block mt-0.5">
                          ISBN: {p.isbn} • SKU: {p.sku}
                        </span>
                      </td>

                      <td className="py-3 px-3">
                        <span className="font-medium text-slate-800 block">{p.grade}</span>
                        <span className="text-[11px] text-slate-500">{p.subject}</span>
                      </td>

                      <td className="py-3 px-3 text-slate-700">{p.publisher}</td>

                      <td className="py-3 px-3 text-right text-slate-500">
                        ₹{p.mrp.toLocaleString('en-IN')}
                      </td>

                      <td className="py-3 px-3 text-right font-bold text-slate-900">
                        ₹{p.sellingPrice.toLocaleString('en-IN')}
                      </td>

                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                        {p.stockQuantity}
                      </td>

                      <td className="py-3 px-3">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            p.status === 'in_stock'
                              ? 'bg-emerald-50 text-emerald-800'
                              : p.status === 'low_stock'
                              ? 'bg-amber-50 text-amber-800'
                              : 'bg-rose-50 text-rose-800'
                          }`}
                        >
                          {p.status.replace('_', ' ')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Edit Supplier Modal */}
      {isEditModalOpen && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-supplier-title"
        >
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden my-8">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <div>
                <h3 id="edit-supplier-title" className="text-base font-bold text-slate-900">
                  Edit Supplier Profile
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Update vendor details, contact person, location, and tax identifiers.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleEditSubmit} className="p-5 space-y-4 text-xs">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              {formSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{formSuccess}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">
                    Publisher / Supplier Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Supplier Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 uppercase font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Contact Person *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.contactPerson}
                    onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Official Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Contact Phone *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">
                    Street Address *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    City *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    State *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    GSTIN Tax Identifier *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.gstin}
                    onChange={(e) => setFormData({ ...formData, gstin: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 uppercase font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">
                    Supplied Publishers / Imprints (Comma-separated)
                  </label>
                  <input
                    type="text"
                    value={publishersInput}
                    onChange={(e) => setPublishersInput(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditModalOpen(false)}
                  disabled={isSaving}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" isLoading={isSaving}>
                  Save Changes
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
