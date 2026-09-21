'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Settings,
  Building2,
  Shield,
  Server,
  Save,
  CheckCircle2,
  Percent,
} from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Button } from '@/components/ui/Button';

export default function AdminSettingsPage() {
  const [platformName, setPlatformName] = useState('ABPS Central Book Portal');
  const [supportEmail, setSupportEmail] = useState('books-support@abps.adityabirla.com');
  const [supportPhone, setSupportPhone] = useState('+91 1800 200 4567');
  const [academicYear, setAcademicYear] = useState('2026-27');
  const [defaultBulkDiscount, setDefaultBulkDiscount] = useState(15);
  const [defaultBulkThreshold, setDefaultBulkThreshold] = useState(25);
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Breadcrumbs items={[{ label: 'Platform Settings & Configuration' }]} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
            Platform Settings & General Parameters
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Institutional book distribution operational settings, default pricing rules, and contact metadata
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/admin/settings/roles">
            <Button variant="outline" size="sm" leftIcon={<Shield className="w-4 h-4" />}>
              Role Matrix
            </Button>
          </Link>
          <Link href="/admin/settings/system">
            <Button variant="outline" size="sm" leftIcon={<Server className="w-4 h-4" />}>
              System Health
            </Button>
          </Link>
        </div>
      </div>

      {saved && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-800">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>Platform configuration updated successfully.</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* General Settings */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4 text-xs">
          <h2 className="font-bold text-sm text-slate-900 border-b border-slate-100 pb-2.5">
            Institution & Academic Year Profile
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Platform Brand Title</label>
              <input
                type="text"
                value={platformName}
                onChange={(e) => setPlatformName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Active Academic Session</label>
              <select
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
              >
                <option value="2026-27">AY 2026-27 (Current Active)</option>
                <option value="2027-28">AY 2027-28 (Upcoming)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Central Support Email</label>
              <input
                type="email"
                value={supportEmail}
                onChange={(e) => setSupportEmail(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Toll-Free Helpline</label>
              <input
                type="text"
                value={supportPhone}
                onChange={(e) => setSupportPhone(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 font-mono"
              />
            </div>
          </div>
        </div>

        {/* Default Bulk Discounting Rules */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4 text-xs">
          <h2 className="font-bold text-sm text-slate-900 border-b border-slate-100 pb-2.5">
            Default Institutional Bulk Discount Parameters
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Default Rebate Percentage (%)
              </label>
              <input
                type="number"
                value={defaultBulkDiscount}
                onChange={(e) => setDefaultBulkDiscount(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Default Minimum Copies for Bulk Rate
              </label>
              <input
                type="number"
                value={defaultBulkThreshold}
                onChange={(e) => setDefaultBulkThreshold(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="submit" variant="primary" size="md" leftIcon={<Save className="w-4 h-4" />}>
            Save Platform Settings
          </Button>
        </div>
      </form>
    </div>
  );
}
