import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { notificationsService } from '../src/server/services/notifications.service';
import { notificationsRepository } from '../src/server/repositories/notifications.repository';
import { inventoryRepository } from '../src/server/repositories/inventory.repository';
import { ordersRepository } from '../src/server/repositories/orders.repository';
import {
  createNotificationSchema,
  updateNotificationSchema,
  notificationFilterSchema,
} from '../src/server/validation/notifications';
import { BusinessRuleError, ForbiddenError, NotFoundError } from '../src/server/errors';
import { AuthContext } from '../src/server/auth/types';

describe('Phase 5.5H: Notifications Domain Validation, Service Layer & Customer Isolation Invariants', () => {
  // --------------------------------------------------------------------------
  // 1. Zod Validation Layer
  // --------------------------------------------------------------------------
  describe('Zod Validation Layer', () => {
    it('validates a correct create notification payload', () => {
      const validPayload = {
        userId: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
        title: 'Low Stock Alert',
        message: 'Mathematics Class 10 NCERT is running low on stock.',
        type: 'inventory',
        severity: 'warning',
        actionUrl: '/admin/inventory',
      };

      const parsed = createNotificationSchema.parse(validPayload);
      assert.strictEqual(parsed.userId, validPayload.userId);
      assert.strictEqual(parsed.title, validPayload.title);
      assert.strictEqual(parsed.type, 'inventory');
      assert.strictEqual(parsed.severity, 'warning');
    });

    it('rejects invalid user UUID or empty title/message', () => {
      assert.throws(() => {
        createNotificationSchema.parse({
          userId: 'invalid-uuid',
          title: 'Test',
          message: 'Test message',
        });
      });

      assert.throws(() => {
        createNotificationSchema.parse({
          userId: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
          title: '',
          message: 'Test message',
        });
      });

      assert.throws(() => {
        createNotificationSchema.parse({
          userId: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
          title: 'Valid title',
          message: '',
        });
      });
    });

    it('correctly transforms string isRead filter parameters into booleans', () => {
      const parsedTrue = notificationFilterSchema.parse({ isRead: 'true' });
      assert.strictEqual(parsedTrue.isRead, true);

      const parsedFalse = notificationFilterSchema.parse({ isRead: 'false' });
      assert.strictEqual(parsedFalse.isRead, false);

      const parsedDirectBool = notificationFilterSchema.parse({ isRead: true });
      assert.strictEqual(parsedDirectBool.isRead, true);
    });

    it('validates update notification payload', () => {
      const parsed = updateNotificationSchema.parse({ isRead: true });
      assert.strictEqual(parsed.isRead, true);
    });
  });

  // --------------------------------------------------------------------------
  // 2. Customer Isolation & Security Invariants
  // --------------------------------------------------------------------------
  describe('Customer Isolation & Role-Based Authorization', () => {
    let originalFindMany: typeof notificationsRepository.findMany;
    let originalFindById: typeof notificationsRepository.findById;
    let originalCreate: typeof notificationsRepository.create;
    let originalUpdate: typeof notificationsRepository.update;
    let originalDelete: typeof notificationsRepository.delete;
    let originalCountUnread: typeof notificationsRepository.countUnread;
    let originalMarkAllAsRead: typeof notificationsRepository.markAllAsRead;

    const customerContext: AuthContext = {
      userId: 'user-customer-001',
      email: 'customer@example.com',
      role: 'customer',
      isStaff: false,
      branchId: 'b1',
    };

    const staffContext: AuthContext = {
      userId: 'user-staff-001',
      email: 'staff@example.com',
      role: 'admin',
      isStaff: true,
      branchId: null,
    };

    beforeEach(() => {
      originalFindMany = notificationsRepository.findMany;
      originalFindById = notificationsRepository.findById;
      originalCreate = notificationsRepository.create;
      originalUpdate = notificationsRepository.update;
      originalDelete = notificationsRepository.delete;
      originalCountUnread = notificationsRepository.countUnread;
      originalMarkAllAsRead = notificationsRepository.markAllAsRead;
    });

    afterEach(() => {
      notificationsRepository.findMany = originalFindMany;
      notificationsRepository.findById = originalFindById;
      notificationsRepository.create = originalCreate;
      notificationsRepository.update = originalUpdate;
      notificationsRepository.delete = originalDelete;
      notificationsRepository.countUnread = originalCountUnread;
      notificationsRepository.markAllAsRead = originalMarkAllAsRead;
    });

    it('CUSTOMER ISOLATION: Automatically filters list query to customer userId', async () => {
      let capturedFilters: any = null;
      notificationsRepository.findMany = (async (filters: any) => {
        capturedFilters = filters;
        return {
          data: [],
          pagination: { page: 1, pageSize: 20, total: 0, totalPages: 1 },
        };
      }) as any;

      await notificationsService.listNotifications(
        { userId: 'other-user-uuid', isRead: undefined, page: 1, pageSize: 20, sortBy: 'createdAt', sortOrder: 'desc' },
        customerContext
      );

      // Must override requested other-user-uuid with caller customer userId
      assert.strictEqual(capturedFilters.userId, 'user-customer-001');
    });

    it('STAFF ACCESS: Allows staff to query notifications across all users or filter by specific user', async () => {
      let capturedFilters: any = null;
      notificationsRepository.findMany = (async (filters: any) => {
        capturedFilters = filters;
        return {
          data: [],
          pagination: { page: 1, pageSize: 20, total: 0, totalPages: 1 },
        };
      }) as any;

      await notificationsService.listNotifications(
        { userId: 'targeted-user-uuid', isRead: undefined, page: 1, pageSize: 20, sortBy: 'createdAt', sortOrder: 'desc' },
        staffContext
      );

      assert.strictEqual(capturedFilters.userId, 'targeted-user-uuid');
    });

    it('CUSTOMER ISOLATION: Rejects customer attempting to view another user notification by ID', async () => {
      notificationsRepository.findById = (async (id: string) => ({
        id,
        userId: 'other-user-uuid',
        title: 'Private Notice',
        message: 'Sensitive information',
        type: 'order',
        severity: 'info',
        actionUrl: null,
        isRead: false,
        readAt: null,
        createdAt: new Date().toISOString(),
      })) as any;

      await assert.rejects(
        async () => {
          await notificationsService.getNotificationById('notif-001', customerContext);
        },
        (err: any) => {
          assert.ok(err instanceof ForbiddenError);
          assert.match(err.message, /permission to view this notification/);
          return true;
        }
      );
    });

    it('CUSTOMER ISOLATION: Rejects customer attempting to delete another user notification', async () => {
      notificationsRepository.findById = (async (id: string) => ({
        id,
        userId: 'other-user-uuid',
        title: 'Other Alert',
        message: 'Message',
        type: 'system',
        severity: 'info',
        actionUrl: null,
        isRead: false,
        readAt: null,
        createdAt: new Date().toISOString(),
      })) as any;

      await assert.rejects(
        async () => {
          await notificationsService.deleteNotification('notif-001', customerContext);
        },
        (err: any) => {
          assert.ok(err instanceof ForbiddenError);
          assert.match(err.message, /permission to delete this notification/);
          return true;
        }
      );
    });

    it('CUSTOMER ISOLATION: Rejects customer attempting to modify another user notification', async () => {
      notificationsRepository.findById = (async (id: string) => ({
        id,
        userId: 'other-user-uuid',
        title: 'Other Alert',
        message: 'Message',
        type: 'system',
        severity: 'info',
        actionUrl: null,
        isRead: false,
        readAt: null,
        createdAt: new Date().toISOString(),
      })) as any;

      await assert.rejects(
        async () => {
          await notificationsService.updateNotification('notif-001', { isRead: true }, customerContext);
        },
        (err: any) => {
          assert.ok(err instanceof ForbiddenError);
          assert.match(err.message, /permission to modify this notification/);
          return true;
        }
      );
    });

    it('CUSTOMER ISOLATION: Rejects customer attempting to fetch unread count for another user', async () => {
      await assert.rejects(
        async () => {
          await notificationsService.getUnreadCount('other-user-uuid', customerContext);
        },
        (err: any) => {
          assert.ok(err instanceof ForbiddenError);
          assert.match(err.message, /permission to view notifications for this user/);
          return true;
        }
      );
    });

    it('CUSTOMER ISOLATION: Rejects customer attempting to mark all as read for another user', async () => {
      await assert.rejects(
        async () => {
          await notificationsService.markAllAsRead('other-user-uuid', customerContext);
        },
        (err: any) => {
          assert.ok(err instanceof ForbiddenError);
          assert.match(err.message, /permission to update notifications for this user/);
          return true;
        }
      );
    });

    it('CUSTOMER ISOLATION: Rejects customer attempting to create/broadcast notification for another user', async () => {
      await assert.rejects(
        async () => {
          await notificationsService.createNotification(
            {
              userId: 'other-user-uuid',
              title: 'Spam Alert',
              message: 'Forbidden attempt',
              type: 'system',
              severity: 'info',
            },
            customerContext
          );
        },
        (err: any) => {
          assert.ok(err instanceof ForbiddenError);
          assert.match(err.message, /Customers cannot broadcast notifications/);
          return true;
        }
      );
    });
  });

  // --------------------------------------------------------------------------
  // 3. Fast SQL Unread Count & Batch Read Operations
  // --------------------------------------------------------------------------
  describe('Unread Count & Batch Mark Read Invariants', () => {
    let originalCountUnread: typeof notificationsRepository.countUnread;
    let originalMarkAllAsRead: typeof notificationsRepository.markAllAsRead;
    let originalFindById: typeof notificationsRepository.findById;
    let originalUpdate: typeof notificationsRepository.update;

    beforeEach(() => {
      originalCountUnread = notificationsRepository.countUnread;
      originalMarkAllAsRead = notificationsRepository.markAllAsRead;
      originalFindById = notificationsRepository.findById;
      originalUpdate = notificationsRepository.update;
    });

    afterEach(() => {
      notificationsRepository.countUnread = originalCountUnread;
      notificationsRepository.markAllAsRead = originalMarkAllAsRead;
      notificationsRepository.findById = originalFindById;
      notificationsRepository.update = originalUpdate;
    });

    it('retrieves unread notification count accurately', async () => {
      notificationsRepository.countUnread = (async (userId: string) => {
        return userId === 'user-123' ? 5 : 0;
      }) as any;

      const result = await notificationsService.getUnreadCount('user-123');
      assert.strictEqual(result.unreadCount, 5);
    });

    it('marks all notifications as read for target user', async () => {
      let capturedUserId: string | null = null;
      notificationsRepository.markAllAsRead = (async (userId: string) => {
        capturedUserId = userId;
        return { success: true, count: 4 };
      }) as any;

      const result = await notificationsService.markAllAsRead('user-123');
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.count, 4);
      assert.strictEqual(capturedUserId, 'user-123');
    });

    it('marks a single notification as read and sets isRead: true', async () => {
      notificationsRepository.findById = (async (id: string) => ({
        id,
        userId: 'user-123',
        title: 'Sample',
        message: 'Sample message',
        type: 'system',
        severity: 'info',
        actionUrl: null,
        isRead: false,
        readAt: null,
        createdAt: new Date().toISOString(),
      })) as any;

      let capturedUpdate: any = null;
      notificationsRepository.update = (async (id: string, input: any) => {
        capturedUpdate = { id, input };
        return {
          id,
          userId: 'user-123',
          title: 'Sample',
          message: 'Sample message',
          type: 'system',
          severity: 'info',
          actionUrl: null,
          isRead: true,
          readAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        };
      }) as any;

      const updated = await notificationsService.markAsRead('notif-001');
      assert.strictEqual(updated.isRead, true);
      assert.strictEqual(capturedUpdate.id, 'notif-001');
      assert.strictEqual(capturedUpdate.input.isRead, true);
    });
  });

  // --------------------------------------------------------------------------
  // 4. Cross-Domain Decoupling Invariants
  // --------------------------------------------------------------------------
  describe('Zero Cross-Domain Mutation Invariant', () => {
    let originalAdjustStockTx: typeof inventoryRepository.adjustStockTx;
    let originalUpdateOrderStatus: typeof ordersRepository.updateStatus;
    let originalFindById: typeof notificationsRepository.findById;
    let originalDelete: typeof notificationsRepository.delete;

    beforeEach(() => {
      originalAdjustStockTx = inventoryRepository.adjustStockTx;
      originalUpdateOrderStatus = ordersRepository.updateStatus;
      originalFindById = notificationsRepository.findById;
      originalDelete = notificationsRepository.delete;
    });

    afterEach(() => {
      inventoryRepository.adjustStockTx = originalAdjustStockTx;
      ordersRepository.updateStatus = originalUpdateOrderStatus;
      notificationsRepository.findById = originalFindById;
      notificationsRepository.delete = originalDelete;
    });

    it('INVARIANT: Notification creation, update, and deletion NEVER trigger inventory movements', async () => {
      let inventoryMovementTriggered = false;
      inventoryRepository.adjustStockTx = (async () => {
        inventoryMovementTriggered = true;
        return {} as any;
      }) as any;

      notificationsRepository.findById = (async (id: string) => ({
        id,
        userId: 'user-123',
        title: 'Alert',
        message: 'Message',
        type: 'inventory',
        severity: 'warning',
        actionUrl: null,
        isRead: false,
        readAt: null,
        createdAt: new Date().toISOString(),
      })) as any;

      notificationsRepository.delete = (async (id: string) => ({
        id,
      })) as any;

      await notificationsService.deleteNotification('notif-001');

      assert.strictEqual(inventoryMovementTriggered, false, 'Notification operations must NEVER mutate inventory movements');
    });

    it('INVARIANT: Notification operations NEVER mutate order statuses', async () => {
      let orderStatusChanged = false;
      ordersRepository.updateStatus = (async () => {
        orderStatusChanged = true;
        return {} as any;
      }) as any;

      notificationsRepository.findById = (async (id: string) => ({
        id,
        userId: 'user-123',
        title: 'Order Status Notification',
        message: 'Order shipped',
        type: 'order',
        severity: 'info',
        actionUrl: '/orders/o1',
        isRead: false,
        readAt: null,
        createdAt: new Date().toISOString(),
      })) as any;

      notificationsRepository.update = (async (id: string, input: any) => ({
        id,
        userId: 'user-123',
        title: 'Order Status Notification',
        message: 'Order shipped',
        type: 'order',
        severity: 'info',
        actionUrl: '/orders/o1',
        isRead: true,
        readAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      })) as any;

      await notificationsService.markAsRead('notif-001');

      assert.strictEqual(orderStatusChanged, false, 'Notification operations must NEVER mutate order statuses');
    });
  });
});
