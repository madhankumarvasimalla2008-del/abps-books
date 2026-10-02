'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Plus, Boxes, ShoppingBag, AlertCircle, RefreshCw } from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { DashboardKpiGrid } from '@/components/admin/dashboard/DashboardKpiGrid';
import { OrderStatusOverview } from '@/components/admin/dashboard/OrderStatusOverview';
import { RecentOrders } from '@/components/admin/dashboard/RecentOrders';
import { InventoryOverview } from '@/components/admin/dashboard/InventoryOverview';
import { LowStockList } from '@/components/admin/dashboard/LowStockList';
import { RecentActivity } from '@/components/admin/dashboard/RecentActivity';
import { QuickActions } from '@/components/admin/dashboard/QuickActions';
import { Button, buttonVariants } from '@/components/ui/Button';
import { DashboardData } from '@/types/dashboard';
import { NotificationItem } from '@/types';

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/dashboard');
      if (!res.ok) {
        const errorJson = await res.json().catch(() => null);
        throw new Error(
          errorJson?.error?.message ||
          errorJson?.message ||
          `Failed to load dashboard data (status ${res.status})`
        );
      }
      const json = await res.json();
      const dashboardData: DashboardData = json?.data || json;
      setData(dashboardData);
    } catch (err: any) {
      console.error('Error fetching admin dashboard operational data:', err);
      setError(err?.message || 'Failed to load dashboard operations data');
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  // Map server activity to NotificationItem format for RecentActivity
  const activityItems: NotificationItem[] = React.useMemo(() => {
    if (!data?.recentActivity) return [];
    return data.recentActivity.map((a) => ({
      id: a.id,
      title: a.title,
      message: a.message,
      type: a.type,
      severity: a.severity,
      timestamp: a.createdAt,
      isRead: a.isRead,
      linkUrl: a.actionUrl || undefined,
    }));
  }, [data?.recentActivity]);

  return (
    <div className="space-y-6 pb-12">
      {/* Standard Admin Page Header with Live Operations Badge */}
      <AdminPageHeader
        title="Dashboard"
        description="Authoritative overview of orders, inventory, catalog, and operations activity."
        badge={
          <span className="inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200/80">
            Live Operations
          </span>
        }
        actions={
          <div className="flex items-center gap-2">
            <Link
              href="/admin/products/new"
              className={buttonVariants({
                variant: 'outline',
                size: 'sm',
                className: 'gap-1.5',
              })}
            >
              <Plus className="w-4 h-4" />
              <span>Add Book</span>
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

      {/* Production API Error State Banner */}
      {error && (
        <div
          role="alert"
          className="bg-rose-50 border border-rose-200/90 text-rose-900 p-4 sm:p-5 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-2xs"
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-rose-900">
                Failed to load operational dashboard data
              </p>
              <p className="text-xs text-rose-700 mt-0.5">
                {error}. Please check your connection or session credentials.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={fetchDashboard}
            disabled={isLoading}
            className="gap-1.5 shrink-0 bg-white border-rose-200 hover:bg-rose-100/50 text-rose-800"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Retry</span>
          </Button>
        </div>
      )}

      {/* KPI Cards (Revenue, Total Orders, Catalog Titles, Low Stock) */}
      <DashboardKpiGrid
        revenue={data?.kpis.revenue ?? 0}
        totalOrders={data?.kpis.totalOrders ?? 0}
        catalogTitles={data?.kpis.catalogTitles ?? 0}
        lowStockCount={data?.kpis.lowStockCount ?? 0}
        isLoading={isLoading}
      />

      {/* Quick Action Shortcuts */}
      <QuickActions />

      {/* Order Status Breakdown */}
      <OrderStatusOverview
        statusCounts={data?.orderStatusCounts}
        totalOrdersCount={data?.kpis.totalOrders ?? 0}
      />

      {/* 2-Column Grid: Recent Orders (7 cols) + Inventory Overview & Alerts (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Recent Orders */}
        <div className="lg:col-span-7">
          <RecentOrders
            orders={data?.recentOrders ?? []}
            totalOrdersCount={data?.kpis.totalOrders ?? 0}
          />
        </div>

        {/* Right Column: Inventory Overview & Low Stock List */}
        <div className="lg:col-span-5 space-y-6">
          <InventoryOverview stats={data?.inventoryOverview} />
          <LowStockList items={data?.lowStockItems ?? []} />
        </div>
      </div>

      {/* Recent Activity Stream */}
      <div>
        <RecentActivity notifications={activityItems} />
      </div>
    </div>
  );
}
