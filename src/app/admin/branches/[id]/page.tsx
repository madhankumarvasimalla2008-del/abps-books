'use client';

import React, { use, useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Building2,
  MapPin,
  Users,
  Phone,
  Mail,
  ArrowRight,
  Edit,
  Power,
  CheckCircle2,
  AlertCircle,
  ShoppingBag,
  ExternalLink,
  Truck,
  X,
} from 'lucide-react';
import { useBranches, UpdateBranchInput } from '@/context/BranchContext';
import { useCustomers } from '@/context/CustomerContext';
import { useOrders } from '@/context/OrderContext';
import { Customer, Order } from '@/types';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Button } from '@/components/ui/Button';

export default function AdminBranchDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const { getBranch, updateBranch, toggleBranchStatus } = useBranches();
  const { customers } = useCustomers();
  const { orders } = useOrders();

  const branch = getBranch(resolvedParams.id);

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // Status Action State
  const [statusFeedback, setStatusFeedback] = useState<string | null>(null);

  // Edit Form Fields
  const [formData, setFormData] = useState<UpdateBranchInput>({
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

  // Associated Accounts from CustomerContext (Dynamic Filter)
  const branchCustomers = useMemo(() => {
    if (!branch) return [];
    return customers.filter(
      (c: Customer) => c.branchId && c.branchId.toLowerCase() === branch.id.toLowerCase()
    );
  }, [customers, branch]);

  // Associated Orders from OrderContext (Dynamic Filter)
  const branchOrders = useMemo(() => {
    if (!branch) return [];
    return orders.filter(
      (o: Order) => o.branchId && o.branchId.toLowerCase() === branch.id.toLowerCase()
    );
  }, [orders, branch]);

  // Total order value calculation
  const totalOrdersAmount = useMemo(() => {
    return branchOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  }, [branchOrders]);

  if (!branch) {
    return (
      <div className="space-y-6">
        <Breadcrumbs
          items={[
            { label: 'Branches', href: '/admin/branches' },
            { label: 'Branch Not Found' },
          ]}
        />
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-xs">
          <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-slate-900">Branch Record Not Found</h2>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-6">
            The requested branch with identifier &quot;{resolvedParams.id}&quot; does not exist or has been removed.
          </p>
          <Link href="/admin/branches">
            <Button variant="primary" size="sm">
              Back to Branches
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const handleOpenEdit = () => {
    setFormData({
      name: branch.name,
      code: branch.code,
      city: branch.city,
      state: branch.state,
      pincode: branch.pincode,
      zone: branch.zone,
      address: branch.address,
      phone: branch.phone,
      email: branch.email,
      status: branch.status,
    });
    setFormError(null);
    setFormSuccess(null);
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setFormError(null);

    const result = updateBranch(branch.id, formData);

    if (result.success && result.branch) {
      setFormSuccess('Branch updated successfully.');
      setTimeout(() => {
        setIsEditModalOpen(false);
        setFormSuccess(null);
      }, 800);
    } else {
      setFormError(result.error || 'Failed to update branch.');
    }
    setIsSaving(false);
  };

  const handleToggleStatus = () => {
    const res = toggleBranchStatus(branch.id);
    if (res.success && res.branch) {
      setStatusFeedback(
        `Branch status set to ${res.branch.status === 'active' ? 'Active' : 'Inactive'}.`
      );
      setTimeout(() => setStatusFeedback(null), 3000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: 'Branches', href: '/admin/branches' },
          { label: branch.name },
        ]}
      />

      {/* Status Feedback Toast */}
      {statusFeedback && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{statusFeedback}</span>
          </div>
          <button
            type="button"
            onClick={() => setStatusFeedback(null)}
            className="text-emerald-600 hover:text-emerald-800 text-xs"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Header Profile */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center shrink-0 border border-emerald-100 font-mono font-bold text-lg">
            {branch.code.slice(-3)}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900">{branch.name}</h1>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                  branch.status === 'active'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-slate-100 text-slate-600 border-slate-200'
                }`}
              >
                {branch.status === 'active' ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
              <span>
                Code: <strong className="font-mono text-slate-800">{branch.code}</strong>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                {branch.city}, {branch.state} ({branch.zone} Zone)
              </span>
            </div>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex flex-wrap items-center gap-2 pt-2 md:pt-0">
          <Button
            variant="outline"
            size="sm"
            onClick={handleToggleStatus}
            leftIcon={<Power className="w-3.5 h-3.5" />}
          >
            {branch.status === 'active' ? 'Set Inactive' : 'Set Active'}
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleOpenEdit}
            leftIcon={<Edit className="w-3.5 h-3.5" />}
          >
            Edit Branch
          </Button>

          <Link href={`/branches/${branch.id}`} target="_blank">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<ExternalLink className="w-3.5 h-3.5 text-slate-500" />}
              title="Open customer-facing branch view in new tab"
            >
              Public View
            </Button>
          </Link>
        </div>
      </div>

      {/* 2-Column Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Column 1: Branch Information */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3 text-xs">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
            <Building2 className="w-4 h-4 text-emerald-600" />
            <h2 className="font-bold text-slate-900 text-sm">Branch Information</h2>
          </div>

          <div className="space-y-2.5">
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Branch ID:</span>
              <span className="font-mono font-semibold text-slate-800">{branch.id}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Branch Code:</span>
              <span className="font-mono font-semibold text-slate-800">{branch.code}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">City / State:</span>
              <span className="font-semibold text-slate-800">
                {branch.city}, {branch.state}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Postal Pincode:</span>
              <span className="font-mono font-semibold text-slate-800">{branch.pincode}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Regional Zone:</span>
              <span className="font-semibold text-slate-800">{branch.zone} Zone</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-slate-100">
              <span className="text-slate-500">Contact Phone:</span>
              <span className="font-mono text-slate-700">{branch.phone}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Contact Email:</span>
              <span className="font-mono text-slate-700">{branch.email}</span>
            </div>
          </div>
        </div>

        {/* Column 2: Shipping Address */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3 text-xs">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
            <Truck className="w-4 h-4 text-amber-600" />
            <h2 className="font-bold text-slate-900 text-sm">Shipping Address</h2>
          </div>

          <div className="space-y-2 text-slate-700">
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Default Delivery Address
              </span>
              <p className="font-medium text-slate-900 leading-relaxed">{branch.address}</p>
              <p className="text-[11px] text-slate-500 mt-1 font-mono">
                PIN: {branch.pincode} • {branch.city}, {branch.state}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Associated Accounts Section */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-600" />
            <h2 className="text-sm font-bold text-slate-900">
              Associated Accounts ({branchCustomers.length})
            </h2>
          </div>
          <span className="text-xs text-slate-400">
            Dynamically linked customer accounts
          </span>
        </div>

        {branchCustomers.length === 0 ? (
          <div className="p-8 text-center bg-slate-50/50 rounded-xl border border-slate-100">
            <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-700">No Associated Accounts Found</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              No customer accounts are currently associated with this branch.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200/80">
                <tr>
                  <th className="py-2.5 px-3">Name</th>
                  <th className="py-2.5 px-3">Role / Designation</th>
                  <th className="py-2.5 px-3">Email</th>
                  <th className="py-2.5 px-3">Phone</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {branchCustomers.map((account) => (
                  <tr key={account.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-3 font-bold text-slate-900">
                      <Link
                        href={`/admin/customers/${account.id}`}
                        className="hover:text-emerald-700 transition-colors"
                      >
                        {account.name}
                      </Link>
                    </td>
                    <td className="py-3 px-3 text-slate-600 font-medium">
                      {account.designation || 'Customer'}
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-600">{account.email}</td>
                    <td className="py-3 px-3 font-mono text-slate-600">{account.phone}</td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                          account.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}
                      >
                        {account.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <Link href={`/admin/customers/${account.id}`}>
                        <Button
                          variant="outline"
                          size="sm"
                          rightIcon={<ArrowRight className="w-3 h-3" />}
                        >
                          View Account
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

      {/* Associated Orders Section */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-emerald-600" />
            <h2 className="text-sm font-bold text-slate-900">
              Order History ({branchOrders.length})
            </h2>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span>
              Total Order Volume:{' '}
              <strong className="font-mono text-slate-900 font-bold">
                ₹{totalOrdersAmount.toLocaleString('en-IN')}
              </strong>
            </span>
            <span>•</span>
            <span className="text-slate-400">Linked via Order.branchId</span>
          </div>
        </div>

        {branchOrders.length === 0 ? (
          <div className="p-8 text-center bg-slate-50/50 rounded-xl border border-slate-100">
            <ShoppingBag className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-700">No Orders Found</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              No orders have been recorded under branch ID &quot;{branch.id}&quot;.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200/80">
                <tr>
                  <th className="py-2.5 px-3">Order Number</th>
                  <th className="py-2.5 px-3">Placed By</th>
                  <th className="py-2.5 px-3">Order Date</th>
                  <th className="py-2.5 px-3 text-right">Items</th>
                  <th className="py-2.5 px-3 text-right">Total Amount</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {branchOrders.map((order) => {
                  const itemCount =
                    order.items?.reduce((sum, item) => sum + item.quantity, 0) ||
                    order.items?.length ||
                    0;

                  return (
                    <tr key={order.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-3">
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="font-mono font-bold text-slate-900 hover:text-emerald-700 transition-colors"
                        >
                          {order.orderNumber || order.id}
                        </Link>
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-medium text-slate-800 block">
                          {order.customerName}
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono">
                          {order.customerEmail}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-600">
                        {order.createdAt
                          ? new Date(order.createdAt).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })
                          : 'Recent'}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-semibold text-slate-800">
                        {itemCount}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                        ₹{(order.totalAmount || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                            order.status === 'Delivered'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : order.status === 'Shipped'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : order.status === 'Cancelled'
                              ? 'bg-red-50 text-red-700 border-red-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          {order.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <Link href={`/admin/orders/${order.id}`}>
                          <Button
                            variant="outline"
                            size="sm"
                            rightIcon={<ArrowRight className="w-3 h-3" />}
                          >
                            View Order
                          </Button>
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

      {/* Edit Branch Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-2xl w-full my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-100 text-emerald-800 rounded-lg">
                  <Edit className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Edit Branch
                  </h3>
                  <p className="text-xs text-slate-500">
                    Update branch details and contact information
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200/50 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleSaveEdit}>
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
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          phone: e.target.value,
                        })
                      }
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
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          email: e.target.value,
                        })
                      }
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
                  onClick={() => setIsEditModalOpen(false)}
                  disabled={isSaving}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={isSaving}
                  leftIcon={<CheckCircle2 className="w-4 h-4" />}
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
