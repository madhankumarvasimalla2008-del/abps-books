import React from 'react';
import Link from 'next/link';
import { PlusCircle, ShoppingBag, Boxes, Users, ArrowUpRight } from 'lucide-react';

const ACTIONS = [
  {
    label: 'Add Product',
    description: 'Catalog new book title',
    icon: PlusCircle,
    href: '/admin/products',
    color: 'text-emerald-700',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200/80',
  },
  {
    label: 'View Orders',
    description: 'Fulfill customer orders',
    icon: ShoppingBag,
    href: '/admin/orders',
    color: 'text-blue-700',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200/80',
  },
  {
    label: 'View Inventory',
    description: 'Stock & batch adjustments',
    icon: Boxes,
    href: '/admin/inventory',
    color: 'text-purple-700',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200/80',
  },
  {
    label: 'View Customers',
    description: 'Customer accounts & branches',
    icon: Users,
    href: '/admin/customers',
    color: 'text-amber-700',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200/80',
  },
];

export const QuickActions: React.FC = () => {
  return (
    <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs space-y-4">
      <div>
        <h2 className="text-base font-bold text-slate-900">Quick Actions</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Frequently used management shortcuts
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {ACTIONS.map(({ label, description, icon: Icon, href, color, bgColor, borderColor }) => (
          <Link
            key={label}
            href={href}
            className={`group p-3.5 rounded-lg border ${borderColor} ${bgColor} hover:shadow-xs transition-all flex items-start justify-between`}
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Icon className={`w-4 h-4 ${color}`} />
                <span className="text-xs font-bold text-slate-900 group-hover:text-emerald-800 transition-colors">
                  {label}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 pl-6">{description}</p>
            </div>
            <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-700 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
          </Link>
        ))}
      </div>
    </div>
  );
};
