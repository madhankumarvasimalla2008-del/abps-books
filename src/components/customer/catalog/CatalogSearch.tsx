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
    <form onSubmit={handleSubmit} className={`relative flex-1 ${className}`} role="search">
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
          className="w-full pl-10 pr-20 py-2.5 bg-white border border-[#D4EBF0] rounded-xl text-xs sm:text-sm text-[#011C40] placeholder:text-[#537D99] focus:outline-none focus:ring-2 focus:ring-[#023859] focus:border-[#023859] shadow-2xs transition-all"
        />
        <Search
          className="w-4 h-4 text-[#537D99] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
          aria-hidden="true"
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {value && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 text-[#537D99] hover:text-[#011C40] rounded-md focus:outline-none focus:ring-2 focus:ring-[#023859]"
              aria-label="Clear search input"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            type="submit"
            className="px-2.5 py-1 text-xs font-semibold text-[#023859] bg-[#EBF7FA] hover:bg-[#A7EBF2]/40 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-[#023859]"
          >
            Search
          </button>
        </div>
      </div>
    </form>
  );
};
