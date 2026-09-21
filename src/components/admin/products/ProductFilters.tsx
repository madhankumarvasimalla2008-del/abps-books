'use client';

import React from 'react';
import { Search, RotateCcw, Filter } from 'lucide-react';
import { GradeLevel, Subject } from '@/types';
import { Button } from '@/components/ui/Button';

export interface ProductFilterState {
  searchQuery: string;
  grade: string;
  subject: string;
  category: string;
  publisher: string;
  status: string;
  sortBy: string;
}

interface ProductFiltersProps {
  filters: ProductFilterState;
  onFilterChange: (key: keyof ProductFilterState, value: string) => void;
  onResetFilters: () => void;
  grades: string[];
  subjects: string[];
  categories: string[];
  publishers: string[];
  totalCount: number;
  filteredCount: number;
}

export const ProductFilters: React.FC<ProductFiltersProps> = ({
  filters,
  onFilterChange,
  onResetFilters,
  grades,
  subjects,
  categories,
  publishers,
  totalCount,
  filteredCount,
}) => {
  const isFiltered =
    Boolean(filters.searchQuery) ||
    Boolean(filters.grade) ||
    Boolean(filters.subject) ||
    Boolean(filters.category) ||
    Boolean(filters.publisher) ||
    Boolean(filters.status) ||
    filters.sortBy !== 'title-asc';

  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs space-y-3">
      {/* Primary Search Bar & Sort */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search by Title, ISBN, SKU, Publisher, Author..."
            value={filters.searchQuery}
            onChange={(e) => onFilterChange('searchQuery', e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-slate-900 transition-colors"
            aria-label="Search catalog products"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          {filters.searchQuery && (
            <button
              onClick={() => onFilterChange('searchQuery', '')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 p-0.5"
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative shrink-0">
            <select
              value={filters.sortBy}
              onChange={(e) => onFilterChange('sortBy', e.target.value)}
              className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-700 font-medium"
              aria-label="Sort catalog products"
            >
              <option value="title-asc">Sort: Title (A - Z)</option>
              <option value="title-desc">Sort: Title (Z - A)</option>
              <option value="price-asc">Sort: Price (Low to High)</option>
              <option value="price-desc">Sort: Price (High to Low)</option>
              <option value="grade-asc">Sort: Grade</option>
              <option value="newest">Sort: Newest Added</option>
            </select>
          </div>

          {isFiltered && (
            <Button
              variant="outline"
              size="sm"
              onClick={onResetFilters}
              leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
              className="text-xs"
            >
              Reset
            </Button>
          )}
        </div>
      </div>

      {/* Filter Dropdowns Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 pt-1 border-t border-slate-100 text-xs">
        {/* Grade */}
        <div>
          <label htmlFor="filter-grade" className="sr-only">Filter by Grade</label>
          <select
            id="filter-grade"
            value={filters.grade}
            onChange={(e) => onFilterChange('grade', e.target.value)}
            className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-700"
          >
            <option value="">All Grades</option>
            {grades.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </div>

        {/* Subject */}
        <div>
          <label htmlFor="filter-subject" className="sr-only">Filter by Subject</label>
          <select
            id="filter-subject"
            value={filters.subject}
            onChange={(e) => onFilterChange('subject', e.target.value)}
            className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-700"
          >
            <option value="">All Subjects</option>
            {subjects.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {/* Category */}
        <div>
          <label htmlFor="filter-category" className="sr-only">Filter by Category</label>
          <select
            id="filter-category"
            value={filters.category}
            onChange={(e) => onFilterChange('category', e.target.value)}
            className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-700"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Publisher */}
        <div>
          <label htmlFor="filter-publisher" className="sr-only">Filter by Publisher</label>
          <select
            id="filter-publisher"
            value={filters.publisher}
            onChange={(e) => onFilterChange('publisher', e.target.value)}
            className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-700"
          >
            <option value="">All Publishers</option>
            {publishers.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>

        {/* Status */}
        <div className="col-span-2 sm:col-span-1">
          <label htmlFor="filter-status" className="sr-only">Filter by Status</label>
          <select
            id="filter-status"
            value={filters.status}
            onChange={(e) => onFilterChange('status', e.target.value)}
            className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-700"
          >
            <option value="">All Statuses</option>
            <option value="in_stock">In Stock</option>
            <option value="low_stock">Low Stock</option>
            <option value="out_of_stock">Out of Stock</option>
            <option value="discontinued">Discontinued</option>
          </select>
        </div>
      </div>

      {/* Result Counter & Active Filter summary */}
      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 font-medium">
        <span>
          Showing <strong className="text-slate-800">{filteredCount}</strong> of{' '}
          <strong className="text-slate-800">{totalCount}</strong> catalog titles
        </span>
        {isFiltered && (
          <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
            Filtered view active
          </span>
        )}
      </div>
    </div>
  );
};
