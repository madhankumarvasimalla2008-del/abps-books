'use client';

import React, { useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import {
  Package,
  AlertTriangle,
  Search,
  History,
  Layers,
  Edit,
  ExternalLink,
  SlidersHorizontal,
  RotateCcw,
  CheckCircle2,
  XCircle,
  ArrowUpDown,
  Filter,
  Check,
  Plus,
} from 'lucide-react';
import { Product } from '@/types';
import { useProducts } from '@/context/ProductContext';
import { useInventory } from '@/context/InventoryContext';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { StatCard } from '@/components/ui/StatCard';
import { Button } from '@/components/ui/Button';
import { AdjustStockModal } from '@/components/admin/inventory/AdjustStockModal';

export default function AdminInventoryPage() {
  const { products } = useProducts();
  const { inventoryRecords, getStock, resetToDefaults } = useInventory();

  // Search, Filter & Sort state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [gradeFilter, setGradeFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name-asc' | 'name-desc' | 'stock-asc' | 'stock-desc' | 'status'>('name-asc');

  // Modal state
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Derive inventory items by joining products with inventory records
  const inventoryItems = useMemo(() => {
    return products.map((product) => {
      const record = getStock(product.id);
      const stockQuantity = record ? record.stockQuantity : (product.stockQuantity || 0);
      const lowStockThreshold = record ? record.lowStockThreshold : (product.lowStockThreshold || 50);
      const status = record ? record.status : product.status;
      const lastUpdated = record ? record.lastUpdated : 'Initial Record';

      return {
        product,
        stockQuantity,
        lowStockThreshold,
        status,
        lastUpdated,
      };
    });
  }, [products, inventoryRecords, getStock]);

  // Derived KPIs
  const totalProducts = inventoryItems.length;
  const inStockCount = inventoryItems.filter((i) => i.status === 'in_stock').length;
  const lowStockCount = inventoryItems.filter((i) => i.status === 'low_stock').length;
  const outOfStockCount = inventoryItems.filter((i) => i.status === 'out_of_stock').length;

  // Categories and Grades for filtering
  const categories = useMemo(() => {
    return Array.from(new Set(products.map((p) => p.category))).sort();
  }, [products]);

  const grades = useMemo(() => {
    return Array.from(new Set(products.map((p) => p.grade))).sort();
  }, [products]);

  // Active filters count
  const activeFiltersCount =
    (statusFilter !== 'all' ? 1 : 0) +
    (categoryFilter !== 'all' ? 1 : 0) +
    (gradeFilter !== 'all' ? 1 : 0) +
    (searchQuery.trim() !== '' ? 1 : 0);

  const handleClearFilters = useCallback(() => {
    setSearchQuery('');
    setStatusFilter('all');
    setCategoryFilter('all');
    setGradeFilter('all');
    setSortBy('name-asc');
  }, []);

  // Filter & Sort
  const filteredItems = useMemo(() => {
    return inventoryItems
      .filter((item) => {
        const q = searchQuery.trim().toLowerCase();
        const matchesSearch =
          !q ||
          item.product.title.toLowerCase().includes(q) ||
          item.product.sku.toLowerCase().includes(q) ||
          item.product.isbn.toLowerCase().includes(q);

        const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
        const matchesCategory = categoryFilter === 'all' || item.product.category === categoryFilter;
        const matchesGrade = gradeFilter === 'all' || item.product.grade === gradeFilter;

        return matchesSearch && matchesStatus && matchesCategory && matchesGrade;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case 'name-asc':
            return a.product.title.localeCompare(b.product.title);
          case 'name-desc':
            return b.product.title.localeCompare(a.product.title);
          case 'stock-asc':
            return a.stockQuantity - b.stockQuantity;
          case 'stock-desc':
            return b.stockQuantity - a.stockQuantity;
          case 'status':
            return a.status.localeCompare(b.status);
          default:
            return 0;
        }
      });
  }, [inventoryItems, searchQuery, statusFilter, categoryFilter, gradeFilter, sortBy]);

  const handleOpenAdjustModal = (product: Product) => {
    setSelectedProduct(product);
    setIsAdjustModalOpen(true);
  };

  const handleResetData = () => {
    if (window.confirm('Reset all inventory records and movement logs back to default demo state?')) {
      resetToDefaults();
      setToastMessage('Inventory reset to initial demo state.');
      setTimeout(() => setToastMessage(null), 3500);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 text-xs animate-in fade-in slide-in-from-bottom-4">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Demo Banner */}
      <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl px-4 py-2.5 flex items-center justify-between text-xs text-emerald-900">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>
            <strong>Inventory Management Mode</strong> — Stock counts, adjustments, and movement audit logs persist locally.
          </span>
        </div>
        <button
          onClick={handleResetData}
          className="text-emerald-700 hover:text-emerald-900 underline font-medium text-[11px]"
        >
          Reset Demo Data
        </button>
      </div>

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
            Inventory & Stock Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitor stock levels, execute safe adjustments, and review immutable movement audit trails
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link href="/admin/inventory/movements">
            <Button variant="outline" size="sm" leftIcon={<History className="w-4 h-4" />}>
              Stock Movements
            </Button>
          </Link>
          <Link href="/admin/inventory/bulk">
            <Button variant="primary" size="sm" leftIcon={<Layers className="w-4 h-4" />}>
              Bulk Stock Adjust
            </Button>
          </Link>
        </div>
      </div>

      {/* 4 Summary Metric Cards (Derived purely from actual data) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Products Tracked"
          value={totalProducts.toString()}
          change={{ value: 'Catalog items in inventory', positive: true }}
          icon={<Package className="w-5 h-5 text-emerald-700" />}
        />
        <StatCard
          title="In Stock"
          value={inStockCount.toString()}
          change={{ value: `${Math.round((inStockCount / (totalProducts || 1)) * 100)}% of catalog active`, positive: true }}
          icon={<Check className="w-5 h-5 text-emerald-600" />}
        />
        <StatCard
          title="Low Stock Warning"
          value={lowStockCount.toString()}
          change={{ value: 'At or below threshold', positive: false }}
          icon={<AlertTriangle className="w-5 h-5 text-amber-600" />}
        />
        <StatCard
          title="Out of Stock"
          value={outOfStockCount.toString()}
          change={{ value: 'Zero stock available', positive: false }}
          icon={<XCircle className="w-5 h-5 text-red-600" />}
        />
      </div>

      {/* Search, Filter Bar & Sorting */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 w-full">
            <input
              type="text"
              placeholder="Search by product title, SKU, or ISBN..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>

          {/* Quick Status Tabs */}
          <div className="flex items-center gap-1 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
            {[
              { id: 'all', label: 'All Status' },
              { id: 'in_stock', label: 'In Stock' },
              { id: 'low_stock', label: 'Low Stock' },
              { id: 'out_of_stock', label: 'Out of Stock' },
              { id: 'discontinued', label: 'Discontinued' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-xl whitespace-nowrap transition-colors ${
                  statusFilter === tab.id
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Category, Grade and Sorting Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-2">
            {/* Category Dropdown */}
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <span className="text-[11px] font-medium text-slate-400">Category:</span>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              >
                <option value="all">All Categories</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Grade Dropdown */}
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <span className="text-[11px] font-medium text-slate-400">Grade:</span>
              <select
                value={gradeFilter}
                onChange={(e) => setGradeFilter(e.target.value)}
                className="px-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              >
                <option value="all">All Grades</option>
                {grades.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>

            {/* Clear Filters Button */}
            {activeFiltersCount > 0 && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="px-2.5 py-1 text-[11px] font-semibold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                Clear Filters ({activeFiltersCount})
              </button>
            )}
          </div>

          {/* Sort By Dropdown */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <span className="text-[11px] font-medium text-slate-400">Sort By:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-600 font-medium"
            >
              <option value="name-asc">Product Title (A → Z)</option>
              <option value="name-desc">Product Title (Z → A)</option>
              <option value="stock-asc">Current Stock (Low → High)</option>
              <option value="stock-desc">Current Stock (High → Low)</option>
              <option value="status">Stock Status</option>
            </select>
          </div>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {filteredItems.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <Package className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">No inventory records found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              No products match your active search and filter criteria. Try clearing search filters or changing options.
            </p>
            {activeFiltersCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearFilters}
                className="mt-4"
                leftIcon={<RotateCcw className="w-4 h-4" />}
              >
                Reset All Filters
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Product Details</th>
                  <th className="py-3 px-3">Category & Subject</th>
                  <th className="py-3 px-3">Grade</th>
                  <th className="py-3 px-3 text-right">Current Stock</th>
                  <th className="py-3 px-3 text-right">Threshold</th>
                  <th className="py-3 px-3">Stock Status</th>
                  <th className="py-3 px-3">Last Updated</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredItems.map(({ product, stockQuantity, lowStockThreshold, status, lastUpdated }) => {
                  return (
                    <tr key={product.id} className="hover:bg-slate-50/60 transition-colors">
                      {/* Product Details */}
                      <td className="py-3.5 px-4">
                        <p className="font-bold text-slate-900 leading-snug">{product.title}</p>
                        <div className="flex items-center gap-2 font-mono text-[10px] text-slate-400 mt-0.5">
                          <span>SKU: <strong className="text-slate-600">{product.sku}</strong></span>
                          <span>•</span>
                          <span>ISBN: {product.isbn}</span>
                        </div>
                      </td>

                      {/* Category & Subject */}
                      <td className="py-3.5 px-3">
                        <span className="font-semibold text-slate-800 block">{product.category}</span>
                        <span className="text-[11px] text-slate-500">{product.subject}</span>
                      </td>

                      {/* Grade */}
                      <td className="py-3.5 px-3 font-medium text-slate-700">
                        {product.grade}
                      </td>

                      {/* Current Stock */}
                      <td className="py-3.5 px-3 text-right">
                        <span
                          className={`font-mono font-bold text-sm ${
                            stockQuantity === 0
                              ? 'text-red-600'
                              : stockQuantity <= lowStockThreshold
                              ? 'text-amber-600'
                              : 'text-slate-900'
                          }`}
                        >
                          {stockQuantity.toLocaleString('en-IN')}
                        </span>
                        <span className="text-[10px] text-slate-400 block font-normal">units</span>
                      </td>

                      {/* Threshold */}
                      <td className="py-3.5 px-3 text-right font-mono text-slate-500 text-[11px]">
                        Min {lowStockThreshold}
                      </td>

                      {/* Stock Status */}
                      <td className="py-3.5 px-3">
                        <StatusBadge status={status} type="inventory" />
                      </td>

                      {/* Last Updated */}
                      <td className="py-3.5 px-3 text-[11px] text-slate-500 font-mono whitespace-nowrap">
                        {lastUpdated}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenAdjustModal(product)}
                            className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold rounded-lg text-xs border border-emerald-200 transition-colors flex items-center gap-1"
                            title="Adjust Stock Quantity"
                          >
                            <SlidersHorizontal className="w-3.5 h-3.5" />
                            <span>Adjust</span>
                          </button>

                          <Link
                            href={`/admin/products/${product.id}/edit`}
                            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Edit Catalog Master Record"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Stock Adjustment Modal */}
      {selectedProduct && (
        <AdjustStockModal
          isOpen={isAdjustModalOpen}
          onClose={() => {
            setIsAdjustModalOpen(false);
            setSelectedProduct(null);
          }}
          product={selectedProduct}
          currentStock={
            inventoryItems.find((i) => i.product.id === selectedProduct.id)?.stockQuantity || 0
          }
          lowStockThreshold={
            inventoryItems.find((i) => i.product.id === selectedProduct.id)?.lowStockThreshold || 50
          }
        />
      )}
    </div>
  );
}
