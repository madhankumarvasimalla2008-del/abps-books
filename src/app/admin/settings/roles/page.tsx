'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Shield,
  Check,
  X,
  Users,
  Lock,
  ArrowLeft,
  Save,
  CheckCircle2,
} from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Button, buttonVariants } from '@/components/ui/Button';

interface RolePermission {
  module: string;
  superAdmin: boolean;
  inventoryManager: boolean;
  dispatchExecutive: boolean;
  accountsOfficer: boolean;
}

const INITIAL_PERMISSIONS: RolePermission[] = [
  {
    module: 'Textbook Catalog CRUD & Pricing',
    superAdmin: true,
    inventoryManager: true,
    dispatchExecutive: false,
    accountsOfficer: false,
  },
  {
    module: 'Warehouse Physical Stock Movements',
    superAdmin: true,
    inventoryManager: true,
    dispatchExecutive: true,
    accountsOfficer: false,
  },
  {
    module: 'Bulk Stock Adjustments & Write-Offs',
    superAdmin: true,
    inventoryManager: true,
    dispatchExecutive: false,
    accountsOfficer: false,
  },
  {
    module: 'Fulfillment & Carrier Waybill Dispatch',
    superAdmin: true,
    inventoryManager: true,
    dispatchExecutive: true,
    accountsOfficer: false,
  },
  {
    module: 'School Coordinator Credit Limits & Indents',
    superAdmin: true,
    inventoryManager: false,
    dispatchExecutive: false,
    accountsOfficer: true,
  },
  {
    module: 'Tax Invoices, RTGS Bank Logs & Credit Notes',
    superAdmin: true,
    inventoryManager: false,
    dispatchExecutive: false,
    accountsOfficer: true,
  },
  {
    module: 'Publisher Replenishment Purchase Orders',
    superAdmin: true,
    inventoryManager: true,
    dispatchExecutive: false,
    accountsOfficer: true,
  },
  {
    module: 'System Settings & API Configuration',
    superAdmin: true,
    inventoryManager: false,
    dispatchExecutive: false,
    accountsOfficer: false,
  },
];

export default function AdminRolesPage() {
  const [permissions, setPermissions] = useState<RolePermission[]>(INITIAL_PERMISSIONS);
  const [saved, setSaved] = useState(false);

  const togglePermission = (
    moduleIdx: number,
    role: 'inventoryManager' | 'dispatchExecutive' | 'accountsOfficer'
  ) => {
    setPermissions((prev) =>
      prev.map((p, idx) => {
        if (idx === moduleIdx) {
          return { ...p, [role]: !p[role] };
        }
        return p;
      })
    );
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: 'Platform Settings', href: '/admin/settings' },
          { label: 'Role-Based Access Control' },
        ]}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
            Role-Based Access Control (RBAC)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure module privileges and authority levels for operations staff & school branch managers
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/settings"
            className={buttonVariants({
              variant: 'outline',
              size: 'sm',
              className: 'gap-1.5',
            })}
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Settings</span>
          </Link>
          <Button variant="primary" size="sm" onClick={handleSave} leftIcon={<Save className="w-4 h-4" />}>
            Save Matrix
          </Button>
        </div>
      </div>

      {saved && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-800">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>Role access control privileges updated and persisted.</span>
        </div>
      )}

      {/* Roles Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center gap-2 font-bold text-slate-900 mb-1">
            <Shield className="w-4 h-4 text-emerald-700" />
            Super Admin
          </div>
          <p className="text-slate-500 text-[11px]">Unrestricted access across all operational nodes</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center gap-2 font-bold text-slate-900 mb-1">
            <Users className="w-4 h-4 text-blue-700" />
            Inventory Manager
          </div>
          <p className="text-slate-500 text-[11px]">Warehouse catalog, inward POs, & stock movements</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center gap-2 font-bold text-slate-900 mb-1">
            <Lock className="w-4 h-4 text-amber-700" />
            Dispatch Executive
          </div>
          <p className="text-slate-500 text-[11px]">Packing slips, waybills, and logistics milestones</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center gap-2 font-bold text-slate-900 mb-1">
            <Shield className="w-4 h-4 text-purple-700" />
            Accounts Officer
          </div>
          <p className="text-slate-500 text-[11px]">Credit limits, tax invoices, and RTGS settlements</p>
        </div>
      </div>

      {/* Matrix Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">Functional Operational Module</th>
                <th className="py-3 px-3 text-center">Super Admin</th>
                <th className="py-3 px-3 text-center">Inventory Manager</th>
                <th className="py-3 px-3 text-center">Dispatch Executive</th>
                <th className="py-3 px-3 text-center">Accounts Officer</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {permissions.map((p, idx) => (
                <tr key={p.module} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3.5 px-4 font-semibold text-slate-800">{p.module}</td>

                  {/* Super Admin (Always True) */}
                  <td className="py-3.5 px-3 text-center">
                    <span className="inline-flex p-1 rounded-md bg-emerald-100 text-emerald-800">
                      <Check className="w-4 h-4" />
                    </span>
                  </td>

                  {/* Inventory Manager */}
                  <td className="py-3.5 px-3 text-center">
                    <button
                      type="button"
                      onClick={() => togglePermission(idx, 'inventoryManager')}
                      className={`p-1 rounded-md transition-colors ${
                        p.inventoryManager
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                      }`}
                    >
                      {p.inventoryManager ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                    </button>
                  </td>

                  {/* Dispatch Executive */}
                  <td className="py-3.5 px-3 text-center">
                    <button
                      type="button"
                      onClick={() => togglePermission(idx, 'dispatchExecutive')}
                      className={`p-1 rounded-md transition-colors ${
                        p.dispatchExecutive
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                      }`}
                    >
                      {p.dispatchExecutive ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                    </button>
                  </td>

                  {/* Accounts Officer */}
                  <td className="py-3.5 px-3 text-center">
                    <button
                      type="button"
                      onClick={() => togglePermission(idx, 'accountsOfficer')}
                      className={`p-1 rounded-md transition-colors ${
                        p.accountsOfficer
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                      }`}
                    >
                      {p.accountsOfficer ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
