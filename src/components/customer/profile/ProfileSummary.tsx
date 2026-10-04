'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  User,
  Mail,
  Phone,
  Building2,
  Edit2,
  Package,
  MapPin,
  ShieldCheck,
  ArrowRight,
  Clock,
  LogOut,
} from 'lucide-react';
import { useCustomer } from '@/context/CustomerContext';
import { useOrders } from '@/context/OrderContext';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { OrderStatusBadge } from '@/components/customer/orders/OrderStatusBadge';
import { ProfileEditModal } from './ProfileEditModal';

export const ProfileSummary: React.FC = () => {
  const { profile, updateProfile, addresses } = useCustomer();
  const { orders } = useOrders();
  const { logout } = useAuth();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Recent order is the first order in the list (or undefined if no orders)
  const recentOrder = orders.length > 0 ? orders[0] : undefined;

  return (
    <div className="space-y-6">
      {/* Personal Information Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#EBF7FA] text-[#023859] border border-[#D4EBF0] flex items-center justify-center font-bold text-lg shrink-0 shadow-2xs">
              {profile.name ? profile.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                {profile.name}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Customer Account
              </p>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsEditModalOpen(true)}
            leftIcon={<Edit2 className="w-3.5 h-3.5" />}
            className="text-xs font-semibold self-start sm:self-auto"
          >
            Edit Profile
          </Button>
        </div>

        {/* Details Grid */}
        <div className="p-5 sm:p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
          <div className="p-3.5 bg-slate-50/70 rounded-xl border border-slate-200/70 space-y-1">
            <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
              Email Address
            </span>
            <p className="font-semibold text-slate-800 break-all">{profile.email}</p>
          </div>

          <div className="p-3.5 bg-slate-50/70 rounded-xl border border-slate-200/70 space-y-1">
            <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
              Mobile Number
            </span>
            <p className="font-semibold text-slate-800">{profile.phone}</p>
          </div>

          {profile.branchName && (
            <div className="p-3.5 bg-slate-50/70 rounded-xl border border-slate-200/70 space-y-1 sm:col-span-2 lg:col-span-1">
              <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
                Affiliated Branch
              </span>
              <p className="font-semibold text-slate-800 truncate">{profile.branchName}</p>
            </div>
          )}
        </div>
      </div>

      {/* Account Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Orders Metric */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total Orders</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
              <Package className="w-4 h-4" aria-hidden="true" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">{orders.length}</div>
            <Link
              href="/orders"
              className="text-[11px] font-semibold text-[#023859] hover:text-[#54ACBF] flex items-center gap-1 mt-1"
            >
              <span>View order history</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Saved Addresses Metric */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Saved Addresses</span>
            <div className="w-8 h-8 rounded-xl bg-[#EBF7FA] text-[#023859] flex items-center justify-center">
              <MapPin className="w-4 h-4" aria-hidden="true" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">{addresses.length}</div>
            <Link
              href="/profile/addresses"
              className="text-[11px] font-semibold text-[#023859] hover:text-[#54ACBF] flex items-center gap-1 mt-1"
            >
              <span>Manage addresses</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Recent Order Metric */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Recent Order</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
              <Clock className="w-4 h-4" aria-hidden="true" />
            </div>
          </div>
          <div>
            {recentOrder ? (
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-slate-900">
                    {recentOrder.id}
                  </span>
                  <OrderStatusBadge status={recentOrder.status} type="order" />
                </div>
                <Link
                  href={`/orders/${recentOrder.id}`}
                  className="text-[11px] font-semibold text-[#023859] hover:text-[#54ACBF] flex items-center gap-1 mt-1"
                >
                  <span>View recent details</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            ) : (
              <div>
                <span className="text-xs text-slate-500 font-medium">No orders placed yet</span>
                <Link
                  href="/books"
                  className="text-[11px] font-semibold text-[#023859] hover:text-[#54ACBF] flex items-center gap-1 mt-1"
                >
                  <span>Browse books catalog</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Shortcuts & Account Operations */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 sm:p-6 space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Account Shortcuts
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Link
            href="/orders"
            className="p-4 rounded-xl border border-slate-200/80 hover:border-[#54ACBF] hover:bg-[#EBF7FA]/40 transition-colors group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#023859]"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Package className="w-4 h-4 text-[#023859]" />
                <span className="text-xs font-bold text-slate-900 group-hover:text-[#023859]">
                  My Orders
                </span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#54ACBF] group-hover:translate-x-0.5 transition-all" />
            </div>
            <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">
               View your recorded order history and current status.
            </p>
          </Link>

          <Link
            href="/profile/addresses"
            className="p-4 rounded-xl border border-slate-200/80 hover:border-[#54ACBF] hover:bg-[#EBF7FA]/40 transition-colors group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#023859]"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <MapPin className="w-4 h-4 text-[#023859]" />
                <span className="text-xs font-bold text-slate-900 group-hover:text-[#023859]">
                  Manage Addresses
                </span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#54ACBF] group-hover:translate-x-0.5 transition-all" />
            </div>
            <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">
              Add, edit, or configure your default delivery address.
            </p>
          </Link>

          <Link
            href="/profile/security"
            className="p-4 rounded-xl border border-slate-200/80 hover:border-[#54ACBF] hover:bg-[#EBF7FA]/40 transition-colors group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#023859]"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 text-[#023859]" />
                <span className="text-xs font-bold text-slate-900 group-hover:text-[#023859]">
                  Security Settings
                </span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#54ACBF] group-hover:translate-x-0.5 transition-all" />
            </div>
            <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">
              Password management and active session overview.
            </p>
          </Link>
        </div>

        {/* Sign Out Card Button */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
          <p className="text-xs text-slate-500">
            Finished with your session?
          </p>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={logout}
            leftIcon={<LogOut className="w-3.5 h-3.5 text-red-500" />}
            className="text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            Sign Out
          </Button>
        </div>
      </div>

      {/* Profile Edit Modal */}
      <ProfileEditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        profile={profile}
        onSave={updateProfile}
      />
    </div>
  );
};
