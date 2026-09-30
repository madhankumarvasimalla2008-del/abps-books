'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Users,
  Search,
  Building2,
  Phone,
  Mail,
  ArrowRight,
  Plus,
  Filter,
  CheckCircle2,
  XCircle,
  RotateCcw,
  UserCheck,
  UserX,
  MapPin,
  Briefcase,
  AlertCircle,
  X,
} from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Button, buttonVariants } from '@/components/ui/Button';
import { useCustomer, CreateCustomerInput } from '@/context/CustomerContext';
import { useOrders } from '@/context/OrderContext';
import { MOCK_BRANCHES } from '@/data/mockData';
import { Customer } from '@/types';

export default function AdminCustomersPage() {
  const { customers, addCustomer, toggleCustomerStatus, resetCustomersToDefaults } = useCustomer();
  const { orders } = useOrders();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [branchFilter, setBranchFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name_asc' | 'name_desc' | 'orders_desc' | 'spent_desc' | 'newest'>('name_asc');

  // Modal State for Registering Customer
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<CreateCustomerInput>({
    name: '',
    email: '',
    phone: '',
    branchId: MOCK_BRANCHES[0]?.id || 'b1',
    designation: '',
    status: 'active',
    address: {
      recipientName: '',
      phone: '',
      streetAddress: '',
      city: '',
      state: '',
      pincode: '',
    },
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Compute live customer stats from OrderContext
  const enrichedCustomers = useMemo(() => {
    return customers.map((customer) => {
      const customerOrders = orders.filter((o) => o.customerId === customer.id);
      const computedOrdersCount = customerOrders.length;
      const computedTotalSpent = customerOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

      return {
        ...customer,
        dynamicOrdersCount: computedOrdersCount > 0 ? computedOrdersCount : customer.totalOrders || 0,
        dynamicTotalSpent: computedTotalSpent > 0 ? computedTotalSpent : customer.totalSpent || 0,
      };
    });
  }, [customers, orders]);

  // Filtered & Sorted Customer list
  const filteredCustomers = useMemo(() => {
    return enrichedCustomers
      .filter((c) => {
        const query = search.trim().toLowerCase();
        const matchesSearch =
          !query ||
          c.name.toLowerCase().includes(query) ||
          c.email.toLowerCase().includes(query) ||
          c.phone.replace(/\D/g, '').includes(query.replace(/\D/g, '')) ||
          c.id.toLowerCase().includes(query) ||
          c.branchName.toLowerCase().includes(query) ||
          (c.designation && c.designation.toLowerCase().includes(query));

        const matchesStatus =
          statusFilter === 'all' || c.status === statusFilter;

        const matchesBranch =
          branchFilter === 'all' || c.branchId === branchFilter;

        return matchesSearch && matchesStatus && matchesBranch;
      })
      .sort((a, b) => {
        if (sortBy === 'name_asc') return a.name.localeCompare(b.name);
        if (sortBy === 'name_desc') return b.name.localeCompare(a.name);
        if (sortBy === 'orders_desc') return b.dynamicOrdersCount - a.dynamicOrdersCount;
        if (sortBy === 'spent_desc') return b.dynamicTotalSpent - a.dynamicTotalSpent;
        if (sortBy === 'newest') return new Date(b.registeredDate).getTime() - new Date(a.registeredDate).getTime();
        return 0;
      });
  }, [enrichedCustomers, search, statusFilter, branchFilter, sortBy]);

  const handleOpenModal = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      branchId: MOCK_BRANCHES[0]?.id || 'b1',
      designation: '',
      status: 'active',
      address: {
        recipientName: '',
        phone: '',
        streetAddress: '',
        city: '',
        state: '',
        pincode: '',
      },
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSaveCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const result = addCustomer({
      ...formData,
      address: {
        ...formData.address,
        recipientName: formData.address.recipientName || formData.name,
        phone: formData.address.phone || formData.phone,
      },
    });

    if (!result.success) {
      setFormError(result.error || 'Failed to register customer account.');
      return;
    }

    setSuccessMessage(`Customer account "${result.customer?.name}" created successfully.`);
    setIsModalOpen(false);
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  const handleToggleStatus = (id: string, name: string) => {
    const res = toggleCustomerStatus(id);
    if (res.success) {
      setSuccessMessage(`Account status for "${name}" updated to ${res.customer?.status}.`);
      setTimeout(() => setSuccessMessage(null), 3000);
    }
  };

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: 'Customers' }]} />

      {/* Demo Banner */}
      <div className="bg-emerald-50 border border-emerald-200/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-emerald-950">
              Administrative Customer Directory
            </h2>
            <p className="text-[11px] text-emerald-800">
              Manage authorized school coordinators and branch customer accounts.
            </p>
          </div>
        </div>
        <button
          onClick={() => {
            resetCustomersToDefaults();
            setSuccessMessage('Customer data restored to system defaults.');
            setTimeout(() => setSuccessMessage(null), 3000);
          }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-800 hover:text-emerald-950 hover:bg-emerald-100/70 rounded-xl transition-colors shrink-0"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset to Defaults
        </button>
      </div>

      {/* Success Notification */}
      {successMessage && (
        <div className="bg-emerald-600 text-white px-4 py-3 rounded-xl text-xs font-medium flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)}>
            <X className="w-4 h-4 opacity-80 hover:opacity-100" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
            Customer Accounts
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Customer accounts, school coordinators, and institutional contacts ({enrichedCustomers.length} total)
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={handleOpenModal}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Add Customer
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative lg:col-span-2">
            <input
              type="text"
              placeholder="Search by Customer Name, Email, Phone, or ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 font-medium text-slate-700"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>

          {/* Branch Filter */}
          <div>
            <select
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 font-medium text-slate-700"
            >
              <option value="all">All Branches</option>
              {MOCK_BRANCHES.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name.replace('The Aditya Birla Public School, ', '')}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Sort and Result Count */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
          <span className="text-slate-500">
            Showing <strong className="text-slate-800">{filteredCustomers.length}</strong> of{' '}
            {enrichedCustomers.length} customer accounts
          </span>

          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-[11px]">Sort By:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 font-medium text-slate-700"
            >
              <option value="name_asc">Name (A-Z)</option>
              <option value="name_desc">Name (Z-A)</option>
              <option value="orders_desc">Orders (High to Low)</option>
              <option value="spent_desc">Total Spent (High to Low)</option>
              <option value="newest">Newest Registration</option>
            </select>

            {(search || statusFilter !== 'all' || branchFilter !== 'all') && (
              <button
                onClick={() => {
                  setSearch('');
                  setStatusFilter('all');
                  setBranchFilter('all');
                }}
                className="text-[11px] text-emerald-800 hover:text-emerald-950 font-semibold underline ml-2"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {filteredCustomers.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-800 mb-1">No customer accounts match your criteria</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
              Try adjusting your search query, status filters, or branch selection.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearch('');
                setStatusFilter('all');
                setBranchFilter('all');
              }}
            >
              Reset Search & Filters
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Contact & Role</th>
                  <th className="py-3 px-3">Branch</th>
                  <th className="py-3 px-3">Contact Email & Phone</th>
                  <th className="py-3 px-3 text-right">Orders Placed</th>
                  <th className="py-3 px-3 text-right">Total Spent</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCustomers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 px-4">
                      <Link
                        href={`/admin/customers/${c.id}`}
                        className="font-bold text-slate-900 hover:text-emerald-700 block"
                      >
                        {c.name}
                      </Link>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[11px] text-slate-500 font-medium">
                          {c.designation || 'Coordinator'}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">({c.id})</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-3">
                      <span className="font-semibold text-slate-800 leading-snug block">
                        {c.branchName}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {c.address?.city}, {c.address?.state}
                      </span>
                    </td>
                    <td className="py-3.5 px-3">
                      <span className="text-slate-800 block font-medium">{c.email}</span>
                      <span className="text-[11px] font-mono text-slate-500">{c.phone}</span>
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono font-bold text-slate-900">
                      {c.dynamicOrdersCount}
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono font-bold text-slate-900">
                      ₹{c.dynamicTotalSpent.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-3">
                      {c.status === 'active' ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          <XCircle className="w-3 h-3" />
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleToggleStatus(c.id, c.name)}
                          title={c.status === 'active' ? 'Deactivate Account' : 'Activate Account'}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                        >
                          {c.status === 'active' ? (
                            <UserX className="w-3.5 h-3.5 text-amber-600" />
                          ) : (
                            <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                          )}
                        </button>
                        <Link
                          href={`/admin/customers/${c.id}`}
                          className={buttonVariants({
                            variant: 'outline',
                            size: 'sm',
                            className: 'gap-1.5',
                          })}
                        >
                          <span>Details</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Customer Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">Add Customer Account</h2>
                <p className="text-xs text-slate-500">Create a new customer profile and assign branch affiliation</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveCustomer} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Full Name */}
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Customer Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. Rajesh Sharma"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>

                {/* Email Address */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="coordinator@abps.edu"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 98765 43210"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>

                {/* Branch */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Branch *</label>
                  <select
                    value={formData.branchId}
                    onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  >
                    {MOCK_BRANCHES.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Designation */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Designation / Role</label>
                  <input
                    type="text"
                    placeholder="e.g. Academic Coordinator"
                    value={formData.designation}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
              </div>

              {/* Delivery Address Section */}
              <div className="border-t border-slate-100 pt-3 space-y-3">
                <h4 className="font-bold text-slate-900 text-xs">Default Delivery Address</h4>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Street Address</label>
                  <input
                    type="text"
                    placeholder="e.g. Birla Cellulosic Campus, Academic Block"
                    value={formData.address.streetAddress || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        address: { ...formData.address, streetAddress: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">City</label>
                    <input
                      type="text"
                      placeholder="City"
                      value={formData.address.city}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          address: { ...formData.address, city: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">State</label>
                    <input
                      type="text"
                      placeholder="State"
                      value={formData.address.state}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          address: { ...formData.address, state: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">PIN Code</label>
                    <input
                      type="text"
                      placeholder="394120"
                      value={formData.address.pincode}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          address: { ...formData.address, pincode: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    />
                  </div>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <Button variant="outline" size="sm" type="button" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" type="submit">
                  Save Customer Account
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
