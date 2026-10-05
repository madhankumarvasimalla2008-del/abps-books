'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { CustomerHeader } from '@/components/customer/CustomerHeader';
import { CustomerFooter } from '@/components/customer/CustomerFooter';
import './storefront.css';

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isHome = pathname === '/';

  return (
    <div className="storefront min-h-screen flex flex-col w-full">
      <a href="#main-content" className="skip-to-content">
        Skip to main content
      </a>
      <CustomerHeader />
      <main
        id="main-content"
        tabIndex={-1}
        className={
          isHome
            ? 'flex-1 w-full min-w-0 focus:outline-none'
            : 'store-container store-page flex-1 min-w-0 focus:outline-none'
        }
      >
        {children}
      </main>
      <CustomerFooter />
    </div>
  );
}
