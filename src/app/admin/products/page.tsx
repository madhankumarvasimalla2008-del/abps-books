'use client';

import React, { useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import {
  Plus,
  BookOpen,
  Boxes,
  AlertTriangle,
  Archive,
  CheckCircle2,
  RefreshCw,
  Search,
} from 'lucide-react';
import { useProducts } from '@/context/ProductContext';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminEmptyState } from '@/components/admin/AdminEmptyState';
import { ProductFilters, ProductFilterState } from '@/components/admin/products/ProductFilters';
import { ProductTable } from '@/components/admin/products/ProductTable';
import { Button, buttonVariants } from '@/components/ui/Button';

export default function AdminProductsPage() {
  const { products, toggleProductStatus, deleteProduct, resetToDefaults } = useProducts();

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [filters, setFilters] = useState<ProductFilterState>({
    searchQuery: '',
    grade: '',
    subject: '',
    category: '',
    publisher: '',
    status: '',
    sortBy: 'title-asc',
  });

  const handleFilterChange = useCallback((key: keyof ProductFilterState, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleResetFilters = useCallback(() => {
    setFilters({
      searchQuery: '',
      grade: '',
      subject: '',
      category: '',
      publisher: '',
      status: '',
      sortBy: 'title-asc',
    });
  }, []);

  // Distinct Filter Option Lists
  const grades = useMemo(() => {
    return Array.from(new Set(products.map((p) => p.grade))).sort();
  }, [products]);

  const subjects = useMemo(() => {
    return Array.from(new Set(products.map((p) => p.subject))).sort();
  }, [products]);

  const categories = useMemo(() => {
    return Array.from(new Set(products.map((p) => p.category))).sort();
  }, [products]);

  const publishers = useMemo(() => {
    return Array.from(new Set(products.map((p) => p.publisher))).sort();
  }, [products]);

  // Filter and Sort Processing
  const filteredProducts = useMemo(() => {
    return products
      .filter((product) => {
        const q = filters.searchQuery.trim().toLowerCase();
        const matchesSearch =
          !q ||
          product.title.toLowerCase().includes(q) ||
          product.isbn.toLowerCase().includes(q) ||
          product.sku.toLowerCase().includes(q) ||
          product.publisher.toLowerCase().includes(q) ||
          product.author.toLowerCase().includes(q);

        const matchesGrade = !filters.grade || product.grade === filters.grade;
        const matchesSubject = !filters.subject || product.subject === filters.subject;
        const matchesCategory = !filters.category || product.category === filters.category;
        const matchesPublisher = !filters.publisher || product.publisher === filters.publisher;
        const matchesStatus = !filters.status || product.status === filters.status;

        return (
          matchesSearch &&
          matchesGrade &&
          matchesSubject &&
          matchesCategory &&
          matchesPublisher &&
          matchesStatus
        );
      })
      .sort((a, b) => {
        switch (filters.sortBy) {
          case 'title-asc':
            return a.title.localeCompare(b.title);
          case 'title-desc':
            return b.title.localeCompare(a.title);
          case 'price-asc':
            return a.sellingPrice - b.sellingPrice;
          case 'price-desc':
            return b.sellingPrice - a.sellingPrice;
          case 'grade-asc':
            return a.grade.localeCompare(b.grade);
          case 'newest':
            return b.id.localeCompare(a.id);
          default:
            return 0;
        }
      });
  }, [products, filters]);

  // Quick KPI Counts
  const stats = useMemo(() => {
    const total = products.length;
    const active = products.filter((p) => p.status === 'in_stock').length;
    const lowStock = products.filter((p) => p.status === 'low_stock').length;
    const outOfStock = products.filter((p) => p.status === 'out_of_stock').length;
    const discontinued = products.filter((p) => p.status === 'discontinued').length;
    return { total, active, lowStock, outOfStock, discontinued };
  }, [products]);

  const handleToggleStatus = (id: string) => {
    const target = products.find((p) => p.id === id);
    const newStatus = target?.status === 'discontinued' ? 'active' : 'discontinued';
    toggleProductStatus(id);
    showToast(`"${target?.title || 'Product'}" marked as ${newStatus}.`);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <AdminPageHeader
        title="Catalog & Textbook Repository"
        description="Prescribed syllabus titles, ISBN identifiers, curriculum mappings, and institutional pricing tiers."
        badge={
          <span className="inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded-md bg-slate-100 text-slate-700 border border-slate-200/80">
            Catalog Master
          </span>
        }
        actions={
          <div className="flex items-center gap-2">
            <Link
              href="/admin/inventory"
              className={buttonVariants({
                variant: 'outline',
                size: 'sm',
                className: 'gap-1.5',
              })}
              title="Manage warehouse counts & stock adjustments"
            >
              <Boxes className="w-4 h-4" />
              <span>Warehouse Inventory</span>
            </Link>
            <Link
              href="/admin/products/new"
              className={buttonVariants({
                variant: 'primary',
                size: 'sm',
                className: 'gap-1.5',
              })}
            >
              <Plus className="w-4 h-4" />
              <span>Add New Textbook</span>
            </Link>
          </div>
        }
      />

      {/* Floating Notification Toast */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-lg border border-slate-800 flex items-center gap-2 animate-fade-in"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Total Titles
          </p>
          <p className="text-xl font-bold text-slate-900 mt-0.5">{stats.total}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">In catalog master</p>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs">
          <p className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider">
            Active in Stock
          </p>
          <p className="text-xl font-bold text-slate-900 mt-0.5">{stats.active}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Available for ordering</p>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs">
          <p className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider">
            Low / Out of Stock
          </p>
          <p className="text-xl font-bold text-slate-900 mt-0.5">
            {stats.lowStock + stats.outOfStock}
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">
            <Link
              href="/admin/inventory"
              className="text-emerald-700 hover:underline font-medium"
            >
              Review in Inventory →
            </Link>
          </p>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Discontinued
          </p>
          <p className="text-xl font-bold text-slate-900 mt-0.5">{stats.discontinued}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Archived titles</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <ProductFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        onResetFilters={handleResetFilters}
        grades={grades}
        subjects={subjects}
        categories={categories}
        publishers={publishers}
        totalCount={products.length}
        filteredCount={filteredProducts.length}
      />

      {/* Products Table or Empty State */}
      {filteredProducts.length === 0 ? (
        <AdminEmptyState
          icon={<BookOpen className="w-6 h-6 text-slate-400" />}
          title="No catalog titles match your filters"
          description="Try adjusting your search keywords, grade level, subject, publisher, or status selection."
          action={
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetFilters}
              leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
            >
              Reset Filters
            </Button>
          }
        />
      ) : (
        <ProductTable
          products={filteredProducts}
          onToggleStatus={handleToggleStatus}
        />
      )}
    </div>
  );
}
