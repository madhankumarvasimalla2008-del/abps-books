import React from 'react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export default function Loading() {
  return (
    <div className="min-h-[50vh] flex items-center justify-center">
      <LoadingSpinner message="Loading ABPS Books Platform..." size="lg" />
    </div>
  );
}
