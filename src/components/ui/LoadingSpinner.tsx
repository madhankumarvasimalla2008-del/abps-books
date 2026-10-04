import React from 'react';

export interface LoadingSpinnerProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  message = 'Loading catalog data...',
  size = 'md',
  className = '',
}) => {
  const sizeClasses = {
    sm: 'h-5 w-5 border-2',
    md: 'h-8 w-8 border-3',
    lg: 'h-12 w-12 border-4',
  };

  return (
    <div
      className={`flex flex-col items-center justify-center p-8 min-h-[180px] ${className}`}
      role="status"
      aria-live="polite"
    >
      <div
        className={`animate-spin rounded-full border-slate-200 border-t-[#023859] ${sizeClasses[size]}`}
        aria-hidden="true"
      />
      {message && <p className="mt-3 text-sm font-medium text-slate-500">{message}</p>}
      <span className="sr-only">{message || 'Loading...'}</span>
    </div>
  );
};
