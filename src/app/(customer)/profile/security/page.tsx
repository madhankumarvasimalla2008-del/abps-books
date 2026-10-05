'use client';

import React from 'react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { AccountNavigation } from '@/components/customer/profile/AccountNavigation';
import { SecurityNotice } from '@/components/customer/profile/SecurityNotice';
import { SecurityForm } from '@/components/customer/profile/SecurityForm';

export default function SecurityPage() {
  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-8">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: 'My Profile', href: '/profile' },
          { label: 'Security Settings' },
        ]}
      />

      {/* Page Header */}
      <div className="space-y-1">
        <h1 className="text-xl sm:text-2xl font-bold text-[#142C43] tracking-tight">
          Security Settings
        </h1>
        <p className="text-xs sm:text-sm text-[#526570]">
          Manage your account credentials, security preferences, and active sessions.
        </p>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (4 cols): Subnavigation */}
        <aside className="lg:col-span-4 space-y-4">
          <AccountNavigation />
        </aside>

        {/* Right Column (8 cols): Security Notice & Form */}
        <main className="lg:col-span-8 space-y-6">
          <SecurityNotice />
          <SecurityForm />
        </main>
      </div>
    </div>
  );
}
