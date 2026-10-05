'use client';

import React, { useState, useEffect } from 'react';
import { Search, Truck, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export interface TrackingLookupProps {
  initialValue?: string;
  onSearch: (query: string) => void;
  isLoading?: boolean;
}

export const TrackingLookup: React.FC<TrackingLookupProps> = ({
  initialValue = '',
  onSearch,
  isLoading = false,
}) => {
  const [query, setQuery] = useState(initialValue);

  useEffect(() => {
    setQuery(initialValue);
  }, [initialValue]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    onSearch(query.trim());
  };

  const handleClear = () => {
    setQuery('');
  };

  const handleSampleClick = (sample: string) => {
    setQuery(sample);
    onSearch(sample);
  };

  return (
    <div className="bg-white p-6 sm:p-8 rounded-sm border border-[#DDDCD3]  text-center space-y-4 max-w-2xl mx-auto">
      <div className="w-14 h-14 bg-[#EDF2F1] text-[#28657A] rounded-sm flex items-center justify-center mx-auto ring-8 ring-[#EDF2F1]/60">
        <Truck className="w-7 h-7" aria-hidden="true" />
      </div>

      <div className="space-y-1.5">
        <span className="text-xs font-bold text-[#28657A] uppercase tracking-wider bg-[#EDF2F1] px-2.5 py-1 rounded-full">
          Order Tracking
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#142C43] tracking-tight pt-1">
          Track Your Order
        </h1>
        <p className="text-xs sm:text-sm text-[#61717B] max-w-md mx-auto leading-relaxed">
          Enter your order or tracking reference.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2 pt-2">
        <div className="relative flex-1">
          <label htmlFor="tracking-search-input" className="sr-only">
            Order or tracking reference
          </label>
          <input
            id="tracking-search-input"
            type="text"
            required
            placeholder="e.g. o1, ORD-2026-001, BD-88392019"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-10 pr-9 py-2.5 text-xs sm:text-sm bg-[#FAF8F3] border border-[#DDDCD3] rounded-sm focus:outline-none focus:ring-2 focus:ring-[#28657A] focus:bg-white font-mono uppercase transition-all placeholder:normal-case placeholder:font-sans placeholder:text-slate-400"
          />
          <Search
            className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
            aria-hidden="true"
          />
          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#526570] p-1 rounded-md"
              aria-label="Clear search input"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <Button
          type="submit"
          variant="primary"
          size="md"
          isLoading={isLoading}
          className="text-xs sm:text-sm font-semibold  whitespace-nowrap"
        >
          Track Order
        </Button>
      </form>

      {/* Demo sample pills */}
      <div className="pt-2 border-t border-[#DDDCD3]/60 flex items-center justify-center gap-2 flex-wrap text-[11px] text-[#61717B]">
        <span>Try demo reference:</span>
        {[
          { label: 'o1 (Processing)', value: 'o1' },
          { label: 'o2 (Shipped)', value: 'o2' },
          { label: 'BD-88392019', value: 'BD-88392019' },
          { label: 'SHP-2026-1092', value: 'SHP-2026-1092' },
        ].map((sample) => (
          <button
            key={sample.value}
            type="button"
            onClick={() => handleSampleClick(sample.value)}
            className="font-mono text-[#28657A] bg-[#EDF2F1] hover:bg-[#A7EBF2]/40 border border-[#DDDCD3] px-2 py-0.5 rounded-sm transition-colors text-[11px]"
          >
            {sample.label}
          </button>
        ))}
      </div>
    </div>
  );
};
