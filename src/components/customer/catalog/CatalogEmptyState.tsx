'use client';

import React from 'react';
import { SearchX, RotateCcw, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export interface CatalogEmptyStateProps {
  searchQuery?: string;
  hasActiveFilters?: boolean;
  onClearFilters: () => void;
  onClearSearch: () => void;
  onResetAll: () => void;
}

export const CatalogEmptyState: React.FC<CatalogEmptyStateProps> = ({
  searchQuery,
  hasActiveFilters,
  onClearFilters,
  onClearSearch,
  onResetAll,
}) => {
  return (
    <div className="bg-white rounded-sm border border-[#DDDCD3] p-8 sm:p-12 text-center max-w-xl mx-auto my-6  space-y-4">
      <div className="w-14 h-14 bg-[#F0EEE7] text-[#61717B] rounded-sm flex items-center justify-center mx-auto">
        <SearchX className="w-7 h-7 text-slate-400" />
      </div>

      <div className="space-y-1">
        <h3 className="text-base sm:text-lg font-bold text-[#142C43]">
          No matching books found
        </h3>
        {searchQuery ? (
          <p className="text-xs sm:text-sm text-[#61717B]">
            We couldn&apos;t find any books matching &quot;<span className="font-semibold text-[#142C43]">{searchQuery}</span>&quot;.
          </p>
        ) : (
          <p className="text-xs sm:text-sm text-[#61717B]">
            No items matched your current filter criteria.
          </p>
        )}
      </div>

      <div className="text-xs text-[#61717B] bg-[#FAF8F3] p-4 rounded-sm text-left space-y-1.5 border border-[#DDDCD3]/60">
        <p className="font-semibold text-[#526570]">Suggestions:</p>
        <ul className="list-disc pl-4 space-y-1 text-[11px] text-[#526570]">
          <li>Check for spelling errors in the title, author, or publisher name.</li>
          <li>Try searching with broader terms (e.g. &quot;Mathematics&quot; instead of exact chapters).</li>
          <li>Try searching by standard 10 or 13-digit ISBN.</li>
          <li>Clear class or category filters to expand the search scope.</li>
        </ul>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
        {hasActiveFilters && (
          <Button
            variant="outline"
            size="sm"
            onClick={onClearFilters}
            leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
          >
            Clear Filters
          </Button>
        )}
        {searchQuery && (
          <Button
            variant="outline"
            size="sm"
            onClick={onClearSearch}
          >
            Clear Search
          </Button>
        )}
        <Button
          variant="primary"
          size="sm"
          onClick={onResetAll}
          leftIcon={<BookOpen className="w-3.5 h-3.5" />}
        >
          Browse All Books
        </Button>
      </div>
    </div>
  );
};
