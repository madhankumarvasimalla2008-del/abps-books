'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Truck,
  Building2,
  Phone,
  Mail,
  Plus,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Search,
  RotateCcw,
  BookOpen,
  Filter,
  X,
  AlertCircle,
  MapPin,
  FileText,
  ShieldCheck,
} from 'lucide-react';
import { useSuppliers, CreateSupplierInput } from '@/context/SupplierContext';
import { Supplier } from '@/types';
import { Button, buttonVariants } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

type SortOption = 'name-asc' | 'name-desc' | 'code-asc' | 'city-asc';

export default function AdminSuppliersPage() {
  const { suppliers, addSupplier, toggleSupplierStatus, resetSuppliersToDefaults } = useSuppliers();

  // Search & Filter State
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedState, setSelectedState] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOption>('name-asc');

  // Add Supplier Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<CreateSupplierInput>({
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

  // Extract unique states for filter
  const states = useMemo(() => {
    return Array.from(new Set(suppliers.map((s) => s.state))).filter(Boolean).sort();
  }, [suppliers]);

  // Summary Metrics
  const stats = useMemo(() => {
    const total = suppliers.length;
    const active = suppliers.filter((s) => s.status === 'active').length;
    const inactive = total - active;
    const uniqueStates = new Set(suppliers.map((s) => s.state)).size;
    return { total, active, inactive, uniqueStates };
  }, [suppliers]);

  // Filter & Sort Logic
  const filteredSuppliers = useMemo(() => {
    return suppliers
      .filter((s) => {
        const q = search.trim().toLowerCase();
        const matchesSearch =
          !q ||
          s.name.toLowerCase().includes(q) ||
          s.code.toLowerCase().includes(q) ||
          s.contactPerson.toLowerCase().includes(q) ||
          s.city.toLowerCase().includes(q) ||
          s.state.toLowerCase().includes(q) ||
          s.gstin.toLowerCase().includes(q) ||
          s.email.toLowerCase().includes(q) ||
          s.phone.includes(q) ||
          (s.suppliedPublishers && s.suppliedPublishers.some((p) => p.toLowerCase().includes(q)));

        const matchesStatus = selectedStatus === 'all' || s.status === selectedStatus;
        const matchesState = selectedState === 'all' || s.state === selectedState;

        return matchesSearch && matchesStatus && matchesState;
      })
      .sort((a, b) => {
        if (sortBy === 'name-asc') return a.name.localeCompare(b.name);
        if (sortBy === 'name-desc') return b.name.localeCompare(a.name);
        if (sortBy === 'code-asc') return a.code.localeCompare(b.code);
        if (sortBy === 'city-asc') return a.city.localeCompare(b.city);
        return 0;
      });
  }, [suppliers, search, selectedStatus, selectedState, sortBy]);

  const handleResetFilters = () => {
    setSearch('');
    setSelectedStatus('all');
    setSelectedState('all');
    setSortBy('name-asc');
  };

  const handleOpenAddModal = () => {
    setFormData({
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
    setPublishersInput('');
    setFormError(null);
    setFormSuccess(null);
    setIsAddModalOpen(true);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError(null);

    const parsedPublishers = publishersInput
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean);

    const result = addSupplier({
      ...formData,
      suppliedPublishers: parsedPublishers.length > 0 ? parsedPublishers : [formData.name.trim()],
    });

    if (result.success && result.supplier) {
      setFormSuccess(`Supplier "${result.supplier.name}" (${result.supplier.code}) added successfully.`);
      setTimeout(() => {
        setIsAddModalOpen(false);
        setFormSuccess(null);
      }, 1000);
    } else {
      setFormError(result.error || 'Failed to add supplier. Please verify input fields.');
    }
    setIsSubmitting(false);
  };

  const handleToggleStatus = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    toggleSupplierStatus(id);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
              Publishers & Print Press Suppliers
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              {stats.total} Suppliers
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Authorized textbook publishers, government educational councils, and distribution partners.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={resetSuppliersToDefaults}
            leftIcon={<RotateCcw className="w-3.5 h-3.5 text-slate-500" />}
            title="Reset supplier repository back to default sample records"
          >
            Reset Defaults
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleOpenAddModal}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Add Publisher / Supplier
          </Button>
        </div>
      </div>

      {/* Demo State Banner */}
      <div className="bg-slate-900 text-slate-100 px-4 py-2.5 rounded-xl text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 shadow-xs">
        <div className="flex items-center gap-2">
          <Truck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            <strong className="text-white font-semibold">Supplier Directory:</strong>{' '}
            Supplier profiles and tax identifiers are stored locally in the admin repository without mutating transaction records.
          </span>
        </div>
        <span className="font-mono text-[11px] text-slate-400">
          Storage: <code className="text-emerald-400">abps_admin_suppliers_v1</code>
        </span>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">
            Total Suppliers
          </span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-xl font-bold text-slate-900">{stats.total}</span>
            <span className="text-xs text-slate-400">Registered</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">
            Active Vendors
          </span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-xl font-bold text-emerald-700">{stats.active}</span>
            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-medium">
              <CheckCircle2 className="w-3 h-3" /> Ready
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">
            Inactive / On Hold
          </span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-xl font-bold text-slate-600">{stats.inactive}</span>
            <span className="text-xs text-slate-400">Disabled</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">
            Supply Regions
          </span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-xl font-bold text-slate-900">{stats.uniqueStates}</span>
            <span className="text-xs text-slate-400">States</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search by publisher name, code, contact person, city, state, or GSTIN..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-all"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded"
                aria-label="Clear search input"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 text-slate-700 font-medium"
            aria-label="Filter by Status"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>

          {/* State Filter */}
          <select
            value={selectedState}
            onChange={(e) => setSelectedState(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 text-slate-700 font-medium"
            aria-label="Filter by State"
          >
            <option value="all">All States ({states.length})</option>
            {states.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 text-slate-700 font-medium"
            aria-label="Sort Suppliers"
          >
            <option value="name-asc">Sort: Name (A to Z)</option>
            <option value="name-desc">Sort: Name (Z to A)</option>
            <option value="code-asc">Sort: Supplier Code</option>
            <option value="city-asc">Sort: City</option>
          </select>
        </div>

        {/* Active Filter Indicators */}
        {(search || selectedStatus !== 'all' || selectedState !== 'all') && (
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
            <span className="text-slate-500 text-[11px]">
              Showing <strong className="text-slate-900 font-semibold">{filteredSuppliers.length}</strong> of{' '}
              {suppliers.length} suppliers
            </span>
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-xs text-emerald-700 hover:text-emerald-800 font-medium hover:underline"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* Suppliers Table View */}
      {filteredSuppliers.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-8 sm:p-12 text-center shadow-xs">
          <Truck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-900">No suppliers found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
            {search || selectedStatus !== 'all' || selectedState !== 'all'
              ? 'No suppliers match your current filter and search criteria.'
              : 'There are currently no registered suppliers in the system.'}
          </p>
          {search || selectedStatus !== 'all' || selectedState !== 'all' ? (
            <Button variant="outline" size="sm" onClick={handleResetFilters}>
              Reset Filters
            </Button>
          ) : (
            <Button variant="primary" size="sm" onClick={handleOpenAddModal} leftIcon={<Plus className="w-4 h-4" />}>
              Add Supplier
            </Button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-600 font-semibold border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Publisher / Press Name</th>
                  <th className="py-3 px-3">Contact Person & Info</th>
                  <th className="py-3 px-3">Location</th>
                  <th className="py-3 px-3">GSTIN / Tax ID</th>
                  <th className="py-3 px-3">Supplied Imprints</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSuppliers.map((supplier) => (
                  <tr key={supplier.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="space-y-0.5">
                        <Link
                          href={`/admin/suppliers/${supplier.id}`}
                          className="font-bold text-slate-900 hover:text-emerald-700 transition-colors leading-snug block"
                        >
                          {supplier.name}
                        </Link>
                        <span className="font-mono text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded inline-block">
                          {supplier.code}
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-3">
                      <div className="space-y-0.5">
                        <span className="font-medium text-slate-800 block">{supplier.contactPerson}</span>
                        <div className="flex items-center gap-1 text-[11px] text-slate-500">
                          <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate max-w-[160px]">{supplier.email}</span>
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-slate-500">
                          <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{supplier.phone}</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-3">
                      <div className="flex items-start gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-medium text-slate-800 block">{supplier.city}</span>
                          <span className="text-[11px] text-slate-500">{supplier.state}</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-3">
                      <span className="font-mono text-[11px] text-slate-700 bg-slate-50 px-2 py-0.5 rounded border border-slate-200/60 block w-fit">
                        {supplier.gstin}
                      </span>
                    </td>

                    <td className="py-3.5 px-3">
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {supplier.suppliedPublishers && supplier.suppliedPublishers.length > 0 ? (
                          supplier.suppliedPublishers.map((pub, idx) => (
                            <span
                              key={idx}
                              className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-medium truncate max-w-[180px]"
                            >
                              {pub}
                            </span>
                          ))
                        ) : (
                          <span className="text-[11px] text-slate-400">Direct</span>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-3">
                      <button
                        type="button"
                        onClick={(e) => handleToggleStatus(e, supplier.id)}
                        className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border transition-colors cursor-pointer ${
                          supplier.status === 'active'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                            : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                        }`}
                        title="Click to toggle status"
                      >
                        {supplier.status === 'active' ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Active</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3 text-slate-400" />
                            <span>Inactive</span>
                          </>
                        )}
                      </button>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <Link
                        href={`/admin/suppliers/${supplier.id}`}
                        className={buttonVariants({
                          variant: 'outline',
                          size: 'sm',
                          className: 'text-xs gap-1.5',
                        })}
                      >
                        <span>Details</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Supplier Modal */}
      {isAddModalOpen && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-supplier-title"
        >
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden my-8">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <div>
                <h3 id="add-supplier-title" className="text-base font-bold text-slate-900">
                  Register New Publisher / Supplier
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Add an authorized publisher or distribution vendor to the administrative repository.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleAddSubmit} className="p-5 space-y-4 text-xs">
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
                    placeholder="e.g. National Council of Educational Research and Training"
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
                    placeholder="e.g. SUP-NCERT"
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
                    placeholder="e.g. Publication Division In-Charge"
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
                    placeholder="e.g. sales@publisher.org"
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
                    placeholder="e.g. 011-26560620"
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
                    placeholder="e.g. Sri Aurobindo Marg, Hauz Khas"
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
                    placeholder="e.g. New Delhi"
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
                    placeholder="e.g. Delhi"
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
                    placeholder="e.g. 07AAACN0023XXXX"
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
                    placeholder="e.g. NCERT, CBSE Board Publications"
                    value={publishersInput}
                    onChange={(e) => setPublishersInput(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Leave blank to automatically associate this vendor with its own publisher name.
                  </p>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAddModalOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
                  Create Supplier
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
