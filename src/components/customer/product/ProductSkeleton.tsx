'use client';

import React from 'react';
import { Skeleton } from '@/components/ui/Skeleton';

export const ProductSkeleton: React.FC = () => {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Breadcrumb skeleton */}
      <div className="flex items-center gap-2">
        <Skeleton className="w-12 h-4 rounded" />
        <span className="text-slate-300">/</span>
        <Skeleton className="w-16 h-4 rounded" />
        <span className="text-slate-300">/</span>
        <Skeleton className="w-24 h-4 rounded" />
      </div>

      {/* Main product overview grid skeleton */}
      <div className="bg-white rounded-sm border border-[#DDDCD3] p-6 sm:p-8 ">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left: Gallery skeleton */}
          <div className="lg:col-span-5 flex flex-col items-center">
            <div className="w-full bg-[#FAF8F3] rounded-sm border border-[#DDDCD3] p-8 flex items-center justify-center min-h-[360px]">
              <Skeleton className="w-48 sm:w-56 aspect-[3/4] rounded-sm" />
            </div>
            <div className="w-full mt-4 flex justify-between">
              <Skeleton className="w-24 h-4 rounded" />
              <Skeleton className="w-20 h-6 rounded-sm" />
            </div>
          </div>

          {/* Right: Meta & Purchase Card skeleton */}
          <div className="lg:col-span-7 space-y-6">
            <div className="space-y-3">
              <div className="flex gap-2">
                <Skeleton className="w-20 h-5 rounded-md" />
                <Skeleton className="w-16 h-5 rounded-md" />
                <Skeleton className="w-16 h-5 rounded-md" />
              </div>
              <Skeleton className="w-3/4 h-8 rounded-sm" />
              <Skeleton className="w-1/2 h-4 rounded" />
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-3 border-y border-[#DDDCD3]/60">
                <Skeleton className="w-full h-10 rounded" />
                <Skeleton className="w-full h-10 rounded" />
                <Skeleton className="w-full h-10 rounded" />
                <Skeleton className="w-full h-10 rounded" />
              </div>
            </div>

            {/* Purchase card skeleton */}
            <div className="bg-[#FAF8F3] p-6 rounded-sm border border-[#DDDCD3] space-y-4">
              <Skeleton className="w-32 h-8 rounded" />
              <Skeleton className="w-full h-10 rounded-sm" />
              <Skeleton className="w-full h-12 rounded-sm" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
