'use client';

import React from 'react';
import { ArrowUpDown } from 'lucide-react';

export type SortOption =
  | 'featured'
  | 'title-asc'
  | 'title-desc'
  | 'price-asc'
  | 'price-desc'
  | 'newest';

export interface CatalogSortProps {
  currentSort: SortOption;
  onSortChange: (sort: SortOption) => void;
  className?: string;
}

export const CatalogSort: React.FC<CatalogSortProps> = ({
  currentSort,
  onSortChange,
  className = '',
}) => {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <label
        htmlFor="catalog-sort-select"
        className="text-xs font-medium text-[#26658C] whitespace-nowrap flex items-center gap-1.5"
      >
        <ArrowUpDown className="w-3.5 h-3.5 text-[#537D99]" />
        <span>Sort by:</span>
      </label>
      <div className="relative">
        <select
          id="catalog-sort-select"
          value={currentSort}
          onChange={(e) => onSortChange(e.target.value as SortOption)}
          className="bg-white border border-[#D4EBF0] text-xs font-medium text-[#011C40] rounded-lg pl-3 pr-8 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#023859] appearance-none shadow-2xs cursor-pointer"
        >
          <option value="featured">Featured / Recommended</option>
          <option value="title-asc">Title (A to Z)</option>
          <option value="title-desc">Title (Z to A)</option>
          <option value="price-asc">Price: Low to High</option>
          <option value="price-desc">Price: High to Low</option>
          <option value="newest">Newest Edition</option>
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-[#537D99]">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    </div>
  );
};
