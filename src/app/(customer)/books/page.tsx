'use client';

import React, { useState, useMemo, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { SlidersHorizontal, X } from 'lucide-react';
import { useProducts } from '@/context/ProductContext';
import { useCategories } from '@/context/CategoryContext';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Button } from '@/components/ui/Button';
import { CatalogSearch } from '@/components/customer/catalog/CatalogSearch';
import { CatalogFilters, CatalogFilterState } from '@/components/customer/catalog/CatalogFilters';
import { CatalogSort, SortOption } from '@/components/customer/catalog/CatalogSort';
import { ProductGrid } from '@/components/customer/catalog/ProductGrid';
import { CatalogEmptyState } from '@/components/customer/catalog/CatalogEmptyState';

function BooksCatalogContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { products } = useProducts();
  const { categories } = useCategories();

  // Initialize state from URL params
  const paramQ = searchParams.get('q') || '';
  const paramGrade = searchParams.get('grade') || undefined;
  const paramSubject = searchParams.get('subject') || undefined;
  const paramCategory = searchParams.get('category') || undefined;
  const paramPublisher = searchParams.get('publisher') || undefined;
  const paramAvailability = (searchParams.get('availability') as CatalogFilterState['availability']) || undefined;
  const paramMinPrice = searchParams.get('minPrice')
    ? parseInt(searchParams.get('minPrice')!, 10)
    : undefined;
  const paramMaxPrice = searchParams.get('maxPrice')
    ? parseInt(searchParams.get('maxPrice')!, 10)
    : undefined;
  const paramSort = (searchParams.get('sort') as SortOption) || 'featured';

  const [searchQuery, setSearchQuery] = useState(paramQ);
  const [filters, setFilters] = useState<CatalogFilterState>({
    grade: paramGrade,
    subject: paramSubject,
    category: paramCategory,
    publisher: paramPublisher,
    availability: paramAvailability,
    minPrice: paramMinPrice,
    maxPrice: paramMaxPrice,
  });
  const [sortOption, setSortOption] = useState<SortOption>(paramSort);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  // Sync state if URL changes externally (e.g., browser back/forward)
  useEffect(() => {
    setSearchQuery(paramQ);
    setFilters({
      grade: paramGrade,
      subject: paramSubject,
      category: paramCategory,
      publisher: paramPublisher,
      availability: paramAvailability,
      minPrice: paramMinPrice,
      maxPrice: paramMaxPrice,
    });
    setSortOption(paramSort);
  }, [
    paramQ,
    paramGrade,
    paramSubject,
    paramCategory,
    paramPublisher,
    paramAvailability,
    paramMinPrice,
    paramMaxPrice,
    paramSort,
  ]);

  // Push updated parameters to URL
  const updateUrl = useCallback(
    (newQ: string, newFilters: CatalogFilterState, newSort: SortOption) => {
      const params = new URLSearchParams();
      if (newQ) params.set('q', newQ);
      if (newFilters.grade) params.set('grade', newFilters.grade);
      if (newFilters.subject) params.set('subject', newFilters.subject);
      if (newFilters.category) params.set('category', newFilters.category);
      if (newFilters.publisher) params.set('publisher', newFilters.publisher);
      if (newFilters.availability && newFilters.availability !== 'all') {
        params.set('availability', newFilters.availability);
      }
      if (newFilters.minPrice !== undefined) params.set('minPrice', newFilters.minPrice.toString());
      if (newFilters.maxPrice !== undefined) params.set('maxPrice', newFilters.maxPrice.toString());
      if (newSort && newSort !== 'featured') params.set('sort', newSort);

      const qs = params.toString();
      const target = qs ? `${pathname}?${qs}` : pathname;
      router.replace(target, { scroll: false });
    },
    [pathname, router]
  );

  // Filter option sets extracted dynamically from dataset
  const availableGrades = useMemo(() => {
    const grades = Array.from(new Set(products.map((p) => p.grade).filter(Boolean)));
    // Sort logically
    return grades.sort((a, b) => {
      const numA = parseInt(a.replace(/\D/g, ''), 10) || 0;
      const numB = parseInt(b.replace(/\D/g, ''), 10) || 0;
      if (a.includes('Pre-Primary')) return -1;
      if (b.includes('Pre-Primary')) return 1;
      return numA - numB;
    });
  }, [products]);

  const availableSubjects = useMemo(() => {
    return Array.from(new Set(products.map((p) => p.subject).filter(Boolean))).sort();
  }, [products]);

  const availableCategories = useMemo(() => {
    const set = new Set([
      ...categories.map((c) => c.name),
      ...products.map((p) => p.category).filter(Boolean),
    ]);
    return Array.from(set).sort();
  }, [categories, products]);

  const availablePublishers = useMemo(() => {
    return Array.from(new Set(products.map((p) => p.publisher).filter(Boolean))).sort();
  }, [products]);

  // Handlers for user interactions
  const handleSearch = (q: string) => {
    setSearchQuery(q);
    updateUrl(q, filters, sortOption);
  };

  const handleFilterChange = (newFilters: CatalogFilterState) => {
    setFilters(newFilters);
    updateUrl(searchQuery, newFilters, sortOption);
  };

  const handleSortChange = (newSort: SortOption) => {
    setSortOption(newSort);
    updateUrl(searchQuery, filters, newSort);
  };

  const handleResetFiltersOnly = () => {
    const emptyFilters: CatalogFilterState = {};
    setFilters(emptyFilters);
    updateUrl(searchQuery, emptyFilters, sortOption);
  };

  const handleClearSearchOnly = () => {
    setSearchQuery('');
    updateUrl('', filters, sortOption);
  };

  const handleResetAll = () => {
    setSearchQuery('');
    setFilters({});
    setSortOption('featured');
    updateUrl('', {}, 'featured');
  };

  const removeFilterItem = (key: keyof CatalogFilterState) => {
    const updated = { ...filters, [key]: undefined };
    setFilters(updated);
    updateUrl(searchQuery, updated, sortOption);
  };

  // Active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.grade) count++;
    if (filters.subject) count++;
    if (filters.category) count++;
    if (filters.publisher) count++;
    if (filters.availability && filters.availability !== 'all') count++;
    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) count++;
    return count;
  }, [filters]);

  const hasAnyActiveSelection = activeFilterCount > 0 || Boolean(searchQuery);

  // Filter and Sort Pipeline
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      // Search matching across title, ISBN, author, publisher, subject, grade, sku, description
      if (searchQuery.trim()) {
        const terms = searchQuery.toLowerCase().trim().split(/\s+/);
        const searchableContent = [
          product.title,
          product.isbn,
          product.author,
          product.publisher,
          product.subject,
          product.grade,
          product.sku,
          product.description,
        ]
          .join(' ')
          .toLowerCase();

        const matchesAllTerms = terms.every((t) => searchableContent.includes(t));
        if (!matchesAllTerms) return false;
      }

      // Grade matching
      if (filters.grade) {
        const normalizedFilter = filters.grade.toLowerCase().replace(/\s+/g, '');
        const normalizedProduct = product.grade.toLowerCase().replace(/\s+/g, '');
        if (
          normalizedProduct !== normalizedFilter &&
          !normalizedProduct.includes(normalizedFilter)
        ) {
          return false;
        }
      }

      // Subject matching
      if (filters.subject) {
        if (product.subject.toLowerCase() !== filters.subject.toLowerCase()) {
          return false;
        }
      }

      // Category matching
      if (filters.category) {
        if (product.category.toLowerCase() !== filters.category.toLowerCase()) {
          return false;
        }
      }

      // Publisher matching
      if (filters.publisher) {
        if (product.publisher.toLowerCase() !== filters.publisher.toLowerCase()) {
          return false;
        }
      }

      // Stock availability matching
      if (filters.availability === 'in_stock') {
        if (product.status === 'out_of_stock') return false;
      } else if (filters.availability === 'low_stock') {
        if (product.status !== 'low_stock') return false;
      }

      // Price matching
      if (filters.minPrice !== undefined && product.sellingPrice < filters.minPrice) {
        return false;
      }
      if (filters.maxPrice !== undefined && product.sellingPrice > filters.maxPrice) {
        return false;
      }

      return true;
    }).sort((a, b) => {
      switch (sortOption) {
        case 'price-asc':
          return a.sellingPrice - b.sellingPrice;
        case 'price-desc':
          return b.sellingPrice - a.sellingPrice;
        case 'title-asc':
          return a.title.localeCompare(b.title);
        case 'title-desc':
          return b.title.localeCompare(a.title);
        case 'newest':
          return (b.edition || '').localeCompare(a.edition || '');
        case 'featured':
        default:
          return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
      }
    });
  }, [products, searchQuery, filters, sortOption]);

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: 'Books Catalog' },
          ...(filters.grade ? [{ label: filters.grade }] : []),
          ...(filters.subject ? [{ label: filters.subject }] : []),
        ]}
      />

      {/* Catalog Header & Top Actions */}
      <div className="store-catalog-heading space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#142C43] tracking-tight">
              The book collection
            </h1>
            <p className="text-xs sm:text-sm text-[#61717B] mt-1">
              Find your next textbook, reference or workbook. Browse by class, subject and publisher.
            </p>
          </div>

          {/* Quick Stats Pill */}
          <div className="text-xs bg-[#EDF2F1] text-[#28657A] font-medium px-3.5 py-1.5 rounded-sm border border-[#DDDCD3] self-start md:self-auto shrink-0">
            In the catalog: <strong className="font-bold">{products.length} titles</strong>
          </div>
        </div>

        {/* Search Bar & Mobile Filter Trigger */}
        <div className="flex items-center gap-3 pt-1">
          <CatalogSearch initialValue={searchQuery} onSearch={handleSearch} />

          {/* Mobile Filter Button */}
          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={() => setIsMobileDrawerOpen(true)}
            className="lg:hidden shrink-0 text-xs flex items-center gap-1.5"
            aria-label="Open filter sidebar"
          >
            <SlidersHorizontal className="w-4 h-4 text-[#28657A]" />
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-[#28657A] text-white text-[10px] flex items-center justify-center font-bold">
                {activeFilterCount}
              </span>
            )}
          </Button>
        </div>

        {/* Active Filter Chips / Pills */}
        {hasAnyActiveSelection && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#DDDCD3]/60">
            <span className="text-xs font-semibold text-[#61717B]">Active filters:</span>

            {searchQuery && (
              <span className="inline-flex items-center gap-1 text-xs bg-[#F0EEE7] text-[#142C43] px-2.5 py-1 rounded-sm border border-[#DDDCD3]">
                Search: &quot;{searchQuery}&quot;
                <button
                  type="button"
                  onClick={handleClearSearchOnly}
                  className="hover:text-red-600 focus:outline-none"
                  aria-label="Remove search filter"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            )}

            {filters.grade && (
              <span className="inline-flex items-center gap-1 text-xs bg-[#EDF2F1] text-[#28657A] px-2.5 py-1 rounded-sm border border-[#DDDCD3]">
                Class: {filters.grade}
                <button
                  type="button"
                  onClick={() => removeFilterItem('grade')}
                  className="hover:text-red-600 focus:outline-none"
                  aria-label="Remove grade filter"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            )}

            {filters.subject && (
              <span className="inline-flex items-center gap-1 text-xs bg-[#EDF2F1] text-[#28657A] px-2.5 py-1 rounded-sm border border-[#DDDCD3]">
                Subject: {filters.subject}
                <button
                  type="button"
                  onClick={() => removeFilterItem('subject')}
                  className="hover:text-red-600 focus:outline-none"
                  aria-label="Remove subject filter"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            )}

            {filters.category && (
              <span className="inline-flex items-center gap-1 text-xs bg-[#EDF2F1] text-[#28657A] px-2.5 py-1 rounded-sm border border-[#DDDCD3]">
                Category: {filters.category}
                <button
                  type="button"
                  onClick={() => removeFilterItem('category')}
                  className="hover:text-red-600 focus:outline-none"
                  aria-label="Remove category filter"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            )}

            {filters.publisher && (
              <span className="inline-flex items-center gap-1 text-xs bg-[#EDF2F1] text-[#28657A] px-2.5 py-1 rounded-sm border border-[#DDDCD3]">
                Publisher: {filters.publisher}
                <button
                  type="button"
                  onClick={() => removeFilterItem('publisher')}
                  className="hover:text-red-600 focus:outline-none"
                  aria-label="Remove publisher filter"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            )}

            {filters.availability && (
              <span className="inline-flex items-center gap-1 text-xs bg-[#EDF2F1] text-[#28657A] px-2.5 py-1 rounded-sm border border-[#DDDCD3]">
                Availability: {filters.availability === 'in_stock' ? 'In Stock Only' : 'Low Stock'}
                <button
                  type="button"
                  onClick={() => removeFilterItem('availability')}
                  className="hover:text-red-600 focus:outline-none"
                  aria-label="Remove availability filter"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            )}

            {(filters.minPrice !== undefined || filters.maxPrice !== undefined) && (
              <span className="inline-flex items-center gap-1 text-xs bg-[#EDF2F1] text-[#28657A] px-2.5 py-1 rounded-sm border border-[#DDDCD3]">
                Price: ₹{filters.minPrice || 0} - ₹{filters.maxPrice || 'Any'}
                <button
                  type="button"
                  onClick={() => {
                    const updated = { ...filters, minPrice: undefined, maxPrice: undefined };
                    setFilters(updated);
                    updateUrl(searchQuery, updated, sortOption);
                  }}
                  className="hover:text-red-600 focus:outline-none"
                  aria-label="Remove price filter"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            )}

            <button
              type="button"
              onClick={handleResetAll}
              className="text-xs text-red-600 hover:text-red-700 font-medium ml-1 underline cursor-pointer"
            >
              Clear All
            </button>
          </div>
        )}
      </div>

      {/* Main Catalog Section: Sidebar + Product Grid */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Desktop and Mobile Filters Component */}
        <CatalogFilters
          filters={filters}
          onFilterChange={handleFilterChange}
          onReset={handleResetFiltersOnly}
          availableGrades={availableGrades}
          availableSubjects={availableSubjects}
          availableCategories={availableCategories}
          availablePublishers={availablePublishers}
          activeFilterCount={activeFilterCount}
          isMobileDrawerOpen={isMobileDrawerOpen}
          setIsMobileDrawerOpen={setIsMobileDrawerOpen}
        />

        {/* Catalog Main Body */}
        <section className="flex-1 min-w-0 w-full space-y-5" aria-label="Book listings">
          {/* Top Bar: Results Count + Sorting Control */}
          <div className="store-catalog-toolbar flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="text-xs font-semibold text-[#526570]">
              Showing <span className="text-[#142C43] font-bold">{filteredProducts.length}</span>{' '}
              {filteredProducts.length === 1 ? 'book' : 'books'}
              {filteredProducts.length < products.length && (
                <span className="text-slate-400 font-normal ml-1">
                  (filtered from {products.length})
                </span>
              )}
            </div>

            <CatalogSort currentSort={sortOption} onSortChange={handleSortChange} />
          </div>

          {/* Product Grid or No-Results State */}
          {filteredProducts.length > 0 ? (
            <ProductGrid products={filteredProducts} />
          ) : (
            <CatalogEmptyState
              searchQuery={searchQuery}
              hasActiveFilters={activeFilterCount > 0}
              onClearFilters={handleResetFiltersOnly}
              onClearSearch={handleClearSearchOnly}
              onResetAll={handleResetAll}
            />
          )}
        </section>
      </div>
    </div>
  );
}

export default function BooksCatalogPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-xs text-[#61717B]">Loading book catalog...</div>
      }
    >
      <BooksCatalogContent />
    </Suspense>
  );
}
