'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Building2,
  Search,
  MapPin,
  Plus,
  ArrowRight,
  RotateCcw,
  CheckCircle2,
  XCircle,
  X,
  AlertCircle,
} from 'lucide-react';
import { useBranches, CreateBranchInput } from '@/context/BranchContext';
import { Branch } from '@/types';
import { Button, buttonVariants } from '@/components/ui/Button';

type SortOption = 'name-asc' | 'name-desc' | 'code-asc' | 'city-asc';

export default function AdminBranchesPage() {
  const { branches, addBranch, resetBranchesToDefaults } = useBranches();

  // Filter & Search State
  const [search, setSearch] = useState('');
  const [selectedState, setSelectedState] = useState<string>('all');
  const [selectedZone, setSelectedZone] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOption>('name-asc');

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // New Branch Form State
  const [formData, setFormData] = useState<CreateBranchInput>({
    name: '',
    code: '',
    city: '',
    state: '',
    pincode: '',
    zone: 'Central',
    address: '',
    phone: '',
    email: '',
    status: 'active',
  });

  // Calculate Unique States and Zones for Filters
  const states = useMemo(() => {
    return Array.from(new Set(branches.map((b) => b.state))).filter(Boolean).sort();
  }, [branches]);

  const zones = useMemo(() => {
    return ['North', 'South', 'East', 'West', 'Central'];
  }, []);

  // Summary Metrics
  const stats = useMemo(() => {
    const total = branches.length;
    const active = branches.filter((b) => b.status === 'active').length;
    const inactive = total - active;
    return { total, active, inactive };
  }, [branches]);

  // Filter & Sort Logic
  const filteredBranches = useMemo(() => {
    return branches
      .filter((b) => {
        const q = search.trim().toLowerCase();
        const matchesSearch =
          !q ||
          b.name.toLowerCase().includes(q) ||
          b.code.toLowerCase().includes(q) ||
          b.city.toLowerCase().includes(q) ||
          b.state.toLowerCase().includes(q) ||
          b.pincode.includes(q) ||
          (b.email && b.email.toLowerCase().includes(q)) ||
          (b.phone && b.phone.includes(q));

        const matchesState = selectedState === 'all' || b.state === selectedState;
        const matchesZone = selectedZone === 'all' || b.zone === selectedZone;
        const matchesStatus = selectedStatus === 'all' || b.status === selectedStatus;

        return matchesSearch && matchesState && matchesZone && matchesStatus;
      })
      .sort((a, b) => {
        if (sortBy === 'name-asc') return a.name.localeCompare(b.name);
        if (sortBy === 'name-desc') return b.name.localeCompare(a.name);
        if (sortBy === 'code-asc') return a.code.localeCompare(b.code);
        if (sortBy === 'city-asc') return a.city.localeCompare(b.city);
        return 0;
      });
  }, [branches, search, selectedState, selectedZone, selectedStatus, sortBy]);

  const handleResetFilters = () => {
    setSearch('');
    setSelectedState('all');
    setSelectedZone('all');
    setSelectedStatus('all');
    setSortBy('name-asc');
  };

  const handleOpenAddModal = () => {
    setFormData({
      name: '',
      code: '',
      city: '',
      state: '',
      pincode: '',
      zone: 'Central',
      address: '',
      phone: '',
      email: '',
      status: 'active',
    });
    setFormError(null);
    setFormSuccess(null);
    setIsAddModalOpen(true);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError(null);

    const result = addBranch(formData);

    if (result.success && result.branch) {
      setFormSuccess(`Branch "${result.branch.name}" (${result.branch.code}) created successfully.`);
      setTimeout(() => {
        setIsAddModalOpen(false);
        setFormSuccess(null);
      }, 1000);
    } else {
      setFormError(result.error || 'Failed to create branch. Please verify input fields.');
    }
    setIsSubmitting(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
              Branches
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              {stats.total} Branches
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Manage Aditya Birla Public School branches, delivery hubs, and institutional locations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={resetBranchesToDefaults}
            leftIcon={<RotateCcw className="w-3.5 h-3.5 text-slate-500" />}
            title="Reset branch directory back to default sample records"
          >
            Reset Defaults
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleOpenAddModal}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Add Branch
          </Button>
        </div>
      </div>

      {/* Demo State Banner */}
      <div className="bg-slate-900 text-slate-100 px-4 py-2.5 rounded-xl text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 shadow-xs">
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            <strong className="text-white font-semibold">Branch Repository:</strong>{' '}
            Branch changes update local administrative state and consignee addresses without mutating historical order snapshots.
          </span>
        </div>
        <span className="font-mono text-[11px] text-slate-400">
          Storage: <code className="text-emerald-400">abps_admin_branches_v1</code>
        </span>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Total Branches</span>
            <Building2 className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">All registered branches</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Active Branches</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-emerald-700">{stats.active}</p>
          <p className="text-[11px] text-emerald-600 mt-0.5">Currently operational</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Inactive Branches</span>
            <XCircle className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-2xl font-bold text-slate-600">{stats.inactive}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Currently inactive</p>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search by branch name, code, city, state, phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 text-slate-900 placeholder:text-slate-400"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* State Filter */}
          <div className="w-full md:w-44">
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 text-slate-700 font-medium"
            >
              <option value="all">All States ({states.length})</option>
              {states.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Zone Filter */}
          <div className="w-full md:w-36">
            <select
              value={selectedZone}
              onChange={(e) => setSelectedZone(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 text-slate-700 font-medium"
            >
              <option value="all">All Zones</option>
              {zones.map((z) => (
                <option key={z} value={z}>
                  {z} Zone
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="w-full md:w-32">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 text-slate-700 font-medium"
            >
              <option value="all">All Status</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>

          {/* Sort By */}
          <div className="w-full md:w-44">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 text-slate-700 font-medium"
            >
              <option value="name-asc">Sort: Name (A-Z)</option>
              <option value="name-desc">Sort: Name (Z-A)</option>
              <option value="code-asc">Sort: Branch Code</option>
              <option value="city-asc">Sort: City (A-Z)</option>
            </select>
          </div>
        </div>

        {/* Active Filter Chips */}
        {(search || selectedState !== 'all' || selectedZone !== 'all' || selectedStatus !== 'all') && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
            <span className="text-slate-500 font-medium">Active filters:</span>
            {search && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px]">
                Search: &quot;{search}&quot;
                <button type="button" onClick={() => setSearch('')}>
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {selectedState !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px]">
                State: {selectedState}
                <button type="button" onClick={() => setSelectedState('all')}>
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {selectedZone !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px]">
                Zone: {selectedZone}
                <button type="button" onClick={() => setSelectedZone('all')}>
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {selectedStatus !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px]">
                Status: {selectedStatus}
                <button type="button" onClick={() => setSelectedStatus('all')}>
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-xs text-slate-500 hover:text-slate-800 underline ml-auto"
            >
              Clear All Filters
            </button>
          </div>
        )}
      </div>

      {/* Branches List / Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        {filteredBranches.length === 0 ? (
          <div className="p-12 text-center">
            <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-900">No Branches Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
              No branch records match your filter criteria. Try adjusting your search query or reset the filters.
            </p>
            <div className="flex items-center justify-center gap-3">
              <Button variant="outline" size="sm" onClick={handleResetFilters}>
                Reset Filters
              </Button>
              <Button variant="primary" size="sm" onClick={handleOpenAddModal}>
                Add Branch
              </Button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200/80">
                <tr>
                  <th className="py-3 px-4">Branch & Code</th>
                  <th className="py-3 px-3">Location & Zone</th>
                  <th className="py-3 px-3">Contact</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBranches.map((branch: Branch) => {
                  return (
                    <tr
                      key={branch.id}
                      className="hover:bg-slate-50/70 transition-colors group"
                    >
                      {/* Branch & Code */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-start gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700 font-bold shrink-0 text-xs">
                            {branch.code.slice(-3)}
                          </div>
                          <div>
                            <Link
                              href={`/admin/branches/${branch.id}`}
                              className="font-bold text-slate-900 hover:text-emerald-700 transition-colors block leading-tight"
                            >
                              {branch.name}
                            </Link>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="font-mono text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded font-semibold border border-slate-200">
                                {branch.code}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Location & Zone */}
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-1.5 text-slate-800 font-medium">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>
                            {branch.city}, {branch.state}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 block font-mono mt-0.5">
                          PIN: {branch.pincode} • {branch.zone} Zone
                        </span>
                      </td>

                      {/* Contact */}
                      <td className="py-3.5 px-3">
                        <div className="font-medium text-slate-800">
                          {branch.phone || branch.email || 'N/A'}
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                          <span className="font-mono">{branch.email}</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-3 text-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                            branch.status === 'active'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                        >
                          {branch.status === 'active' ? 'Active' : 'Inactive'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <Link
                          href={`/admin/branches/${branch.id}`}
                          className={buttonVariants({
                            variant: 'outline',
                            size: 'sm',
                            className: 'gap-1.5',
                          })}
                        >
                          <span>Manage</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer info */}
        <div className="p-3 bg-slate-50 border-t border-slate-200/80 text-[11px] text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            Showing <strong className="text-slate-800">{filteredBranches.length}</strong> of{' '}
            <strong className="text-slate-800">{branches.length}</strong> total branches
          </span>
          <span className="text-slate-400">
            Click &quot;Manage&quot; on any row to view branch details.
          </span>
        </div>
      </div>

      {/* Add Branch Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-2xl w-full my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-100 text-emerald-800 rounded-lg">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Add Branch
                  </h3>
                  <p className="text-xs text-slate-500">
                    Register a new branch location
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200/50 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleAddSubmit}>
              <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                {formError && (
                  <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    <span>{formError}</span>
                  </div>
                )}

                {formSuccess && (
                  <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{formSuccess}</span>
                  </div>
                )}

                {/* Branch Name & Code */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Branch Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Branch Name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Branch Code *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. BR-001"
                      value={formData.code}
                      onChange={(e) =>
                        setFormData({ ...formData, code: e.target.value.toUpperCase() })
                      }
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 font-mono text-slate-900 font-semibold"
                    />
                  </div>
                </div>

                {/* City, State, Pincode, Zone */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      City *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Mumbai"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      State *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Maharashtra"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Pincode (6-Digit) *
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      placeholder="e.g. 400001"
                      value={formData.pincode}
                      onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 font-mono text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Zone
                    </label>
                    <select
                      value={formData.zone}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          zone: e.target.value as 'North' | 'South' | 'East' | 'West' | 'Central',
                        })
                      }
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 text-slate-900"
                    >
                      <option value="West">West Zone</option>
                      <option value="North">North Zone</option>
                      <option value="East">East Zone</option>
                      <option value="South">South Zone</option>
                      <option value="Central">Central Zone</option>
                    </select>
                  </div>
                </div>

                {/* Street Address */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Shipping Address *
                  </label>
                  <textarea
                    required
                    rows={2}
                    placeholder="Full postal address for shipping"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 text-slate-900"
                  />
                </div>

                {/* Contact Phone & Email */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Contact Phone *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. 9876543210"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Contact Email *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. branch@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 text-slate-900"
                    />
                  </div>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        status: e.target.value as 'active' | 'inactive',
                      })
                    }
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 text-slate-900"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAddModalOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={isSubmitting}
                  leftIcon={<Plus className="w-4 h-4" />}
                >
                  {isSubmitting ? 'Creating...' : 'Create Branch'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
