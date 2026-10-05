'use client';

import React, { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';

export interface CatalogSearchProps {
  initialValue?: string;
  onSearch: (query: string) => void;
  className?: string;
}

export const CatalogSearch: React.FC<CatalogSearchProps> = ({
  initialValue = '',
  onSearch,
  className = '',
}) => {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(value.trim());
  };

  const handleClear = () => {
    setValue('');
    onSearch('');
  };

  return (
    <form onSubmit={handleSubmit} className={`relative min-w-0 flex-1 ${className}`} role="search">
      <label htmlFor="catalog-search-input" className="sr-only">
        Search books by title, ISBN, author, publisher, subject, or grade
      </label>
      <div className="relative">
        <input
          id="catalog-search-input"
          type="search"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Search by book title, ISBN, author, subject, grade, or publisher..."
          className="w-full pl-10 pr-28 py-2.5 bg-white border border-[#DDDCD3] rounded-sm text-xs sm:text-sm text-[#142C43] placeholder:text-[#61717B] focus:outline-none focus:ring-2 focus:ring-[#28657A] focus:border-[#28657A]  transition-all"
        />
        <Search
          className="w-4 h-4 text-[#61717B] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
          aria-hidden="true"
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {value && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 text-[#61717B] hover:text-[#142C43] rounded-md focus:outline-none focus:ring-2 focus:ring-[#28657A]"
              aria-label="Clear search input"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            type="submit"
            className="px-2.5 py-1 text-xs font-semibold text-[#28657A] bg-[#EDF2F1] hover:bg-[#A7EBF2]/40 rounded-sm transition-colors focus:outline-none focus:ring-2 focus:ring-[#28657A]"
          >
            Search
          </button>
        </div>
      </div>
    </form>
  );
};
