'use client';

import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export interface CatalogErrorStateProps {
  message?: string;
  onRetry: () => void;
}

export const CatalogErrorState: React.FC<CatalogErrorStateProps> = ({
  message = 'An unexpected error occurred while loading the catalog.',
  onRetry,
}) => {
  return (
    <div className="bg-white rounded-2xl border border-rose-200 p-8 sm:p-12 text-center max-w-lg mx-auto my-6 shadow-2xs space-y-4">
      <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
        <AlertTriangle className="w-7 h-7" />
      </div>

      <div className="space-y-1">
        <h3 className="text-base sm:text-lg font-bold text-slate-900">
          Catalog Loading Issue
        </h3>
        <p className="text-xs sm:text-sm text-slate-500">{message}</p>
      </div>

      <div className="pt-2">
        <Button
          variant="primary"
          size="sm"
          onClick={onRetry}
          leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
        >
          Retry Loading
        </Button>
      </div>
    </div>
  );
};
