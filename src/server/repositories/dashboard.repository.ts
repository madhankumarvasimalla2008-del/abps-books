import { and, asc, desc, eq, inArray, isNull, lte, ne, or, sql } from 'drizzle-orm';
import { db } from '@/db';
import {
  orders,
  orderItems,
  products,
  inventory,
  branches,
  authUsers,
  notifications,
} from '@/db/schema';
import { AuthContext } from '../auth/types';

import {
  DashboardRecentOrder,
  DashboardLowStockItem,
  DashboardActivityItem,
  DashboardData,
} from '@/types/dashboard';

export type {
  DashboardRecentOrder,
  DashboardLowStockItem,
  DashboardActivityItem,
  DashboardData,
};

export class DashboardRepository {
  async getDashboardData(ctx: AuthContext): Promise<DashboardData> {
    // 1. Scoping conditions based on user role and branch
    const orderConditions = [isNull(orders.deletedAt)];
    const inventoryConditions: any[] = [];

    const isBranchScopedStaff =
      (ctx.role === 'branch_admin' || ctx.role === 'warehouse') && Boolean(ctx.branchId);

    if (isBranchScopedStaff && ctx.branchId) {
      orderConditions.push(eq(orders.branchId, ctx.branchId));
      inventoryConditions.push(eq(inventory.branchId, ctx.branchId));
    }

    const orderWhere = and(...orderConditions);

    // 2. Total orders count
    const [orderCountRes] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(orders)
      .where(orderWhere);
    const totalOrders = orderCountRes?.count || 0;

    // 3. Realized Revenue: sum(orders.totalAmount) strictly where paymentStatus = 'Paid' and status != 'Cancelled'
    const revenueWhere = and(
      ...orderConditions,
      eq(orders.paymentStatus, 'Paid'),
      ne(orders.status, 'Cancelled')
    );
    const [revenueRes] = await db
      .select({
        revenue: sql<string>`coalesce(sum(${orders.totalAmount}), 0)::text`,
      })
      .from(orders)
      .where(revenueWhere);
    const revenue = parseFloat(revenueRes?.revenue || '0') || 0;

    // 4. Catalog Titles: count of non-deleted products
    const [catalogCountRes] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(products)
      .where(isNull(products.deletedAt));
    const catalogTitles = catalogCountRes?.count || 0;

    // 5. Inventory Overview & Low Stock Count
    const [inventoryRowsCountRes] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(inventory)
      .where(inventoryConditions.length > 0 ? and(...inventoryConditions) : undefined);
    const totalInventoryRecords = inventoryRowsCountRes?.count || 0;

    let lowStockCount = 0;
    let inventoryOverview = {
      total: catalogTitles,
      inStock: 0,
      lowStock: 0,
      outOfStock: 0,
    };
    let lowStockItems: DashboardLowStockItem[] = [];

    if (totalInventoryRecords > 0) {
      // Inventory table is authoritative for tracked stock
      const inventoryWhere = inventoryConditions.length > 0 ? and(...inventoryConditions) : undefined;

      const [invBreakdown] = await db
        .select({
          total: sql<number>`count(*)::int`,
          inStock: sql<number>`count(*) filter (where ${inventory.quantityOnHand} > ${inventory.reorderThreshold})::int`,
          lowStock: sql<number>`count(*) filter (where ${inventory.quantityOnHand} > 0 and ${inventory.quantityOnHand} <= ${inventory.reorderThreshold})::int`,
          outOfStock: sql<number>`count(*) filter (where ${inventory.quantityOnHand} = 0)::int`,
          lowStockTotal: sql<number>`count(*) filter (where ${inventory.quantityOnHand} <= ${inventory.reorderThreshold})::int`,
        })
        .from(inventory)
        .where(inventoryWhere);

      lowStockCount = invBreakdown?.lowStockTotal || 0;
      inventoryOverview = {
        total: invBreakdown?.total || 0,
        inStock: invBreakdown?.inStock || 0,
        lowStock: invBreakdown?.lowStock || 0,
        outOfStock: invBreakdown?.outOfStock || 0,
      };

      // Fetch top 5 low stock alerts from inventory join
      const lowStockRows = await db
        .select({
          id: products.id,
          title: products.title,
          grade: products.grade,
          subject: products.subject,
          quantityOnHand: inventory.quantityOnHand,
          reorderThreshold: inventory.reorderThreshold,
          productStatus: products.status,
          branchName: branches.name,
          branchCode: branches.code,
        })
        .from(inventory)
        .innerJoin(products, eq(inventory.productId, products.id))
        .innerJoin(branches, eq(inventory.branchId, branches.id))
        .where(
          and(
            lte(inventory.quantityOnHand, inventory.reorderThreshold),
            ...(inventoryConditions)
          )
        )
        .orderBy(asc(inventory.quantityOnHand))
        .limit(5);

      lowStockItems = lowStockRows.map((row) => ({
        id: row.id,
        title: row.title,
        grade: row.grade,
        subject: row.subject,
        stockQuantity: row.quantityOnHand,
        lowStockThreshold: row.reorderThreshold,
        status: row.quantityOnHand === 0 ? 'out_of_stock' : 'low_stock',
        branchName: row.branchName,
        branchCode: row.branchCode,
      }));
    } else {
      // In staging/fresh environments without branch inventory records, derive safely from catalog products table
      const [prodBreakdown] = await db
        .select({
          total: sql<number>`count(*)::int`,
          inStock: sql<number>`count(*) filter (where ${products.status} = 'in_stock')::int`,
          lowStock: sql<number>`count(*) filter (where ${products.status} = 'low_stock')::int`,
          outOfStock: sql<number>`count(*) filter (where ${products.status} = 'out_of_stock')::int`,
        })
        .from(products)
        .where(isNull(products.deletedAt));

      const inStock = prodBreakdown?.inStock || 0;
      const lowStock = prodBreakdown?.lowStock || 0;
      const outOfStock = prodBreakdown?.outOfStock || 0;
      lowStockCount = lowStock + outOfStock;

      inventoryOverview = {
        total: prodBreakdown?.total || 0,
        inStock,
        lowStock,
        outOfStock,
      };

      const lowStockProductRows = await db
        .select({
          id: products.id,
          title: products.title,
          grade: products.grade,
          subject: products.subject,
          status: products.status,
        })
        .from(products)
        .where(
          and(
            isNull(products.deletedAt),
            or(
              eq(products.status, 'low_stock'),
              eq(products.status, 'out_of_stock')
            )
          )
        )
        .limit(5);

      lowStockItems = lowStockProductRows.map((row) => ({
        id: row.id,
        title: row.title,
        grade: row.grade,
        subject: row.subject,
        stockQuantity: 0,
        lowStockThreshold: 10,
        status: row.status,
      }));
    }

    // 6. Order Status Breakdown
    const statusRows = await db
      .select({
        status: orders.status,
        count: sql<number>`count(*)::int`,
      })
      .from(orders)
      .where(orderWhere)
      .groupBy(orders.status);

    const orderStatusCounts: DashboardData['orderStatusCounts'] = {
      Pending: 0,
      Confirmed: 0,
      Processing: 0,
      Shipped: 0,
      Delivered: 0,
      Cancelled: 0,
    };

    for (const row of statusRows) {
      if (row.status) {
        orderStatusCounts[row.status] = (orderStatusCounts[row.status] || 0) + row.count;
      }
    }

    // 7. Recent Orders (Top 5)
    const recentOrderRows = await db
      .select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        userId: orders.userId,
        customerName: authUsers.fullName,
        customerEmail: authUsers.email,
        branchId: orders.branchId,
        branchName: branches.name,
        branchCode: branches.code,
        status: orders.status,
        paymentStatus: orders.paymentStatus,
        totalAmount: orders.totalAmount,
        createdAt: orders.createdAt,
      })
      .from(orders)
      .innerJoin(authUsers, eq(orders.userId, authUsers.id))
      .innerJoin(branches, eq(orders.branchId, branches.id))
      .where(orderWhere)
      .orderBy(desc(orders.createdAt))
      .limit(5);

    const orderIds = recentOrderRows.map((o) => o.id);
    const itemCopiesMap: Record<string, number> = {};

    if (orderIds.length > 0) {
      const itemCounts = await db
        .select({
          orderId: orderItems.orderId,
          totalCopies: sql<number>`coalesce(sum(${orderItems.quantity}), 0)::int`,
        })
        .from(orderItems)
        .where(inArray(orderItems.orderId, orderIds))
        .groupBy(orderItems.orderId);

      for (const ic of itemCounts) {
        itemCopiesMap[ic.orderId] = ic.totalCopies;
      }
    }

    const recentOrders: DashboardRecentOrder[] = recentOrderRows.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      customerName: o.customerName || 'Customer',
      customerEmail: o.customerEmail || '',
      branchName: o.branchName || null,
      branchCode: o.branchCode || null,
      totalCopies: itemCopiesMap[o.id] || 0,
      totalAmount: parseFloat(o.totalAmount || '0') || 0,
      status: o.status,
      paymentStatus: o.paymentStatus,
      createdAt: o.createdAt,
    }));

    // 8. Recent Operations Activity / Notifications (Top 5)
    const notifConditions = [];
    if (ctx.role === 'customer') {
      notifConditions.push(eq(notifications.userId, ctx.userId));
    } else {
      notifConditions.push(
        or(
          eq(notifications.userId, ctx.userId),
          eq(notifications.type, 'system'),
          eq(notifications.type, 'order'),
          eq(notifications.type, 'inventory')
        )
      );
    }

    const recentNotifs = await db
      .select({
        id: notifications.id,
        title: notifications.title,
        message: notifications.message,
        type: notifications.type,
        severity: notifications.severity,
        actionUrl: notifications.actionUrl,
        isRead: notifications.isRead,
        createdAt: notifications.createdAt,
      })
      .from(notifications)
      .where(and(...notifConditions))
      .orderBy(desc(notifications.createdAt))
      .limit(5);

    const recentActivity: DashboardActivityItem[] = recentNotifs.map((n) => ({
      id: n.id,
      title: n.title,
      message: n.message,
      type: n.type,
      severity: n.severity,
      actionUrl: n.actionUrl || null,
      createdAt: n.createdAt,
      isRead: n.isRead,
    }));

    return {
      kpis: {
        revenue,
        totalOrders,
        catalogTitles,
        lowStockCount,
      },
      orderStatusCounts,
      inventoryOverview,
      recentOrders,
      lowStockItems,
      recentActivity,
    };
  }
}

export const dashboardRepository = new DashboardRepository();
