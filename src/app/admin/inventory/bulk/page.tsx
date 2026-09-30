'use client';

import React, { useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import {
  Layers,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Search,
  ArrowLeft,
  ArrowRight,
  ShieldAlert,
  History,
  Check,
  Plus,
  Minus,
} from 'lucide-react';
import { useProducts } from '@/context/ProductContext';
import { useInventory, AdjustStockInput } from '@/context/InventoryContext';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Button, buttonVariants } from '@/components/ui/Button';

interface BulkRowState {
  productId: string;
  adjustment: string; // string so user can clear/type negative numbers
  reason: string;
  referenceId: string;
}

export default function BulkStockAdjustPage() {
  const { products } = useProducts();
  const { inventoryRecords, getStock, bulkAdjustStock } = useInventory();

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [gradeFilter, setGradeFilter] = useState('all');

  // Form row state mapped by productId
  const [rowStates, setRowStates] = useState<Record<string, BulkRowState>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successCount, setSuccessCount] = useState<number | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Global batch reason & reference defaults
  const [batchReason, setBatchReason] = useState('Routine stock adjustment');
  const [batchRefId, setBatchRefId] = useState(`BULK-${Date.now().toString().slice(-4)}`);

  // Distinct Filter options
  const categories = useMemo(() => {
    return Array.from(new Set(products.map((p) => p.category))).sort();
  }, [products]);

  const grades = useMemo(() => {
    return Array.from(new Set(products.map((p) => p.grade))).sort();
  }, [products]);

  // Combine products with current stock data
  const bulkItems = useMemo(() => {
    return products.map((product) => {
      const record = getStock(product.id);
      const currentStock = record ? record.stockQuantity : (product.stockQuantity || 0);
      const lowStockThreshold = record ? record.lowStockThreshold : (product.lowStockThreshold || 50);

      const rowState = rowStates[product.id] || {
        productId: product.id,
        adjustment: '0',
        reason: batchReason,
        referenceId: batchRefId,
      };

      const parsedAdjustment = parseInt(rowState.adjustment, 10) || 0;
      const resultingStock = currentStock + parsedAdjustment;
      const isNegative = resultingStock < 0;
      const isModified = parsedAdjustment !== 0;

      return {
        product,
        currentStock,
        lowStockThreshold,
        rowState,
        parsedAdjustment,
        resultingStock,
        isNegative,
        isModified,
      };
    });
  }, [products, inventoryRecords, getStock, rowStates, batchReason, batchRefId]);

  // Filtered items
  const filteredItems = useMemo(() => {
    return bulkItems.filter((item) => {
      const q = search.trim().toLowerCase();
      const matchesSearch =
        !q ||
        item.product.title.toLowerCase().includes(q) ||
        item.product.sku.toLowerCase().includes(q) ||
        item.product.isbn.toLowerCase().includes(q);

      const matchesCategory = categoryFilter === 'all' || item.product.category === categoryFilter;
      const matchesGrade = gradeFilter === 'all' || item.product.grade === gradeFilter;

      return matchesSearch && matchesCategory && matchesGrade;
    });
  }, [bulkItems, search, categoryFilter, gradeFilter]);

  // Update a single row's adjustment
  const handleAdjustmentChange = (productId: string, val: string) => {
    setFormError(null);
    setSuccessCount(null);
    setRowStates((prev) => {
      const existing = prev[productId] || {
        productId,
        adjustment: '0',
        reason: batchReason,
        referenceId: batchRefId,
      };
      return {
        ...prev,
        [productId]: { ...existing, adjustment: val },
      };
    });
  };

  // Quick delta button for a row
  const handleQuickRowDelta = (productId: string, delta: number) => {
    setFormError(null);
    setSuccessCount(null);
    setRowStates((prev) => {
      const existing = prev[productId] || {
        productId,
        adjustment: '0',
        reason: batchReason,
        referenceId: batchRefId,
      };
      const currentAdj = parseInt(existing.adjustment, 10) || 0;
      return {
        ...prev,
        [productId]: { ...existing, adjustment: String(currentAdj + delta) },
      };
    });
  };

  // Update a single row's reason
  const handleReasonChange = (productId: string, reason: string) => {
    setRowStates((prev) => {
      const existing = prev[productId] || {
        productId,
        adjustment: '0',
        reason: batchReason,
        referenceId: batchRefId,
      };
      return {
        ...prev,
        [productId]: { ...existing, reason },
      };
    });
  };

  // Reset all adjustments
  const handleResetAll = () => {
    setRowStates({});
    setFormError(null);
    setSuccessCount(null);
  };

  // Statistics on pending modifications
  const modifiedItems = useMemo(() => {
    return bulkItems.filter((i) => i.isModified);
  }, [bulkItems]);

  const hasNegativeErrors = useMemo(() => {
    return bulkItems.some((i) => i.isModified && i.isNegative);
  }, [bulkItems]);

  const totalNetDelta = useMemo(() => {
    return modifiedItems.reduce((acc, curr) => acc + curr.parsedAdjustment, 0);
  }, [modifiedItems]);

  // Apply Bulk Adjustments
  const handleApplyAdjustments = () => {
    setFormError(null);

    if (modifiedItems.length === 0) {
      setFormError('No stock quantity adjustments have been entered.');
      return;
    }

    if (hasNegativeErrors) {
      setFormError('Cannot apply adjustments: one or more items result in negative stock.');
      return;
    }

    setIsSubmitting(true);

    const inputs: AdjustStockInput[] = modifiedItems.map((item) => ({
      productId: item.product.id,
      adjustment: item.parsedAdjustment,
      reason: item.rowState.reason || batchReason,
      referenceId: item.rowState.referenceId || batchRefId,
      performedBy: 'Admin Bulk Operations',
      type: 'Stock Adjustment',
    }));

    const result = bulkAdjustStock(inputs);

    if (result.success) {
      setSuccessCount(result.count || modifiedItems.length);
      setRowStates({});
      setIsSubmitting(false);
    } else {
      setIsSubmitting(false);
      setFormError(result.error || 'Failed to apply bulk adjustments.');
    }
  };

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: 'Admin Inventory', href: '/admin/inventory' },
          { label: 'Bulk Stock Adjustment' },
        ]}
      />

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
            Bulk Stock Adjustment
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Calibrate and record stock changes across multiple textbook titles in a single verified batch
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/inventory"
            className={buttonVariants({
              variant: 'outline',
              size: 'sm',
              className: 'gap-1.5',
            })}
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Inventory</span>
          </Link>
          <Button
            variant="outline"
            size="sm"
            onClick={handleResetAll}
            disabled={modifiedItems.length === 0 || isSubmitting}
            leftIcon={<RotateCcw className="w-4 h-4" />}
          >
            Clear All
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleApplyAdjustments}
            disabled={modifiedItems.length === 0 || hasNegativeErrors || isSubmitting}
            leftIcon={<Save className="w-4 h-4" />}
          >
            {isSubmitting ? 'Applying...' : `Apply (${modifiedItems.length}) Adjustments`}
          </Button>
        </div>
      </div>

      {/* Feedback Alerts */}
      {successCount !== null && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3 text-xs text-emerald-800 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-bold">
              Successfully updated stock levels for {successCount} textbook {successCount === 1 ? 'title' : 'titles'}.
            </p>
            <p className="text-emerald-700 mt-0.5">
              Stock movement audit logs have been recorded for each modified item.
            </p>
            <div className="flex items-center gap-3 mt-2">
              <Link
                href="/admin/inventory"
                className="font-bold text-emerald-800 underline hover:text-emerald-950"
              >
                View Inventory List →
              </Link>
              <Link
                href="/admin/inventory/movements"
                className="font-bold text-emerald-800 underline hover:text-emerald-950"
              >
                View Movement Audit Logs →
              </Link>
            </div>
          </div>
        </div>
      )}

      {formError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3 text-xs text-red-800">
          <ShieldAlert className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Validation Error</p>
            <p className="mt-0.5">{formError}</p>
          </div>
        </div>
      )}

      {/* Adjustment Instructions & Batch Defaults */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              1. Integer Adjustments
            </span>
            <p className="text-xs text-slate-600">
              Enter positive values (e.g. <strong>+50</strong>) to increase stock, or negative values (e.g. <strong>-20</strong>) to deduct stock.
            </p>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              2. Stock Safety Rule
            </span>
            <p className="text-xs text-slate-600">
              Resulting stock can never drop below <strong>0</strong>. Any row resulting in negative stock will block submission.
            </p>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              3. Immutable Audit Trail
            </span>
            <p className="text-xs text-slate-600">
              Every row change automatically generates a verifiable <strong>Stock Movement Log</strong> entry.
            </p>
          </div>
        </div>

        {/* Batch Defaults Controls */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-600">Default Reason:</span>
              <select
                value={batchReason}
                onChange={(e) => setBatchReason(e.target.value)}
                className="px-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              >
                <option value="Routine stock adjustment">Routine stock adjustment</option>
                <option value="Physical stock count update">Physical stock count update</option>
                <option value="Stock correction">Stock correction</option>
                <option value="Initial stock entry">Initial stock entry</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-600">Batch Ref:</span>
              <input
                type="text"
                value={batchRefId}
                onChange={(e) => setBatchRefId(e.target.value)}
                className="w-32 px-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>
          </div>

          {/* Pending Changes Badge */}
          {modifiedItems.length > 0 && (
            <div className="flex items-center gap-2 bg-emerald-50 text-emerald-900 px-3 py-1 rounded-xl border border-emerald-200 font-medium">
              <span>{modifiedItems.length} items staged</span>
              <span>•</span>
              <span>
                Net Change: <strong>{totalNetDelta > 0 ? `+${totalNetDelta}` : totalNetDelta} units</strong>
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search titles, SKUs, or ISBNs to calibrate..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-2.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-600"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <select
            value={gradeFilter}
            onChange={(e) => setGradeFilter(e.target.value)}
            className="px-2.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-600"
          >
            <option value="all">All Grades</option>
            {grades.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Bulk Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">Textbook & SKU</th>
                <th className="py-3 px-3">Grade & Subject</th>
                <th className="py-3 px-3 text-right">Current Stock</th>
                <th className="py-3 px-4 text-center">Stock Adjustment (+/-)</th>
                <th className="py-3 px-3 text-right">Resulting Stock</th>
                <th className="py-3 px-4">Adjustment Rationale</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.map((item) => {
                const adjVal = item.rowState.adjustment;

                return (
                  <tr
                    key={item.product.id}
                    className={`transition-colors ${
                      item.isNegative
                        ? 'bg-red-50/50 hover:bg-red-50'
                        : item.isModified
                        ? 'bg-emerald-50/30 hover:bg-emerald-50/50'
                        : 'hover:bg-slate-50/50'
                    }`}
                  >
                    {/* Textbook & SKU */}
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-slate-900 block leading-snug">
                        {item.product.title}
                      </span>
                      <span className="font-mono text-[10px] text-slate-400">
                        {item.product.sku} • ISBN: {item.product.isbn}
                      </span>
                    </td>

                    {/* Grade & Subject */}
                    <td className="py-3.5 px-3">
                      <span className="font-semibold text-slate-800 block">{item.product.grade}</span>
                      <span className="text-[11px] text-slate-500">{item.product.subject}</span>
                    </td>

                    {/* Current Stock */}
                    <td className="py-3.5 px-3 text-right font-mono font-bold text-slate-700">
                      {item.currentStock.toLocaleString('en-IN')}
                    </td>

                    {/* Adjustment Input + Quick Chips */}
                    <td className="py-3.5 px-4">
                      <div className="flex flex-col items-center gap-1.5">
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            step="1"
                            value={adjVal}
                            onChange={(e) =>
                              handleAdjustmentChange(item.product.id, e.target.value)
                            }
                            className={`w-28 px-3 py-1.5 font-mono text-center font-bold text-xs border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 ${
                              item.isNegative
                                ? 'bg-red-50 text-red-900 border-red-300'
                                : item.parsedAdjustment > 0
                                ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                                : item.parsedAdjustment < 0
                                ? 'bg-amber-50 text-amber-900 border-amber-300'
                                : 'bg-slate-50 text-slate-700 border-slate-200'
                            }`}
                            placeholder="0"
                          />
                        </div>

                        {/* Quick Delta Helper Buttons */}
                        <div className="flex items-center gap-1">
                          {[+10, +50, -10, -50].map((d) => (
                            <button
                              key={d}
                              type="button"
                              onClick={() => handleQuickRowDelta(item.product.id, d)}
                              className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold transition-colors ${
                                d > 0
                                  ? 'bg-slate-100 hover:bg-emerald-100 hover:text-emerald-900 text-slate-600'
                                  : 'bg-slate-100 hover:bg-red-100 hover:text-red-900 text-slate-600'
                              }`}
                            >
                              {d > 0 ? `+${d}` : d}
                            </button>
                          ))}
                        </div>
                      </div>
                    </td>

                    {/* Resulting Stock */}
                    <td className="py-3.5 px-3 text-right">
                      {item.isNegative ? (
                        <div>
                          <span className="font-mono font-bold text-red-600 text-sm">
                            {item.resultingStock}
                          </span>
                          <span className="text-[10px] text-red-500 font-semibold block">
                            Negative stock!
                          </span>
                        </div>
                      ) : (
                        <div>
                          <span
                            className={`font-mono font-bold text-sm ${
                              item.isModified
                                ? item.parsedAdjustment > 0
                                  ? 'text-emerald-700'
                                  : 'text-amber-700'
                                : 'text-slate-900'
                            }`}
                          >
                            {item.resultingStock.toLocaleString('en-IN')}
                          </span>
                          {item.isModified && (
                            <span className="text-[10px] text-slate-400 block font-normal">
                              ({item.parsedAdjustment > 0 ? `+${item.parsedAdjustment}` : item.parsedAdjustment})
                            </span>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Reason Select */}
                    <td className="py-3.5 px-4">
                      <select
                        value={item.rowState.reason}
                        onChange={(e) => handleReasonChange(item.product.id, e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                      >
                        <option value="Routine stock adjustment">Routine stock adjustment</option>
                        <option value="Physical stock count update">Physical stock count update</option>
                        <option value="Stock correction">Stock correction</option>
                        <option value="Initial stock entry">Initial stock entry</option>
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sticky Bottom Summary Bar */}
      <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4 text-xs">
          <div>
            <span className="text-slate-400 block text-[11px]">Staged Modifications:</span>
            <span className="font-mono font-bold text-sm text-emerald-400">
              {modifiedItems.length} Products
            </span>
          </div>

          <div className="h-6 w-px bg-slate-800 hidden sm:block" />

          <div>
            <span className="text-slate-400 block text-[11px]">Net Stock Delta:</span>
            <span className="font-mono font-bold text-sm">
              {totalNetDelta > 0 ? `+${totalNetDelta}` : totalNetDelta} Units
            </span>
          </div>

          <div className="h-6 w-px bg-slate-800 hidden sm:block" />

          <div>
            <span className="text-slate-400 block text-[11px]">Stock Safety Status:</span>
            {hasNegativeErrors ? (
              <span className="font-bold text-xs text-red-400 flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5" />
                Negative Resulting Stock Detected
              </span>
            ) : (
              <span className="font-bold text-xs text-emerald-400 flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                All Stock Levels Safe (≥ 0)
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={handleResetAll}
            disabled={modifiedItems.length === 0 || isSubmitting}
            className="text-slate-300 border-slate-700 hover:bg-slate-800"
          >
            Clear Staged
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleApplyAdjustments}
            disabled={modifiedItems.length === 0 || hasNegativeErrors || isSubmitting}
            leftIcon={<Save className="w-4 h-4" />}
          >
            {isSubmitting ? 'Applying...' : `Save ${modifiedItems.length} Stock Adjustments`}
          </Button>
        </div>
      </div>
    </div>
  );
}
