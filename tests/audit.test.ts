import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { auditService, sanitizeAuditDetails } from '../src/server/services/audit.service';
import { auditRepository } from '../src/server/repositories/audit.repository';
import { inventoryRepository } from '../src/server/repositories/inventory.repository';
import { ordersRepository } from '../src/server/repositories/orders.repository';
import { createAuditLogSchema, auditLogFilterSchema } from '../src/server/validation/audit';
import { ForbiddenError, NotFoundError, UnauthorizedError } from '../src/server/errors';
import { AuthContext } from '../src/server/auth/types';

describe('Phase 5.5I: Audit Logs Domain Validation, Immutability & Security Ledger Invariants', () => {
  // --------------------------------------------------------------------------
  // 1. Zod Validation Layer
  // --------------------------------------------------------------------------
  describe('Zod Validation Layer', () => {
    it('validates a correct create audit log payload', () => {
      const validPayload = {
        action: 'order.cancelled',
        entityType: 'order',
        entityId: 'ord-12345',
        branchId: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
        details: { reason: 'Customer requested cancellation', refundAmount: 1250 },
      };

      const parsed = createAuditLogSchema.parse(validPayload);
      assert.strictEqual(parsed.action, validPayload.action);
      assert.strictEqual(parsed.entityType, validPayload.entityType);
      assert.strictEqual(parsed.entityId, validPayload.entityId);
      assert.strictEqual(parsed.branchId, validPayload.branchId);
    });

    it('rejects missing action or entityType', () => {
      assert.throws(() => {
        createAuditLogSchema.parse({
          entityType: 'order',
        });
      });

      assert.throws(() => {
        createAuditLogSchema.parse({
          action: 'order.status_update',
        });
      });
    });

    it('rejects invalid UUID format for branchId or actorId', () => {
      assert.throws(() => {
        createAuditLogSchema.parse({
          action: 'test.action',
          entityType: 'test',
          branchId: 'invalid-branch-uuid',
        });
      });

      assert.throws(() => {
        createAuditLogSchema.parse({
          action: 'test.action',
          entityType: 'test',
          actorId: 'invalid-actor-uuid',
        });
      });
    });

    it('validates audit filter query parameters', () => {
      const parsed = auditLogFilterSchema.parse({
        action: 'inventory.adjusted',
        entityType: 'inventory',
        page: '2',
        pageSize: '50',
      });

      assert.strictEqual(parsed.action, 'inventory.adjusted');
      assert.strictEqual(parsed.entityType, 'inventory');
      assert.strictEqual(parsed.page, 2);
      assert.strictEqual(parsed.pageSize, 50);
    });
  });

  // --------------------------------------------------------------------------
  // 2. Sensitive Data Redaction & Sanitization
  // --------------------------------------------------------------------------
  describe('Sensitive Data Redaction & Sanitization', () => {
    it('recursively redacts passwords, CVVs, PANs, tokens, PINs, and API keys', () => {
      const sensitiveInput = {
        userId: 'user-001',
        action: 'user.login_attempt',
        password: 'superSecretPassword123!',
        pan: '4111222233334444',
        cvv: '123',
        upi_pin: '9876',
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        nested: {
          refreshToken: 'secret-refresh-token',
          apiKey: 'pk_live_abcdef123456',
          legitimateField: 'Mathematics Class 10',
          quantity: 15,
        },
      };

      const sanitized: any = sanitizeAuditDetails(sensitiveInput);

      assert.strictEqual(sanitized.password, '[REDACTED]');
      assert.strictEqual(sanitized.pan, '[REDACTED]');
      assert.strictEqual(sanitized.cvv, '[REDACTED]');
      assert.strictEqual(sanitized.upi_pin, '[REDACTED]');
      assert.strictEqual(sanitized.token, '[REDACTED]');
      assert.strictEqual(sanitized.nested.refreshToken, '[REDACTED]');
      assert.strictEqual(sanitized.nested.apiKey, '[REDACTED]');
      assert.strictEqual(sanitized.nested.legitimateField, 'Mathematics Class 10');
      assert.strictEqual(sanitized.nested.quantity, 15);
      assert.strictEqual(sanitized.userId, 'user-001');
    });

    it('sanitizes arrays of objects cleanly', () => {
      const arrayInput = [
        { key: 'item1', password_hash: '$2b$10$abcdef...' },
        { key: 'item2', secret: 'shhh' },
      ];

      const sanitized: any = sanitizeAuditDetails(arrayInput);
      assert.strictEqual(sanitized[0].password_hash, '[REDACTED]');
      assert.strictEqual(sanitized[1].secret, '[REDACTED]');
    });
  });

  // --------------------------------------------------------------------------
  // 3. Server-Authoritative Actor Identity & Immutability
  // --------------------------------------------------------------------------
  describe('Server-Authoritative Actor Identity & Immutability', () => {
    let originalCreate: typeof auditRepository.create;

    const staffContext: AuthContext = {
      userId: 'staff-uuid-001',
      email: 'staff@example.com',
      role: 'admin',
      isStaff: true,
      branchId: 'branch-uuid-001',
    };

    beforeEach(() => {
      originalCreate = auditRepository.create;
    });

    afterEach(() => {
      auditRepository.create = originalCreate;
    });

    it('SERVER-AUTHORITATIVE: Automatically extracts actorId, actorEmail, actorRole from AuthContext', async () => {
      let capturedPayload: any = null;
      auditRepository.create = (async (data: any) => {
        capturedPayload = data;
        return {
          id: 'audit-log-001',
          ...data,
          createdAt: new Date().toISOString(),
        };
      }) as any;

      await auditService.log(
        {
          action: 'catalog.product_updated',
          entityType: 'product',
          entityId: 'prod-001',
          details: { price: 450, title: 'Physics Class 12' },
        },
        staffContext
      );

      assert.strictEqual(capturedPayload.actorId, 'staff-uuid-001');
      assert.strictEqual(capturedPayload.actorEmail, 'staff@example.com');
      assert.strictEqual(capturedPayload.actorRole, 'admin');
      assert.strictEqual(capturedPayload.branchId, 'branch-uuid-001');
      assert.strictEqual(capturedPayload.action, 'catalog.product_updated');
    });

    it('IMMUTABILITY: Audit repository and service expose strictly append-only methods (no update/delete)', () => {
      assert.strictEqual(typeof (auditRepository as any).create, 'function');
      assert.strictEqual(typeof (auditRepository as any).findMany, 'function');
      assert.strictEqual(typeof (auditRepository as any).findById, 'function');
      assert.strictEqual((auditRepository as any).update, undefined, 'Audit repository must NOT expose update method');
      assert.strictEqual((auditRepository as any).delete, undefined, 'Audit repository must NOT expose delete method');

      assert.strictEqual((auditService as any).updateLog, undefined, 'Audit service must NOT expose updateLog method');
      assert.strictEqual((auditService as any).deleteLog, undefined, 'Audit service must NOT expose deleteLog method');
    });
  });

  // --------------------------------------------------------------------------
  // 4. Role-Based Authorization, Customer Blocking & Branch Scoping
  // --------------------------------------------------------------------------
  describe('Authorization, Customer Isolation & Branch Scoping', () => {
    let originalFindMany: typeof auditRepository.findMany;
    let originalFindById: typeof auditRepository.findById;

    const customerContext: AuthContext = {
      userId: 'customer-uuid-001',
      email: 'customer@example.com',
      role: 'customer',
      isStaff: false,
      branchId: 'branch-uuid-001',
    };

    const branchAdminContext: AuthContext = {
      userId: 'branch-admin-001',
      email: 'branchadmin@example.com',
      role: 'branch_admin',
      isStaff: true,
      branchId: 'branch-uuid-main',
    };

    const centralAdminContext: AuthContext = {
      userId: 'admin-uuid-001',
      email: 'admin@example.com',
      role: 'admin',
      isStaff: true,
      branchId: null,
    };

    beforeEach(() => {
      originalFindMany = auditRepository.findMany;
      originalFindById = auditRepository.findById;
    });

    afterEach(() => {
      auditRepository.findMany = originalFindMany;
      auditRepository.findById = originalFindById;
    });

    it('CUSTOMER BLOCKING: Blocks customer from querying audit logs (403 Forbidden)', async () => {
      await assert.rejects(
        async () => {
          await auditService.listLogs(
            { page: 1, pageSize: 20, sortOrder: 'desc' },
            customerContext
          );
        },
        (err: any) => {
          assert.ok(err instanceof ForbiddenError);
          assert.match(err.message, /Customers are not permitted to access audit logs/);
          return true;
        }
      );
    });

    it('CUSTOMER BLOCKING: Blocks customer from viewing audit log entry by ID (403 Forbidden)', async () => {
      await assert.rejects(
        async () => {
          await auditService.getLogById('log-001', customerContext);
        },
        (err: any) => {
          assert.ok(err instanceof ForbiddenError);
          assert.match(err.message, /Customers are not permitted to access audit logs/);
          return true;
        }
      );
    });

    it('UNAUTHENTICATED BLOCKING: Rejects unauthenticated requests without AuthContext (401 Unauthorized)', async () => {
      await assert.rejects(
        async () => {
          await auditService.listLogs({ page: 1, pageSize: 20, sortOrder: 'desc' });
        },
        (err: any) => {
          assert.ok(err instanceof UnauthorizedError);
          return true;
        }
      );
    });

    it('BRANCH SCOPING: Automatically constrains branch_admin to their assigned branch', async () => {
      let capturedFilters: any = null;
      auditRepository.findMany = (async (filters: any) => {
        capturedFilters = filters;
        return {
          data: [],
          pagination: { page: 1, pageSize: 20, total: 0, totalPages: 1 },
        };
      }) as any;

      await auditService.listLogs({ page: 1, pageSize: 20, sortOrder: 'desc' }, branchAdminContext);

      assert.strictEqual(capturedFilters.branchId, 'branch-uuid-main');
    });

    it('BRANCH SCOPING: Rejects branch_admin attempting to query another branch (403 Forbidden)', async () => {
      await assert.rejects(
        async () => {
          await auditService.listLogs(
            { branchId: 'different-branch-uuid', page: 1, pageSize: 20, sortOrder: 'desc' },
            branchAdminContext
          );
        },
        (err: any) => {
          assert.ok(err instanceof ForbiddenError);
          assert.match(err.message, /Branch staff cannot view audit logs for other branches/);
          return true;
        }
      );
    });

    it('GLOBAL ADMIN ACCESS: Allows central admin to query global logs or filter any branch', async () => {
      let capturedFilters: any = null;
      auditRepository.findMany = (async (filters: any) => {
        capturedFilters = filters;
        return {
          data: [],
          pagination: { page: 1, pageSize: 20, total: 0, totalPages: 1 },
        };
      }) as any;

      await auditService.listLogs(
        { branchId: 'any-target-branch-uuid', page: 1, pageSize: 20, sortOrder: 'desc' },
        centralAdminContext
      );

      assert.strictEqual(capturedFilters.branchId, 'any-target-branch-uuid');
    });
  });

  // --------------------------------------------------------------------------
  // 5. Zero Cross-Domain Mutation Invariant
  // --------------------------------------------------------------------------
  describe('Zero Cross-Domain Mutation Invariant', () => {
    let originalAdjustStockTx: typeof inventoryRepository.adjustStockTx;
    let originalUpdateOrderStatus: typeof ordersRepository.updateStatus;
    let originalCreate: typeof auditRepository.create;

    beforeEach(() => {
      originalAdjustStockTx = inventoryRepository.adjustStockTx;
      originalUpdateOrderStatus = ordersRepository.updateStatus;
      originalCreate = auditRepository.create;
    });

    afterEach(() => {
      inventoryRepository.adjustStockTx = originalAdjustStockTx;
      ordersRepository.updateStatus = originalUpdateOrderStatus;
      auditRepository.create = originalCreate;
    });

    it('INVARIANT: Audit logging never invokes inventory movements or mutates orders', async () => {
      let inventoryMovementTriggered = false;
      let orderStatusChanged = false;

      inventoryRepository.adjustStockTx = (async () => {
        inventoryMovementTriggered = true;
        return {} as any;
      }) as any;

      ordersRepository.updateStatus = (async () => {
        orderStatusChanged = true;
        return {} as any;
      }) as any;

      auditRepository.create = (async (data: any) => ({
        id: 'audit-log-001',
        ...data,
        createdAt: new Date().toISOString(),
      })) as any;

      await auditService.log({
        action: 'system.maintenance',
        entityType: 'system',
        details: { status: 'healthy' },
      });

      assert.strictEqual(inventoryMovementTriggered, false, 'Audit logging must NEVER mutate inventory');
      assert.strictEqual(orderStatusChanged, false, 'Audit logging must NEVER mutate order statuses');
    });
  });
});
