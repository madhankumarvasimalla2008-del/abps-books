'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  BookOpen,
  FolderTree,
  Boxes,
  ArrowLeftRight,
  PackageCheck,
  ShoppingBag,
  Users,
  Building2,
  Truck,
  FileText,
  CreditCard,
  Receipt,
  RotateCcw,
  BarChart3,
  Bell,
  Settings,
  ShieldCheck,
  Server,
  History,
  Layers,
  X,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean | 'true' | 'false' }>;
  badge?: string;
  exact?: boolean;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    title: 'Overview',
    items: [
      { label: 'Dashboard', href: '/admin', icon: LayoutDashboard, exact: true },
    ],
  },
  {
    title: 'Catalog',
    items: [
      { label: 'Products', href: '/admin/products', icon: BookOpen },
      { label: 'Categories', href: '/admin/categories', icon: FolderTree },
    ],
  },
  {
    title: 'Inventory',
    items: [
      { label: 'Inventory', href: '/admin/inventory', icon: Boxes, exact: true },
      { label: 'Stock Movements', href: '/admin/inventory/movements', icon: ArrowLeftRight },
      { label: 'Bulk Stock Update', href: '/admin/inventory/bulk', icon: Layers },
    ],
  },
  {
    title: 'Sales',
    items: [
      { label: 'Orders', href: '/admin/orders', icon: ShoppingBag },
      { label: 'Customers', href: '/admin/customers', icon: Users },
    ],
  },
  {
    title: 'Operations',
    items: [
      { label: 'Branches', href: '/admin/branches', icon: Building2 },
      { label: 'Suppliers', href: '/admin/suppliers', icon: PackageCheck },
      { label: 'Purchase Orders', href: '/admin/purchase-orders', icon: FileText },
      { label: 'Shipments', href: '/admin/shipments', icon: Truck },
    ],
  },
  {
    title: 'Finance',
    items: [
      { label: 'Payments', href: '/admin/payments', icon: CreditCard },
      { label: 'Invoices', href: '/admin/invoices', icon: Receipt },
      { label: 'Refunds', href: '/admin/refunds', icon: RotateCcw },
    ],
  },
  {
    title: 'Insights',
    items: [
      { label: 'Reports', href: '/admin/reports', icon: BarChart3 },
      { label: 'Notifications', href: '/admin/notifications', icon: Bell },
    ],
  },
  {
    title: 'System',
    items: [
      { label: 'Settings', href: '/admin/settings', icon: Settings, exact: true },
      { label: 'Roles', href: '/admin/settings/roles', icon: ShieldCheck },
      { label: 'Audit Logs', href: '/admin/audit-logs', icon: History },
      { label: 'System', href: '/admin/settings/system', icon: Server },
    ],
  },
];

export const AdminSidebar: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const pathname = usePathname();
  const { user, role } = useAuth();

  // Dismiss on Escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  const isLinkActive = (item: NavItem) => {
    if (item.exact || item.href === '/admin') {
      return pathname === item.href;
    }
    return pathname === item.href || pathname.startsWith(item.href + '/');
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-xs lg:hidden transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* Sidebar container */}
      <aside
        id="admin-sidebar"
        aria-label="Admin Navigation"
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-slate-900 text-slate-300 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 border-r border-slate-800 ${
          isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 px-5 border-b border-slate-800 flex items-center justify-between shrink-0 bg-slate-950/40">
          <Link
            href="/admin"
            onClick={onClose}
            className="flex items-center gap-2.5 focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-lg outline-none"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold shadow-xs">
              <BookOpen className="w-4 h-4" aria-hidden="true" />
            </div>
            <div>
              <span className="font-bold text-sm text-white tracking-tight block">
                ABPS Books
              </span>
              <span className="text-[10px] text-emerald-400 font-semibold tracking-wide uppercase">
                Admin Portal
              </span>
            </div>
          </Link>

          {/* Close button on mobile */}
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 lg:hidden focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none"
            aria-label="Close navigation sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation links scrollable area */}
        <nav
          aria-label="Admin Sections"
          className="flex-1 overflow-y-auto px-3 py-4 space-y-5 scrollbar-thin focus-visible:outline-none"
        >
          {NAV_GROUPS.map((group, groupIdx) => (
            <div key={groupIdx} className="space-y-1">
              <h3 className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {group.title}
              </h3>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const active = isLinkActive(item);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onClose}
                      aria-current={active ? 'page' : undefined}
                      className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none ${
                        active
                          ? 'bg-emerald-700 text-white font-semibold shadow-xs'
                          : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Icon
                          className={`w-4 h-4 shrink-0 ${active ? 'text-white' : 'text-slate-400'}`}
                          aria-hidden={true}
                        />
                        <span className="truncate">{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className="px-1.5 py-0.5 text-[10px] rounded bg-slate-800 text-slate-300 font-semibold shrink-0">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User Card in Sidebar Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/60 shrink-0">
          <div className="flex items-center justify-between p-2 rounded-lg bg-slate-800/60 border border-slate-700/50">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-emerald-800 text-emerald-100 flex items-center justify-center font-bold text-xs shrink-0 border border-emerald-600/40">
                {user?.name ? user.name.charAt(0).toUpperCase() : (user?.email ? user.email.charAt(0).toUpperCase() : 'U')}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-white truncate">
                  {user?.name || user?.email?.split('@')[0] || 'User'}
                </p>
                <p className="text-[10px] text-emerald-400 capitalize truncate font-medium">
                  {role.replace('_', ' ')}
                </p>
              </div>
            </div>
            <Link
              href="/admin/settings"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-md focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none"
              title="Admin Settings"
              aria-label="Admin Settings"
            >
              <Settings className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </aside>
    </>
  );
};
