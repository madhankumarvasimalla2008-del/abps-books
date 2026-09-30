'use client';

import React from 'react';
import Link from 'next/link';
import { Plus, Boxes, ShoppingBag } from 'lucide-react';
import { useOrders } from '@/context/OrderContext';
import { useProducts } from '@/context/ProductContext';
import { useBranches } from '@/context/BranchContext';
import { useNotifications } from '@/context/NotificationContext';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { DashboardKpiGrid } from '@/components/admin/dashboard/DashboardKpiGrid';
import { OrderStatusOverview } from '@/components/admin/dashboard/OrderStatusOverview';
import { RecentOrders } from '@/components/admin/dashboard/RecentOrders';
import { InventoryOverview } from '@/components/admin/dashboard/InventoryOverview';
import { LowStockList } from '@/components/admin/dashboard/LowStockList';
import { RecentActivity } from '@/components/admin/dashboard/RecentActivity';
import { QuickActions } from '@/components/admin/dashboard/QuickActions';
import { buttonVariants } from '@/components/ui/Button';

export default function AdminDashboardPage() {
  const { orders } = useOrders();
  const { products } = useProducts();
  const { branches } = useBranches();
  const { notifications } = useNotifications();

  const lowStockCount = React.useMemo(() => {
    return products.filter(
      (p) =>
        p.status === 'low_stock' ||
        p.status === 'out_of_stock' ||
        p.stockQuantity <= p.lowStockThreshold
    ).length;
  }, [products]);

  return (
    <div className="space-y-6 pb-12">
      {/* Standard Admin Page Header with Demo Data Badge */}
      <AdminPageHeader
        title="Dashboard"
        description="Overview of orders, inventory, customers, and recent activity."
        badge={
          <span className="inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded-md bg-slate-100 text-slate-600 border border-slate-200/80">
            Demo data
          </span>
        }
        actions={
          <div className="flex items-center gap-2">
            <Link
              href="/admin/products"
              className={buttonVariants({
                variant: 'outline',
                size: 'sm',
                className: 'gap-1.5',
              })}
            >
              <Plus className="w-4 h-4" />
              <span>Add Product</span>
            </Link>
            <Link
              href="/admin/inventory"
              className={buttonVariants({
                variant: 'outline',
                size: 'sm',
                className: 'gap-1.5',
              })}
            >
              <Boxes className="w-4 h-4" />
              <span>Inventory</span>
            </Link>
            <Link
              href="/admin/orders"
              className={buttonVariants({
                variant: 'primary',
                size: 'sm',
                className: 'gap-1.5',
              })}
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Orders</span>
            </Link>
          </div>
        }
      />

      {/* KPI Cards (Total Orders, Branches, Products, Low Stock Items) */}
      <DashboardKpiGrid
        totalOrders={orders.length}
        totalBranches={branches.length}
        totalProducts={products.length}
        lowStockCount={lowStockCount}
      />

      {/* Quick Action Shortcuts */}
      <QuickActions />

      {/* Order Status Breakdown */}
      <OrderStatusOverview orders={orders} />

      {/* 2-Column Grid: Recent Orders (7 cols) + Inventory Overview & Alerts (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Recent Orders */}
        <div className="lg:col-span-7">
          <RecentOrders orders={orders} />
        </div>

        {/* Right Column: Inventory Overview & Low Stock List */}
        <div className="lg:col-span-5 space-y-6">
          <InventoryOverview products={products} />
          <LowStockList products={products} />
        </div>
      </div>

      {/* Recent Activity Stream */}
      <div>
        <RecentActivity notifications={notifications} />
      </div>
    </div>
  );
}
