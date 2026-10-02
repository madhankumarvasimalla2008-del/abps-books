import React from 'react';
import { ShoppingBag, BookOpen, AlertTriangle, IndianRupee } from 'lucide-react';
import { DashboardKpiCard } from './DashboardKpiCard';

export interface DashboardKpiGridProps {
  revenue: number;
  totalOrders: number;
  catalogTitles: number;
  lowStockCount: number;
  isLoading?: boolean;
}

export const DashboardKpiGrid: React.FC<DashboardKpiGridProps> = ({
  revenue,
  totalOrders,
  catalogTitles,
  lowStockCount,
  isLoading,
}) => {
  const formattedRevenue = `₹${revenue.toLocaleString('en-IN')}`;

  return (
    <section aria-label="Key Performance Indicators" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <DashboardKpiCard
        label="Revenue"
        value={formattedRevenue}
        description="Realized paid order revenue"
        icon={IndianRupee}
        href="/admin/orders"
        isLoading={isLoading}
        badge={revenue > 0 ? 'Realized' : undefined}
      />
      <DashboardKpiCard
        label="Total Orders"
        value={totalOrders.toLocaleString('en-IN')}
        description={totalOrders === 1 ? '1 recorded order' : `${totalOrders} recorded orders`}
        icon={ShoppingBag}
        href="/admin/orders"
        isLoading={isLoading}
      />
      <DashboardKpiCard
        label="Catalog Titles"
        value={catalogTitles.toLocaleString('en-IN')}
        description="Active titles in catalog"
        icon={BookOpen}
        href="/admin/products"
        isLoading={isLoading}
      />
      <DashboardKpiCard
        label="Low Stock"
        value={lowStockCount.toLocaleString('en-IN')}
        description={lowStockCount > 0 ? 'Requires replenishment attention' : 'All stock within normal limits'}
        icon={AlertTriangle}
        href="/admin/inventory"
        isLoading={isLoading}
        badge={lowStockCount > 0 ? `${lowStockCount} items` : undefined}
      />
    </section>
  );
};
