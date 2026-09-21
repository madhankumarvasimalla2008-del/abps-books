'use client';

import React from 'react';
import { Product } from '@/types';
import { ProductCard } from '@/components/customer/ProductCard';
import { Skeleton } from '@/components/ui/Skeleton';

export interface ProductGridProps {
  products: Product[];
  isLoading?: boolean;
  skeletonCount?: number;
}

export const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  isLoading = false,
  skeletonCount = 6,
}) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-xl border border-slate-200/80 p-4 space-y-4 animate-pulse"
          >
            <div className="bg-slate-100 rounded-lg h-44 flex items-center justify-center">
              <Skeleton className="w-24 h-32 rounded" />
            </div>
            <div className="space-y-2">
              <div className="flex gap-2">
                <Skeleton className="w-16 h-4 rounded" />
                <Skeleton className="w-12 h-4 rounded" />
              </div>
              <Skeleton className="w-full h-5 rounded" />
              <Skeleton className="w-3/4 h-3 rounded" />
            </div>
            <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
              <Skeleton className="w-16 h-6 rounded" />
              <Skeleton className="w-20 h-8 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
};
