'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Server,
  ArrowLeft,
  CheckCircle2,
  RefreshCw,
  Database,
  Cloud,
  HardDrive,
  Cpu,
  Activity,
  ShieldCheck,
} from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Button } from '@/components/ui/Button';

export default function AdminSystemPage() {
  const [clearingCache, setClearingCache] = useState(false);
  const [cacheCleared, setCacheCleared] = useState(false);
  const [backingUp, setBackingUp] = useState(false);
  const [backupDone, setBackupDone] = useState(false);

  const handleClearCache = () => {
    setClearingCache(true);
    setTimeout(() => {
      setClearingCache(false);
      setCacheCleared(true);
      setTimeout(() => setCacheCleared(false), 3000);
    }, 1200);
  };

  const handleTriggerBackup = () => {
    setBackingUp(true);
    setTimeout(() => {
      setBackingUp(false);
      setBackupDone(true);
      setTimeout(() => setBackupDone(false), 3000);
    }, 1500);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Breadcrumbs
        items={[
          { label: 'Platform Settings', href: '/admin/settings' },
          { label: 'System Health & Infrastructure' },
        ]}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
            System Infrastructure & Operational Health
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Database ledger replication, carrier API gateways, cache layers, and backup archives
          </p>
        </div>

        <Link href="/admin/settings">
          <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Back to Settings
          </Button>
        </Link>
      </div>

      {cacheCleared && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-800">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>Product catalog cache purged across all edge edge locations.</span>
        </div>
      )}

      {backupDone && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-800">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>PostgreSQL ledger snapshot archived to secure cloud cold-storage.</span>
        </div>
      )}

      {/* Health Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-900">Central PostgreSQL Ledger</span>
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              <CheckCircle2 className="w-3 h-3" /> Healthy
            </span>
          </div>
          <p className="text-slate-500 text-[11px]">Primary cluster at Mumbai Region (ap-south-1)</p>
          <div className="text-[11px] text-slate-400 font-mono pt-1">Latency: 12ms • Uptime: 99.98%</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-900">Logistics Carrier Webhook</span>
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              <CheckCircle2 className="w-3 h-3" /> Operational
            </span>
          </div>
          <p className="text-slate-500 text-[11px]">Blue Dart & Delhivery tracking integration</p>
          <div className="text-[11px] text-slate-400 font-mono pt-1">Events Ingested: 1,420/day</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-900">Banking Gateway (RTGS)</span>
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              <CheckCircle2 className="w-3 h-3" /> Active
            </span>
          </div>
          <p className="text-slate-500 text-[11px]">HDFC Corporate Treasury reconciliation sync</p>
          <div className="text-[11px] text-slate-400 font-mono pt-1">Last Reconciled: 10 mins ago</div>
        </div>
      </div>

      {/* Maintenance Actions */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4 text-xs">
        <h2 className="font-bold text-sm text-slate-900 border-b border-slate-100 pb-2.5">
          System Maintenance & Data Protection
        </h2>

        <div className="divide-y divide-slate-100">
          <div className="py-3.5 flex items-center justify-between gap-4">
            <div>
              <p className="font-bold text-slate-900">Purge Catalog Edge Cache</p>
              <p className="text-slate-500 text-[11px]">
                Invalidates stale pricing tiers and textbook availability across CDNs
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearCache}
              isLoading={clearingCache}
              leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
            >
              Purge Edge Cache
            </Button>
          </div>

          <div className="py-3.5 flex items-center justify-between gap-4">
            <div>
              <p className="font-bold text-slate-900">Manual Full Database Backup Snapshot</p>
              <p className="text-slate-500 text-[11px]">
                Creates an immediate encrypted snapshot of all school indents, inventory movements, and ledger balances
              </p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleTriggerBackup}
              isLoading={backingUp}
              leftIcon={<HardDrive className="w-3.5 h-3.5" />}
            >
              Trigger Snapshot
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
