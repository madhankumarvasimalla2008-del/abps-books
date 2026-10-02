import './setup';
import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { NextRequest } from 'next/server';
import { GET as getDashboard } from '../src/app/api/admin/dashboard/route';
import { dashboardService } from '../src/server/services/dashboard.service';
import { dashboardRepository } from '../src/server/repositories/dashboard.repository';
import { requireRole } from '../src/server/auth/guard';
import { ForbiddenError } from '../src/server/errors';
import { AuthContext } from '../src/server/auth/types';
import { DashboardData } from '../src/types/dashboard';

describe('Phase 8: Admin Dashboard Production Data Migration & Authorization', () => {
  const originalEnv = process.env.NODE_ENV;
  let originalGetDashboardData: typeof dashboardRepository.getDashboardData;

  beforeEach(() => {
    originalGetDashboardData = dashboardRepository.getDashboardData;
  });

  afterEach(() => {
    (process.env as Record<string, string | undefined>).NODE_ENV = originalEnv;
    dashboardRepository.getDashboardData = originalGetDashboardData;
  });

  const mockDashboardData: DashboardData = {
    kpis: {
      revenue: 125000,
      totalOrders: 42,
      catalogTitles: 150,
      lowStockCount: 3,
    },
    orderStatusCounts: {
      Pending: 5,
      Confirmed: 10,
      Processing: 8,
      Shipped: 12,
      Delivered: 6,
      Cancelled: 1,
    },
    inventoryOverview: {
      total: 150,
      inStock: 140,
      lowStock: 7,
      outOfStock: 3,
    },
    recentOrders: [
      {
        id: 'ord-001',
        orderNumber: 'ABPS-ORD-2026-0001',
        createdAt: '2026-10-01T10:00:00.000Z',
        customerName: 'Priya Sharma',
        customerEmail: 'priya@abps.edu',
        branchName: 'Aditya Birla Public School, Kharach',
        branchCode: 'ABPS-KHL',
        totalCopies: 25,
        totalAmount: 12500,
        status: 'Delivered',
        paymentStatus: 'Paid',
      },
    ],
    lowStockItems: [
      {
        id: 'prod-001',
        title: 'NCERT Mathematics Class 10',
        grade: 'Class 10',
        subject: 'Mathematics',
        stockQuantity: 2,
        lowStockThreshold: 10,
        status: 'low_stock',
        branchName: 'Kharach Main Store',
      },
    ],
    recentActivity: [
      {
        id: 'notif-001',
        title: 'Inventory Alert',
        message: 'NCERT Mathematics Class 10 is low on stock',
        type: 'inventory',
        severity: 'warning',
        actionUrl: '/admin/inventory',
        createdAt: '2026-10-01T12:00:00.000Z',
        isRead: false,
      },
    ],
  };

  // --------------------------------------------------------------------------
  // 1. Unauthenticated Request -> 401 Unauthorized
  // --------------------------------------------------------------------------
  it('1. Rejects unauthenticated request to /api/admin/dashboard with 401 Unauthorized', async () => {
    (process.env as Record<string, string | undefined>).NODE_ENV = 'production';

    const req = new NextRequest('https://abpsbooks.example.com/api/admin/dashboard');
    const res = await getDashboard(req);
    assert.strictEqual(res.status, 401, 'Unauthenticated request must return 401');

    const body = await res.json();
    assert.strictEqual(body.success, false);
    assert.match(body.error.message, /authentication required/i);
  });

  // --------------------------------------------------------------------------
  // 2. Spoofed Role Headers in Production -> 401 Unauthorized
  // --------------------------------------------------------------------------
  it('2. Production security: ignores spoofed dev headers and denies dashboard access', async () => {
    (process.env as Record<string, string | undefined>).NODE_ENV = 'production';

    const spoofedReq = new NextRequest('https://abpsbooks.example.com/api/admin/dashboard', {
      headers: {
        'x-user-id': 'fake-admin-id',
        'x-user-role': 'admin',
        'x-user-email': 'attacker@example.com',
      },
    });

    const res = await getDashboard(spoofedReq);
    assert.strictEqual(res.status, 401, 'Spoofed headers in production must return 401');
  });

  // --------------------------------------------------------------------------
  // 3. Customer Role -> 403 Forbidden
  // --------------------------------------------------------------------------
  it('3. Rejects authenticated customer role with 403 Forbidden', async () => {
    const customerCtx: AuthContext = {
      userId: '11111111-1111-1111-1111-111111111111',
      email: 'customer@example.com',
      fullName: 'Regular Customer',
      role: 'customer',
      branchId: 'branch-1',
      isStaff: false,
    };

    assert.throws(
      () => requireRole(customerCtx, ['admin', 'branch_admin', 'warehouse', 'sales']),
      ForbiddenError,
      'Customer role must be rejected by requireRole for admin dashboard'
    );

    await assert.rejects(
      async () => await dashboardService.getAdminDashboardData(customerCtx),
      ForbiddenError,
      'dashboardService must throw ForbiddenError for customer role'
    );
  });

  // --------------------------------------------------------------------------
  // 4. Staff Roles Authorized
  // --------------------------------------------------------------------------
  it('4. Permits staff roles (admin, branch_admin, warehouse, sales) to access dashboard', () => {
    const roles: AuthContext['role'][] = ['admin', 'branch_admin', 'warehouse', 'sales'];

    for (const role of roles) {
      const ctx: AuthContext = {
        userId: '22222222-2222-2222-2222-222222222222',
        email: `${role}@example.com`,
        fullName: `${role} User`,
        role,
        branchId: role === 'admin' ? null : 'branch-1',
        isStaff: true,
      };

      assert.doesNotThrow(
        () => requireRole(ctx, ['admin', 'branch_admin', 'warehouse', 'sales']),
        `Role '${role}' should be permitted to access admin dashboard`
      );
    }
  });

  // --------------------------------------------------------------------------
  // 5. Dashboard Data Contract & Revenue Calculation Rule
  // --------------------------------------------------------------------------
  it('5. Returns authoritative dashboard metrics adhering to DashboardData contract', async () => {
    let capturedCtx: AuthContext | null = null;
    dashboardRepository.getDashboardData = async (ctx: AuthContext) => {
      capturedCtx = ctx;
      return mockDashboardData;
    };

    const adminCtx: AuthContext = {
      userId: '9cdba9f9-1fc3-4ad4-8488-a93c799650ce',
      email: 'admin@birlabooks.in',
      fullName: 'Madhankumar Vasimalla',
      role: 'admin',
      branchId: null,
      isStaff: true,
    };

    const data = await dashboardService.getAdminDashboardData(adminCtx);

    assert.strictEqual(capturedCtx, adminCtx);
    assert.strictEqual(data.kpis.revenue, 125000);
    assert.strictEqual(data.kpis.totalOrders, 42);
    assert.strictEqual(data.kpis.catalogTitles, 150);
    assert.strictEqual(data.kpis.lowStockCount, 3);
    assert.strictEqual(data.orderStatusCounts.Pending, 5);
    assert.strictEqual(data.orderStatusCounts.Delivered, 6);
    assert.strictEqual(data.inventoryOverview.inStock, 140);
    assert.strictEqual(data.recentOrders.length, 1);
    assert.strictEqual(data.lowStockItems.length, 1);
    assert.strictEqual(data.recentActivity.length, 1);
  });

  // --------------------------------------------------------------------------
  // 6. Tenant / Branch Scoping
  // --------------------------------------------------------------------------
  it('6. Passes branchId to repository for branch-restricted staff roles', async () => {
    let capturedBranchId: string | null | undefined = undefined;
    dashboardRepository.getDashboardData = async (ctx: AuthContext) => {
      capturedBranchId = ctx.branchId;
      return {
        ...mockDashboardData,
        kpis: {
          ...mockDashboardData.kpis,
          revenue: 45000,
          totalOrders: 15,
        },
      };
    };

    const branchCtx: AuthContext = {
      userId: '33333333-3333-3333-3333-333333333333',
      email: 'branch.staff@abps.edu',
      fullName: 'Branch Staff',
      role: 'branch_admin',
      branchId: 'branch-uuid-42',
      isStaff: true,
    };

    const result = await dashboardService.getAdminDashboardData(branchCtx);
    assert.strictEqual(capturedBranchId, 'branch-uuid-42', 'Branch staff context must retain branchId');
    assert.strictEqual(result.kpis.revenue, 45000);
    assert.strictEqual(result.kpis.totalOrders, 15);
  });

  // --------------------------------------------------------------------------
  // 7. Successful Route Execution with Dev Session (Non-Production)
  // --------------------------------------------------------------------------
  it('7. /api/admin/dashboard route returns successResponse when authenticated staff requests', async () => {
    dashboardRepository.getDashboardData = async () => mockDashboardData;

    const devReq = new NextRequest('https://abpsbooks.example.com/api/admin/dashboard', {
      headers: {
        'x-user-id': 'dev-admin-id',
        'x-user-role': 'admin',
        'x-user-email': 'admin@birlabooks.in',
      },
    });

    const res = await getDashboard(devReq);
    assert.strictEqual(res.status, 200);

    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.kpis.revenue, 125000);
    assert.strictEqual(body.data.kpis.totalOrders, 42);
    assert.strictEqual(body.data.orderStatusCounts.Confirmed, 10);
  });
});
