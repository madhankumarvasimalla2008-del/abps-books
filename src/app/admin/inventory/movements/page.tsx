'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  History,
  ArrowDownLeft,
  ArrowUpRight,
  RefreshCw,
  Search,
  Filter,
  ArrowLeft,
  Layers,
  FileSpreadsheet,
  RotateCcw,
  CheckCircle2,
  Calendar,
  User,
  ShieldCheck,
} from 'lucide-react';
import { useInventory } from '@/context/InventoryContext';
import { InventoryMovement } from '@/types';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Button } from '@/components/ui/Button';
import { StatCard } from '@/components/ui/StatCard';

export default function InventoryMovementsPage() {
  const { movements } = useInventory();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'quantity-desc'>('newest');

  // KPIs derived from actual movements
  const totalMovements = movements.length;

  const inwardMovements = useMemo(
    () => movements.filter((m) => m.type === 'Inward (PO)' || m.type === 'Branch Return' || m.quantityChange > 0),
    [movements]
  );
  const inwardUnits = useMemo(
    () => inwardMovements.reduce((sum, m) => sum + Math.max(0, m.quantityChange), 0),
    [inwardMovements]
  );

  const outwardMovements = useMemo(
    () => movements.filter((m) => m.type === 'Outward (Order)' || m.quantityChange < 0),
    [movements]
  );
  const outwardUnits = useMemo(
    () => outwardMovements.reduce((sum, m) => sum + Math.abs(Math.min(0, m.quantityChange)), 0),
    [outwardMovements]
  );

  const adjustmentsCount = useMemo(
    () => movements.filter((m) => m.type === 'Stock Adjustment' || m.type === 'Damaged/Scrap').length,
    [movements]
  );

  // Filtered and Sorted Movements
  const filteredMovements = useMemo(() => {
    return movements
      .filter((m) => {
        const q = search.trim().toLowerCase();
        const matchesSearch =
          !q ||
          m.productTitle.toLowerCase().includes(q) ||
          m.sku.toLowerCase().includes(q) ||
          m.id.toLowerCase().includes(q) ||
          (m.referenceId && m.referenceId.toLowerCase().includes(q)) ||
          m.reason.toLowerCase().includes(q) ||
          m.performedBy.toLowerCase().includes(q);

        const matchesType = typeFilter === 'all' || m.type === typeFilter;

        return matchesSearch && matchesType;
      })
      .sort((a, b) => {
        if (sortBy === 'quantity-desc') {
          return Math.abs(b.quantityChange) - Math.abs(a.quantityChange);
        }
        // Timestamp / ID default newest first
        if (sortBy === 'oldest') {
          return a.id.localeCompare(b.id);
        }
        return b.id.localeCompare(a.id);
      });
  }, [movements, search, typeFilter, sortBy]);

  // Handle Export CSV
  const handleExportCSV = () => {
    const headers = [
      'Movement ID',
      'Timestamp',
      'Product Title',
      'SKU',
      'Type',
      'Quantity Change',
      'Previous Stock',
      'New Stock',
      'Reference ID',
      'Reason',
      'Performed By',
    ];

    const rows = filteredMovements.map((m) => [
      m.id,
      m.timestamp,
      `"${m.productTitle.replace(/"/g, '""')}"`,
      m.sku,
      m.type,
      m.quantityChange,
      m.previousStock,
      m.newStock,
      m.referenceId || '',
      `"${m.reason.replace(/"/g, '""')}"`,
      m.performedBy,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `inventory-movement-audit-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: 'Admin Inventory', href: '/admin/inventory' },
          { label: 'Stock Movement Audit Logs' },
        ]}
      />

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
            Stock Movement Audit Trail
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Log of stock adjustments and movement audit records (Demo Data)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link href="/admin/inventory">
            <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
              Inventory Overview
            </Button>
          </Link>
          <Link href="/admin/inventory/bulk">
            <Button variant="outline" size="sm" leftIcon={<Layers className="w-4 h-4" />}>
              Bulk Adjust Stock
            </Button>
          </Link>
          <Button
            variant="primary"
            size="sm"
            onClick={handleExportCSV}
            leftIcon={<FileSpreadsheet className="w-4 h-4" />}
          >
            Export Audit CSV
          </Button>
        </div>
      </div>

      {/* KPI Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Audit Events"
          value={totalMovements.toString()}
          change={{ value: 'Audit ledger entries', positive: true }}
          icon={<History className="w-5 h-5 text-indigo-700" />}
        />
        <StatCard
          title="Inward Additions"
          value={`+${inwardUnits.toLocaleString('en-IN')}`}
          change={{ value: `${inwardMovements.length} inward records`, positive: true }}
          icon={<ArrowDownLeft className="w-5 h-5 text-emerald-600" />}
        />
        <StatCard
          title="Outward Dispatches"
          value={`-${outwardUnits.toLocaleString('en-IN')}`}
          change={{ value: `${outwardMovements.length} outward records`, positive: false }}
          icon={<ArrowUpRight className="w-5 h-5 text-blue-600" />}
        />
        <StatCard
          title="Stock Calibrations"
          value={adjustmentsCount.toString()}
          change={{ value: 'Manual stock adjustments', positive: true }}
          icon={<ShieldCheck className="w-5 h-5 text-amber-600" />}
        />
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <input
              type="text"
              placeholder="Search by product, SKU, Reference ID, reason, or operator..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-500 w-full md:w-auto justify-between md:justify-end">
            <span className="text-[11px] font-medium text-slate-400">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600 font-medium"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="quantity-desc">Largest Quantity Change</option>
            </select>
          </div>
        </div>

        {/* Movement Type Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-2 border-t border-slate-100">
          {[
            { id: 'all', label: 'All Movement Types' },
            { id: 'Inward (PO)', label: 'Inward (PO)' },
            { id: 'Outward (Order)', label: 'Outward (Order)' },
            { id: 'Stock Adjustment', label: 'Stock Adjustment' },
            { id: 'Damaged/Scrap', label: 'Damaged / Scrap' },
            { id: 'Branch Return', label: 'Branch Return' },
          ].map((type) => (
            <button
              key={type.id}
              type="button"
              onClick={() => setTypeFilter(type.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl whitespace-nowrap transition-colors ${
                typeFilter === type.id
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>

      {/* Movement Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {filteredMovements.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <History className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">No stock movements found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              No movement audit records match your search query or selected type filter.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearch('');
                setTypeFilter('all');
              }}
              className="mt-4"
              leftIcon={<RotateCcw className="w-4 h-4" />}
            >
              Reset Filters
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Event ID & Date</th>
                  <th className="py-3 px-3">Textbook Title & SKU</th>
                  <th className="py-3 px-3">Movement Type</th>
                  <th className="py-3 px-3 text-right">Delta Change</th>
                  <th className="py-3 px-3 text-center">Stock Transition</th>
                  <th className="py-3 px-3">Reference ID</th>
                  <th className="py-3 px-3">Operator</th>
                  <th className="py-3 px-4">Reason / Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredMovements.map((m) => {
                  const isPositive = m.quantityChange > 0;

                  return (
                    <tr key={m.id} className="hover:bg-slate-50/50 transition-colors">
                      {/* Event ID & Timestamp */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-mono font-bold text-slate-900 block">{m.id}</span>
                        <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Calendar className="w-3 h-3" />
                          {m.timestamp}
                        </span>
                      </td>

                      {/* Product Title & SKU */}
                      <td className="py-3.5 px-3">
                        <span className="font-bold text-slate-900 block leading-snug">
                          {m.productTitle}
                        </span>
                        <span className="font-mono text-[10px] text-slate-400">{m.sku}</span>
                      </td>

                      {/* Movement Type */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <span
                          className={`text-[11px] font-bold px-2 py-0.5 rounded-lg border inline-flex items-center gap-1 ${
                            m.type === 'Inward (PO)'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : m.type === 'Outward (Order)'
                              ? 'bg-blue-50 text-blue-800 border-blue-200'
                              : m.type === 'Branch Return'
                              ? 'bg-indigo-50 text-indigo-800 border-indigo-200'
                              : m.type === 'Damaged/Scrap'
                              ? 'bg-red-50 text-red-800 border-red-200'
                              : 'bg-amber-50 text-amber-800 border-amber-200'
                          }`}
                        >
                          {isPositive ? (
                            <ArrowDownLeft className="w-3 h-3 shrink-0" />
                          ) : (
                            <ArrowUpRight className="w-3 h-3 shrink-0" />
                          )}
                          {m.type}
                        </span>
                      </td>

                      {/* Delta Change */}
                      <td className="py-3.5 px-3 text-right whitespace-nowrap">
                        <span
                          className={`font-mono font-bold text-sm ${
                            isPositive ? 'text-emerald-700' : 'text-slate-900'
                          }`}
                        >
                          {isPositive ? `+${m.quantityChange}` : m.quantityChange}
                        </span>
                        <span className="text-[10px] text-slate-400 block font-normal">units</span>
                      </td>

                      {/* Stock Transition */}
                      <td className="py-3.5 px-3 text-center whitespace-nowrap font-mono text-[11px]">
                        <span className="text-slate-500">{m.previousStock}</span>
                        <span className="text-slate-300 mx-1.5">→</span>
                        <strong className="text-slate-900 font-bold">{m.newStock}</strong>
                      </td>

                      {/* Reference ID */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <span className="font-mono text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                          {m.referenceId || 'N/A'}
                        </span>
                      </td>

                      {/* Operator */}
                      <td className="py-3.5 px-3 whitespace-nowrap text-slate-600 font-medium text-[11px]">
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{m.performedBy}</span>
                        </div>
                      </td>

                      {/* Reason / Notes */}
                      <td className="py-3.5 px-4 text-slate-600 text-xs max-w-xs">
                        <p className="line-clamp-2 leading-relaxed">{m.reason}</p>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
