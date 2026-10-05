'use client';

import React, { use } from 'react';
import Link from 'next/link';
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  Package,
  BookOpen,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { MOCK_BRANCHES, MOCK_PRODUCTS, MOCK_ORDERS } from '@/data/mockData';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Badge } from '@/components/ui/Badge';
import { Button, buttonVariants } from '@/components/ui/Button';
import { BookCard } from '@/components/customer/BookCard';

export default function BranchDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const branch = MOCK_BRANCHES.find((b) => b.id === resolvedParams.id) || MOCK_BRANCHES[0];

  const branchOrders = MOCK_ORDERS.filter(
    (o) => o.branchId === branch.id || o.branchName.includes(branch.city)
  );

  const recommendedBooks = MOCK_PRODUCTS.slice(0, 4);

  return (
    <div className="space-y-8">
      <Breadcrumbs
        items={[
          { label: 'Branches Directory', href: '/branches' },
          { label: branch.name },
        ]}
      />

      {/* Main Branch Banner */}
      <div className="bg-white p-6 sm:p-8 rounded-sm border border-[#DDDCD3]  space-y-6">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="success" size="sm">
                Active Branch
              </Badge>
              <Badge variant="neutral" size="sm" className="font-mono">
                Code: {branch.code}
              </Badge>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-[#142C43] leading-tight">
              {branch.name}
            </h1>

            <p className="text-xs sm:text-sm text-[#526570] flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-[#28657A] shrink-0" />
              <span>
                {branch.address}, {branch.city}, {branch.state} - {branch.pincode}
              </span>
            </p>
          </div>

          <Link
            href="/books"
            className={buttonVariants({
              variant: 'primary',
              size: 'md',
              className: 'inline-flex items-center gap-2',
            })}
          >
            <span>Order Textbooks for Branch</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Location & Contact Information */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-[#DDDCD3]/60 text-xs">
          <div className="bg-[#FAF8F3] p-3.5 rounded-sm">
            <span className="text-slate-400 block text-[11px]">City & State</span>
            <span className="text-sm font-bold text-[#142C43] truncate block mt-1">
              {branch.city}, {branch.state}
            </span>
          </div>

          <div className="bg-[#FAF8F3] p-3.5 rounded-sm">
            <span className="text-slate-400 block text-[11px]">Postal PIN Code</span>
            <span className="text-sm font-bold font-mono text-[#142C43] truncate block mt-1">
              {branch.pincode}
            </span>
          </div>

          <div className="bg-[#FAF8F3] p-3.5 rounded-sm">
            <span className="text-slate-400 block text-[11px]">Contact Phone</span>
            <span className="text-xs font-semibold text-[#142C43] truncate block mt-1">
              {branch.phone}
            </span>
          </div>

          <div className="bg-[#FAF8F3] p-3.5 rounded-sm">
            <span className="text-slate-400 block text-[11px]">Official Email</span>
            <span className="text-xs font-semibold text-[#142C43] truncate block mt-1">
              {branch.email}
            </span>
          </div>
        </div>
      </div>

      {/* Recommended Titles for this Branch */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-[#142C43]">
              Prescribed Course Materials & Book Packs
            </h2>
            <p className="text-xs text-[#61717B]">
              Course titles available for textbook distribution to {branch.name}
            </p>
          </div>
          <Link
            href="/books"
            className={buttonVariants({
              variant: 'ghost',
              size: 'sm',
              className: 'inline-flex items-center gap-1.5',
            })}
          >
            <span>View All Books</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {recommendedBooks.map((product) => (
            <BookCard key={product.id} product={product} />
          ))}
        </div>
      </div>

      {/* Recent Orders for this Branch */}
      {branchOrders.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-[#142C43]">
            Recent Orders for this Branch
          </h2>
          <div className="bg-white rounded-sm border border-[#DDDCD3]  divide-y divide-slate-100 overflow-hidden text-xs">
            {branchOrders.map((order) => (
              <div
                key={order.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#FAF8F3]/50"
              >
                <div>
                  <span className="font-mono font-bold text-[#142C43]">{order.orderNumber || order.id}</span>
                  <span className="text-slate-400 ml-2">Placed: {order.createdAt}</span>
                  <p className="text-[#526570] text-[11px] mt-0.5">
                    {order.items.length} titles • ₹{order.totalAmount.toLocaleString('en-IN')}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    href={`/orders/${order.id}`}
                    className={buttonVariants({ variant: 'outline', size: 'sm' })}
                  >
                    View Order
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
