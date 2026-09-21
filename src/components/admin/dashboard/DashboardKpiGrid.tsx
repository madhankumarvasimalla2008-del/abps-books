import React from 'react';
import { ShoppingBag, Building2, BookOpen, AlertTriangle } from 'lucide-react';
import { DashboardKpiCard } from './DashboardKpiCard';

export interface DashboardKpiGridProps {
  totalOrders: number;
  totalBranches: number;
  totalProducts: number;
  lowStockCount: number;
}

export const DashboardKpiGrid: React.FC<DashboardKpiGridProps> = ({
  totalOrders,
  totalBranches,
  totalProducts,
  lowStockCount,
}) => {
  return (
    <section aria-label="Key Performance Indicators" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <DashboardKpiCard
        label="Total Orders"
        value={totalOrders}
        description="Recorded in demo session"
        icon={ShoppingBag}
        href="/admin/orders"
      />
      <DashboardKpiCard
        label="Branches"
        value={totalBranches}
        description="Configured branch records"
        icon={Building2}
        href="/admin/branches"
      />
      <DashboardKpiCard
        label="Products"
        value={totalProducts}
        description="Titles in catalog"
        icon={BookOpen}
        href="/admin/products"
      />
      <DashboardKpiCard
        label="Low Stock Items"
        value={lowStockCount}
        description={lowStockCount > 0 ? "Requires reorder attention" : "All stock within normal limits"}
        icon={AlertTriangle}
        href="/admin/inventory"
        badge={lowStockCount > 0 ? `${lowStockCount} items` : undefined}
      />
    </section>
  );
};
