'use client';

import React, { use, useState, useMemo } from 'react';
import Link from 'next/link';
import {
  User,
  Building2,
  Phone,
  Mail,
  Calendar,
  ArrowRight,
  ShoppingBag,
  MapPin,
  Briefcase,
  CheckCircle2,
  XCircle,
  Edit2,
  UserCheck,
  UserX,
  AlertCircle,
  X,
  Package,
} from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { useCustomer } from '@/context/CustomerContext';
import { useOrders } from '@/context/OrderContext';
import { MOCK_BRANCHES } from '@/data/mockData';
import { Customer } from '@/types';

export default function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const customerId = resolvedParams.id;

  const { getCustomer, updateCustomer, toggleCustomerStatus } = useCustomer();
  const { orders } = useOrders();

  const customer = getCustomer(customerId);

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: '',
    phone: '',
    designation: '',
    branchId: '',
    streetAddress: '',
    city: '',
    state: '',
    pincode: '',
  });
  const [editError, setEditError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Dynamic Orders for this Customer
  const customerOrders = useMemo(() => {
    if (!customer) return [];
    return orders.filter((o) => o.customerId === customer.id);
  }, [customer, orders]);

  const totalSpent = useMemo(() => {
    return customerOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  }, [customerOrders]);

  const averageOrderValue = useMemo(() => {
    if (customerOrders.length === 0) return 0;
    return Math.round(totalSpent / customerOrders.length);
  }, [customerOrders.length, totalSpent]);

  const latestOrder = customerOrders[0];

  const handleOpenEditModal = () => {
    if (!customer) return;
    setEditFormData({
      name: customer.name,
      phone: customer.phone,
      designation: customer.designation || '',
      branchId: customer.branchId,
      streetAddress: customer.address?.streetAddress || customer.address?.addressLine1 || '',
      city: customer.address?.city || '',
      state: customer.address?.state || '',
      pincode: customer.address?.pincode || '',
    });
    setEditError(null);
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer) return;
    setEditError(null);

    const selectedBranch = MOCK_BRANCHES.find((b) => b.id === editFormData.branchId);

    const result = updateCustomer(customer.id, {
      name: editFormData.name.trim(),
      phone: editFormData.phone.trim(),
      designation: editFormData.designation.trim() || undefined,
      branchId: editFormData.branchId,
      branchName: selectedBranch?.name || customer.branchName,
      address: {
        ...customer.address,
        streetAddress: editFormData.streetAddress.trim(),
        addressLine1: editFormData.streetAddress.trim(),
        city: editFormData.city.trim(),
        state: editFormData.state.trim(),
        pincode: editFormData.pincode.trim(),
      },
    });

    if (!result.success) {
      setEditError(result.error || 'Failed to update customer details.');
      return;
    }

    setSuccessMessage('Customer profile updated successfully. Historical order snapshots remain preserved.');
    setIsEditModalOpen(false);
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  const handleToggleStatus = () => {
    if (!customer) return;
    const res = toggleCustomerStatus(customer.id);
    if (res.success) {
      setSuccessMessage(`Account status updated to "${res.customer?.status}".`);
      setTimeout(() => setSuccessMessage(null), 3000);
    }
  };

  // Graceful invalid ID fallback
  if (!customer) {
    return (
      <div className="space-y-6">
        <Breadcrumbs
          items={[
            { label: 'Customers', href: '/admin/customers' },
            { label: 'Customer Not Found' },
          ]}
        />

        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center max-w-lg mx-auto shadow-xs">
          <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h1 className="text-base font-bold text-slate-900 mb-1">Customer Account Not Found</h1>
          <p className="text-xs text-slate-500 mb-6">
            The customer identifier <code className="font-mono text-slate-700 bg-slate-100 px-1 py-0.5 rounded">{customerId}</code> does not exist in the administrative database.
          </p>
          <Link href="/admin/customers">
            <Button variant="primary" size="sm">
              Return to Customers Directory
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: 'Customers', href: '/admin/customers' },
          { label: customer.name },
        ]}
      />

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

      {/* Customer Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xl shrink-0">
            {customer.name
              .split(' ')
              .map((n) => n[0])
              .join('')
              .slice(0, 2)
              .toUpperCase()}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900">{customer.name}</h1>
              {customer.status === 'active' ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3" />
                  Active Account
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                  <XCircle className="w-3 h-3" />
                  Inactive Account
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {customer.designation || 'School Coordinator'} &bull;{' '}
              <span className="font-mono text-slate-400">ID: {customer.id}</span>
            </p>
            <p className="text-xs font-semibold text-slate-700 mt-1">{customer.branchName}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleToggleStatus}
            leftIcon={
              customer.status === 'active' ? (
                <UserX className="w-3.5 h-3.5 text-amber-600" />
              ) : (
                <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
              )
            }
          >
            {customer.status === 'active' ? 'Deactivate Account' : 'Activate Account'}
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleOpenEditModal}
            leftIcon={<Edit2 className="w-3.5 h-3.5" />}
          >
            Edit Customer
          </Button>
        </div>
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Account Details */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4 text-xs">
          <h2 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-2">
            Account Information
          </h2>

          <div className="space-y-3">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Customer ID</span>
              <p className="font-mono font-bold text-slate-900 text-sm">{customer.id}</p>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">System Role</span>
              <p className="font-semibold text-slate-800 capitalize">
                {customer.role.replace('_', ' ')}
              </p>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Designation</span>
              <p className="font-semibold text-slate-800">{customer.designation || 'School Coordinator'}</p>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Registered Since</span>
              <p className="font-semibold text-slate-800">
                {new Date(customer.registeredDate).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Account Status</span>
              <p className="font-semibold text-slate-800 capitalize">{customer.status}</p>
            </div>
          </div>
        </div>

        {/* Contact & Branch Details */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4 text-xs lg:col-span-2">
          <h2 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-2">
            Contact & Branch Details
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Email Address</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <p className="font-semibold text-slate-800">{customer.email}</p>
              </div>
            </div>

            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Phone Number</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <p className="font-mono font-semibold text-slate-800">{customer.phone}</p>
              </div>
            </div>

            <div className="sm:col-span-2">
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Branch</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                <p className="font-semibold text-slate-800">{customer.branchName}</p>
              </div>
            </div>

            <div className="sm:col-span-2">
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                Default Delivery Address
              </span>
              <div className="flex items-start gap-1.5 mt-0.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                <p className="text-slate-700 leading-relaxed">
                  {customer.address?.streetAddress ||
                    customer.address?.addressLine1 ||
                    'Main Campus Office'},{' '}
                  {customer.address?.city}, {customer.address?.state} - {customer.address?.pincode}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Order Statistics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 block">Total Orders</span>
          <div className="flex items-center justify-between mt-1">
            <span className="text-xl font-mono font-bold text-slate-900">
              {customerOrders.length > 0 ? customerOrders.length : customer.totalOrders || 0}
            </span>
            <div className="p-2 bg-slate-100 rounded-xl text-slate-600">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 block">Total Spent</span>
          <div className="flex items-center justify-between mt-1">
            <span className="text-xl font-mono font-bold text-slate-900">
              ₹{(totalSpent > 0 ? totalSpent : customer.totalSpent || 0).toLocaleString('en-IN')}
            </span>
            <div className="p-2 bg-emerald-50 rounded-xl text-emerald-800">
              <Package className="w-4 h-4" />
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 block">Avg Order Value</span>
          <div className="flex items-center justify-between mt-1">
            <span className="text-xl font-mono font-bold text-slate-900">
              ₹{averageOrderValue.toLocaleString('en-IN')}
            </span>
            <div className="p-2 bg-blue-50 rounded-xl text-blue-700">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 block">Latest Order Date</span>
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs font-semibold text-slate-800">
              {latestOrder
                ? new Date(latestOrder.createdAt).toLocaleDateString('en-IN')
                : 'No Orders Yet'}
            </span>
            <div className="p-2 bg-amber-50 rounded-xl text-amber-700">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>

      {/* Order History */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-slate-900 text-xs">
              Order History ({customerOrders.length})
            </h2>
            <p className="text-[11px] text-slate-400">
              Historical orders placed by this customer (ID: {customer.id})
            </p>
          </div>
        </div>

        {customerOrders.length === 0 ? (
          <div className="p-10 text-center">
            <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-2">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <h3 className="text-xs font-bold text-slate-800 mb-0.5">No orders recorded for this customer</h3>
            <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
              This customer account has not placed any textbook orders or requisitions yet.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Order Reference</th>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">PO Number</th>
                  <th className="py-3 px-3 text-right">Items</th>
                  <th className="py-3 px-3 text-right">Total Amount</th>
                  <th className="py-3 px-3">Payment</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {customerOrders.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50/50">
                    <td className="py-3.5 px-4">
                      <Link
                        href={`/admin/orders/${o.id}`}
                        className="font-mono font-bold text-slate-900 hover:text-emerald-700 block"
                      >
                        {o.orderNumber || o.id}
                      </Link>
                      <span className="text-[10px] text-slate-400 font-mono">ID: {o.id}</span>
                    </td>
                    <td className="py-3.5 px-3 text-slate-600">
                      {new Date(o.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="py-3.5 px-3 font-mono text-slate-700">
                      {o.schoolPoNumber || o.poNumber || '—'}
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono text-slate-700">
                      {o.totalQuantity || o.items?.length || 0}
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono font-bold text-slate-900">
                      ₹{o.totalAmount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-3">
                      <StatusBadge status={o.paymentStatus} type="payment" />
                    </td>
                    <td className="py-3.5 px-3">
                      <StatusBadge status={o.status} type="order" />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link href={`/admin/orders/${o.id}`}>
                        <Button variant="outline" size="sm" rightIcon={<ArrowRight className="w-3 h-3" />}>
                          View Order
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

      {/* Edit Customer Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">Edit Customer Information</h2>
                <p className="text-xs text-slate-500">
                  Update customer contact profile and delivery address
                </p>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {editError && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{editError}</span>
              </div>
            )}

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Customer Full Name *</label>
                  <input
                    type="text"
                    required
                    value={editFormData.name}
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={editFormData.phone}
                    onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Branch *</label>
                  <select
                    value={editFormData.branchId}
                    onChange={(e) => setEditFormData({ ...editFormData, branchId: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  >
                    {MOCK_BRANCHES.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Designation / Role</label>
                  <input
                    type="text"
                    value={editFormData.designation}
                    onChange={(e) => setEditFormData({ ...editFormData, designation: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
              </div>

              {/* Delivery Address */}
              <div className="border-t border-slate-100 pt-3 space-y-3">
                <h4 className="font-bold text-slate-900 text-xs">Delivery Address</h4>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Street Address</label>
                  <input
                    type="text"
                    value={editFormData.streetAddress}
                    onChange={(e) => setEditFormData({ ...editFormData, streetAddress: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">City</label>
                    <input
                      type="text"
                      value={editFormData.city}
                      onChange={(e) => setEditFormData({ ...editFormData, city: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">State</label>
                    <input
                      type="text"
                      value={editFormData.state}
                      onChange={(e) => setEditFormData({ ...editFormData, state: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">PIN Code</label>
                    <input
                      type="text"
                      value={editFormData.pincode}
                      onChange={(e) => setEditFormData({ ...editFormData, pincode: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    />
                  </div>
                </div>
              </div>

              {/* Immutability Notice */}
              <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-[11px] text-slate-500">
                <span className="font-semibold text-slate-700">Snapshot Integrity:</span> Modifying profile
                details updates future correspondence but preserves historical address snapshots and line items
                on previously submitted orders.
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <Button variant="outline" size="sm" type="button" onClick={() => setIsEditModalOpen(false)}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" type="submit">
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
