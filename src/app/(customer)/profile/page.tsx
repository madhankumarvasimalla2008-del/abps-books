'use client';

import React from 'react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { AccountNavigation } from '@/components/customer/profile/AccountNavigation';
import { ProfileSummary } from '@/components/customer/profile/ProfileSummary';
import { useCustomer } from '@/context/CustomerContext';

export default function ProfilePage() {
  const { profile } = useCustomer();

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-8">
      {/* Breadcrumb Navigation */}
      <Breadcrumbs items={[{ label: 'My Profile' }]} />

      {/* Page Header */}
      <div className="space-y-1">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          My Profile
        </h1>
        <p className="text-xs sm:text-sm text-slate-600">
          Manage your personal information, delivery addresses, and account preferences.
        </p>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (4 cols): Subnavigation */}
        <aside className="lg:col-span-4 space-y-4">
          <AccountNavigation />
        </aside>

        {/* Right Column (8 cols): Profile Summary & Metrics */}
        <main className="lg:col-span-8">
          <ProfileSummary />
        </main>
      </div>
    </div>
  );
}
