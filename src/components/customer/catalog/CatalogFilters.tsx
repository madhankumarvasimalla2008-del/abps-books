'use client';

import React, { useState } from 'react';
import { Filter, X, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

export interface CatalogFilterState {
  grade?: string;
  subject?: string;
  category?: string;
  publisher?: string;
  availability?: 'all' | 'in_stock' | 'low_stock';
  minPrice?: number;
  maxPrice?: number;
}

export interface CatalogFiltersProps {
  filters: CatalogFilterState;
  onFilterChange: (newFilters: CatalogFilterState) => void;
  onReset: () => void;
  availableGrades: string[];
  availableSubjects: string[];
  availableCategories: string[];
  availablePublishers: string[];
  activeFilterCount: number;
  isMobileDrawerOpen: boolean;
  setIsMobileDrawerOpen: (open: boolean) => void;
}

export const CatalogFilters: React.FC<CatalogFiltersProps> = ({
  filters,
  onFilterChange,
  onReset,
  availableGrades,
  availableSubjects,
  availableCategories,
  availablePublishers,
  activeFilterCount,
  isMobileDrawerOpen,
  setIsMobileDrawerOpen,
}) => {
  const [expandedSections, setExpandedSections] = useState({
    grade: true,
    subject: true,
    category: true,
    publisher: false,
    availability: true,
    price: true,
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleFieldChange = (key: keyof CatalogFilterState, value: any) => {
    onFilterChange({
      ...filters,
      [key]: value,
    });
  };

  const filterContent = (
    <div className="space-y-6">
      {/* Grade / Class Filter */}
      <div className="border-b border-slate-100 pb-4">
        <button
          type="button"
          onClick={() => toggleSection('grade')}
          className="flex items-center justify-between w-full text-left font-bold text-xs text-slate-900 uppercase tracking-wider py-1 focus:outline-none focus:ring-1 focus:ring-emerald-600 rounded"
          aria-expanded={expandedSections.grade}
        >
          <span>Class / Grade</span>
          {expandedSections.grade ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </button>

        {expandedSections.grade && (
          <div className="mt-2.5 space-y-1.5 max-h-48 overflow-y-auto pr-1">
            <button
              type="button"
              onClick={() => handleFieldChange('grade', undefined)}
              className={`w-full text-left px-2.5 py-1.5 rounded-md text-xs transition-colors flex items-center justify-between ${
                !filters.grade
                  ? 'bg-emerald-50 text-emerald-900 font-semibold'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span>All Grades</span>
              {!filters.grade && <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />}
            </button>
            {availableGrades.map((g) => {
              const isSelected = filters.grade === g;
              return (
                <button
                  key={g}
                  type="button"
                  onClick={() => handleFieldChange('grade', isSelected ? undefined : g)}
                  className={`w-full text-left px-2.5 py-1.5 rounded-md text-xs transition-colors flex items-center justify-between ${
                    isSelected
                      ? 'bg-emerald-50 text-emerald-900 font-semibold'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span>{g}</span>
                  {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Subject Filter */}
      <div className="border-b border-slate-100 pb-4">
        <button
          type="button"
          onClick={() => toggleSection('subject')}
          className="flex items-center justify-between w-full text-left font-bold text-xs text-slate-900 uppercase tracking-wider py-1 focus:outline-none focus:ring-1 focus:ring-emerald-600 rounded"
          aria-expanded={expandedSections.subject}
        >
          <span>Subject</span>
          {expandedSections.subject ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </button>

        {expandedSections.subject && (
          <div className="mt-2.5 space-y-1.5 max-h-44 overflow-y-auto pr-1">
            <button
              type="button"
              onClick={() => handleFieldChange('subject', undefined)}
              className={`w-full text-left px-2.5 py-1.5 rounded-md text-xs transition-colors flex items-center justify-between ${
                !filters.subject
                  ? 'bg-emerald-50 text-emerald-900 font-semibold'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span>All Subjects</span>
              {!filters.subject && <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />}
            </button>
            {availableSubjects.map((s) => {
              const isSelected = filters.subject === s;
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => handleFieldChange('subject', isSelected ? undefined : s)}
                  className={`w-full text-left px-2.5 py-1.5 rounded-md text-xs transition-colors flex items-center justify-between ${
                    isSelected
                      ? 'bg-emerald-50 text-emerald-900 font-semibold'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span>{s}</span>
                  {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Category Filter */}
      <div className="border-b border-slate-100 pb-4">
        <button
          type="button"
          onClick={() => toggleSection('category')}
          className="flex items-center justify-between w-full text-left font-bold text-xs text-slate-900 uppercase tracking-wider py-1 focus:outline-none focus:ring-1 focus:ring-emerald-600 rounded"
          aria-expanded={expandedSections.category}
        >
          <span>Category</span>
          {expandedSections.category ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </button>

        {expandedSections.category && (
          <div className="mt-2.5 space-y-1.5">
            <button
              type="button"
              onClick={() => handleFieldChange('category', undefined)}
              className={`w-full text-left px-2.5 py-1.5 rounded-md text-xs transition-colors flex items-center justify-between ${
                !filters.category
                  ? 'bg-emerald-50 text-emerald-900 font-semibold'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span>All Categories</span>
              {!filters.category && <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />}
            </button>
            {availableCategories.map((c) => {
              const isSelected = filters.category?.toLowerCase() === c.toLowerCase();
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => handleFieldChange('category', isSelected ? undefined : c)}
                  className={`w-full text-left px-2.5 py-1.5 rounded-md text-xs transition-colors flex items-center justify-between ${
                    isSelected
                      ? 'bg-emerald-50 text-emerald-900 font-semibold'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span>{c}</span>
                  {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Publisher Filter */}
      <div className="border-b border-slate-100 pb-4">
        <button
          type="button"
          onClick={() => toggleSection('publisher')}
          className="flex items-center justify-between w-full text-left font-bold text-xs text-slate-900 uppercase tracking-wider py-1 focus:outline-none focus:ring-1 focus:ring-emerald-600 rounded"
          aria-expanded={expandedSections.publisher}
        >
          <span>Publisher</span>
          {expandedSections.publisher ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </button>

        {expandedSections.publisher && (
          <div className="mt-2.5 space-y-1.5 max-h-40 overflow-y-auto pr-1">
            <button
              type="button"
              onClick={() => handleFieldChange('publisher', undefined)}
              className={`w-full text-left px-2.5 py-1.5 rounded-md text-xs transition-colors flex items-center justify-between ${
                !filters.publisher
                  ? 'bg-emerald-50 text-emerald-900 font-semibold'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span>All Publishers</span>
              {!filters.publisher && <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />}
            </button>
            {availablePublishers.map((p) => {
              const isSelected = filters.publisher?.toLowerCase() === p.toLowerCase();
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => handleFieldChange('publisher', isSelected ? undefined : p)}
                  className={`w-full text-left px-2.5 py-1.5 rounded-md text-xs transition-colors flex items-center justify-between ${
                    isSelected
                      ? 'bg-emerald-50 text-emerald-900 font-semibold'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span>{p}</span>
                  {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Stock Availability Filter */}
      <div className="border-b border-slate-100 pb-4">
        <button
          type="button"
          onClick={() => toggleSection('availability')}
          className="flex items-center justify-between w-full text-left font-bold text-xs text-slate-900 uppercase tracking-wider py-1 focus:outline-none focus:ring-1 focus:ring-emerald-600 rounded"
          aria-expanded={expandedSections.availability}
        >
          <span>Availability</span>
          {expandedSections.availability ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </button>

        {expandedSections.availability && (
          <div className="mt-2.5 space-y-1.5">
            {[
              { label: 'All Items', value: 'all' },
              { label: 'In Stock Only', value: 'in_stock' },
              { label: 'Low Stock Priority', value: 'low_stock' },
            ].map((option) => {
              const isSelected =
                (filters.availability || 'all') === option.value ||
                (!filters.availability && option.value === 'all');
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() =>
                    handleFieldChange(
                      'availability',
                      option.value === 'all' ? undefined : option.value
                    )
                  }
                  className={`w-full text-left px-2.5 py-1.5 rounded-md text-xs transition-colors flex items-center justify-between ${
                    isSelected
                      ? 'bg-emerald-50 text-emerald-900 font-semibold'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span>{option.label}</span>
                  {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Price Range Filter */}
      <div>
        <button
          type="button"
          onClick={() => toggleSection('price')}
          className="flex items-center justify-between w-full text-left font-bold text-xs text-slate-900 uppercase tracking-wider py-1 focus:outline-none focus:ring-1 focus:ring-emerald-600 rounded"
          aria-expanded={expandedSections.price}
        >
          <span>Price Range</span>
          {expandedSections.price ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </button>

        {expandedSections.price && (
          <div className="mt-2.5 space-y-2">
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <label htmlFor="min-price-filter" className="sr-only">
                  Minimum price in rupees
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                    ₹
                  </span>
                  <input
                    id="min-price-filter"
                    type="number"
                    min="0"
                    placeholder="Min"
                    value={filters.minPrice !== undefined ? filters.minPrice : ''}
                    onChange={(e) =>
                      handleFieldChange(
                        'minPrice',
                        e.target.value ? parseInt(e.target.value, 10) : undefined
                      )
                    }
                    className="w-full pl-6 pr-2 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600"
                  />
                </div>
              </div>
              <span className="text-slate-400 text-xs">-</span>
              <div className="flex-1">
                <label htmlFor="max-price-filter" className="sr-only">
                  Maximum price in rupees
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                    ₹
                  </span>
                  <input
                    id="max-price-filter"
                    type="number"
                    min="0"
                    placeholder="Max"
                    value={filters.maxPrice !== undefined ? filters.maxPrice : ''}
                    onChange={(e) =>
                      handleFieldChange(
                        'maxPrice',
                        e.target.value ? parseInt(e.target.value, 10) : undefined
                      )
                    }
                    className="w-full pl-6 pr-2 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600"
                  />
                </div>
              </div>
            </div>

            {/* Quick Price shortcuts */}
            <div className="flex flex-wrap gap-1 pt-1">
              {[
                { label: '< ₹200', max: 200 },
                { label: '₹200-₹500', min: 200, max: 500 },
                { label: '₹500+', min: 500 },
              ].map((bracket) => (
                <button
                  key={bracket.label}
                  type="button"
                  onClick={() =>
                    onFilterChange({
                      ...filters,
                      minPrice: bracket.min,
                      maxPrice: bracket.max,
                    })
                  }
                  className="text-[11px] px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                >
                  {bracket.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar Container */}
      <aside className="hidden lg:block w-64 shrink-0" aria-label="Catalog Filters">
        <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs sticky top-24 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-emerald-800" />
              <h2 className="font-bold text-sm text-slate-900">Filters</h2>
              {activeFilterCount > 0 && (
                <Badge variant="default" size="sm">
                  {activeFilterCount}
                </Badge>
              )}
            </div>
            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={onReset}
                className="text-xs text-slate-500 hover:text-red-600 flex items-center gap-1 transition-colors"
                aria-label="Reset all filters"
              >
                <RotateCcw className="w-3 h-3" />
                Reset
              </button>
            )}
          </div>

          {filterContent}
        </div>
      </aside>

      {/* Mobile Filter Drawer / Modal */}
      {isMobileDrawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileDrawerOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer panel */}
          <div className="fixed inset-y-0 right-0 max-w-xs w-full bg-white shadow-xl flex flex-col z-10 animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-emerald-800" />
                <h2 className="font-bold text-sm text-slate-900">Filter Books</h2>
                {activeFilterCount > 0 && (
                  <Badge variant="default" size="sm">
                    {activeFilterCount}
                  </Badge>
                )}
              </div>
              <button
                type="button"
                onClick={() => setIsMobileDrawerOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
                aria-label="Close filters"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 flex-1 overflow-y-auto">{filterContent}</div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center gap-2">
              {activeFilterCount > 0 && (
                <Button variant="outline" size="sm" onClick={onReset} className="flex-1 text-xs">
                  Reset All
                </Button>
              )}
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsMobileDrawerOpen(false)}
                className="flex-1 text-xs"
              >
                Apply Filters
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
