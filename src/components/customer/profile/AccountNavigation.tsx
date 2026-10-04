'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { User, MapPin, ShieldCheck, Package, Truck } from 'lucide-react';

export const AccountNavigation: React.FC = () => {
  const pathname = usePathname();

  const navItems = [
    {
      href: '/profile',
      label: 'My Profile',
      icon: User,
      exact: true,
    },
    {
      href: '/profile/addresses',
      label: 'Saved Addresses',
      icon: MapPin,
      exact: false,
    },
    {
      href: '/profile/security',
      label: 'Security Settings',
      icon: ShieldCheck,
      exact: false,
    },
    {
      href: '/orders',
      label: 'Order History',
      icon: Package,
      exact: false,
    },
    {
      href: '/tracking',
      label: 'Track Order',
      icon: Truck,
      exact: false,
    },
  ];

  return (
    <nav
      aria-label="Account Subnavigation"
      className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-2 flex flex-row lg:flex-col gap-1 overflow-x-auto"
    >
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = item.exact
          ? pathname === item.href
          : pathname === item.href || (item.href !== '/' && pathname.startsWith(`${item.href}/`));

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#023859] ${
              isActive
                ? 'bg-[#EBF7FA] text-[#023859] font-bold shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
            aria-current={isActive ? 'page' : undefined}
          >
            <Icon
              className={`w-4 h-4 shrink-0 ${
                isActive ? 'text-[#023859]' : 'text-[#537D99]'
              }`}
              aria-hidden="true"
            />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
};
