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
      className="bg-white rounded-sm border border-[#DDDCD3]  p-2 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-1 gap-1"
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
            className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-sm min-h-[44px] text-xs font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#28657A] ${
              isActive
                ? 'bg-[#EDF2F1] text-[#28657A] font-bold border-l-2 border-[#28657A] '
                : 'text-[#526570] hover:text-[#142C43] hover:bg-[#FAF8F3]'
            }`}
            aria-current={isActive ? 'page' : undefined}
          >
            <Icon
              className={`w-4 h-4 shrink-0 ${
                isActive ? 'text-[#28657A]' : 'text-[#61717B]'
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
