import React from 'react';
import { CustomerHeader } from '@/components/customer/CustomerHeader';
import { CustomerFooter } from '@/components/customer/CustomerFooter';

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-[#F7FCFD] text-[#011C40]">
      <a href="#main-content" className="skip-to-content">
        Skip to main content
      </a>
      <CustomerHeader />
      <main
        id="main-content"
        tabIndex={-1}
        className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 focus:outline-none"
      >
        {children}
      </main>
      <CustomerFooter />
    </div>
  );
}
