import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { inventoryService } from '../src/server/services/inventory.service';
import { inventoryRepository } from '../src/server/repositories/inventory.repository';
import { computeInventoryStatus } from '../src/context/InventoryContext';
import { BusinessRuleError } from '../src/server/errors';
import { AuthContext } from '../src/server/auth/types';

describe('Phase 5.5C: Production Inventory Service & Status Invariants', () => {
  // --------------------------------------------------------------------------
  // 1. Inventory Status Calculation & Discontinued Product Invariant
  // --------------------------------------------------------------------------
  describe('Inventory Status Invariant & Computation Logic', () => {
    it('preserves "discontinued" status regardless of quantity on hand or threshold', () => {
      assert.strictEqual(computeInventoryStatus(100, 10, 'discontinued'), 'discontinued');
      assert.strictEqual(computeInventoryStatus(5, 10, 'discontinued'), 'discontinued');
      assert.strictEqual(computeInventoryStatus(0, 10, 'discontinued'), 'discontinued');
    });

    it('calculates "out_of_stock" when quantityOnHand is 0 and not discontinued', () => {
      assert.strictEqual(computeInventoryStatus(0, 10, 'in_stock'), 'out_of_stock');
      assert.strictEqual(computeInventoryStatus(0, 50, 'low_stock'), 'out_of_stock');
      assert.strictEqual(computeInventoryStatus(0, 0, undefined), 'out_of_stock');
    });

    it('calculates "low_stock" when quantityOnHand is greater than 0 but <= reorderThreshold', () => {
      assert.strictEqual(computeInventoryStatus(10, 10, 'in_stock'), 'low_stock');
      assert.strictEqual(computeInventoryStatus(5, 10, 'in_stock'), 'low_stock');
      assert.strictEqual(computeInventoryStatus(1, 20, undefined), 'low_stock');
    });

    it('calculates "in_stock" when quantityOnHand is strictly greater than reorderThreshold', () => {
      assert.strictEqual(computeInventoryStatus(11, 10, 'low_stock'), 'in_stock');
      assert.strictEqual(computeInventoryStatus(100, 10, undefined), 'in_stock');
      assert.strictEqual(computeInventoryStatus(51, 50, 'in_stock'), 'in_stock');
    });
  });

  // --------------------------------------------------------------------------
  // 2. Role-Based Branch Filtering & Authorization Scoping
  // --------------------------------------------------------------------------
  describe('Inventory Service Scoping & Role Isolation', () => {
    let originalFindMany: typeof inventoryRepository.findMany;
    let originalFindMovements: typeof inventoryRepository.findMovements;

    beforeEach(() => {
      originalFindMany = inventoryRepository.findMany;
      originalFindMovements = inventoryRepository.findMovements;
    });

    afterEach(() => {
      inventoryRepository.findMany = originalFindMany;
      inventoryRepository.findMovements = originalFindMovements;
    });

    it('restricts branch_admin and warehouse roles to their assigned branchId for inventory listing', async () => {
      let capturedFilters: any = null;
      inventoryRepository.findMany = (async (filters: any) => {
        capturedFilters = filters;
        return { data: [], pagination: { page: 1, pageSize: 20, total: 0, totalPages: 1 } };
      }) as any;

      const branchAdminCtx: AuthContext = {
        userId: 'staff-uuid-1',
        email: 'staff@abps.edu',
        role: 'branch_admin',
        branchId: 'b1a2c3d4-0000-0000-0000-000000000001',
        isStaff: true,
      };

      await inventoryService.listInventory({ page: 1, pageSize: 20, sortOrder: 'desc' }, branchAdminCtx);
      assert.strictEqual(capturedFilters.branchId, 'b1a2c3d4-0000-0000-0000-000000000001');
    });

    it('restricts branch_admin and warehouse roles to their assigned branchId for movements listing', async () => {
      let capturedFilters: any = null;
      inventoryRepository.findMovements = (async (filters: any) => {
        capturedFilters = filters;
        return { data: [], pagination: { page: 1, pageSize: 20, total: 0, totalPages: 1 } };
      }) as any;

      const warehouseCtx: AuthContext = {
        userId: 'warehouse-uuid-1',
        email: 'wh@abps.edu',
        role: 'warehouse',
        branchId: 'b1a2c3d4-0000-0000-0000-000000000002',
        isStaff: true,
      };

      await inventoryService.listMovements({ page: 1, pageSize: 20, sortOrder: 'desc' }, warehouseCtx);
      assert.strictEqual(capturedFilters.branchId, 'b1a2c3d4-0000-0000-0000-000000000002');
    });

    it('allows global admin or operations staff to query inventory across all branches', async () => {
      let capturedFilters: any = null;
      inventoryRepository.findMany = (async (filters: any) => {
        capturedFilters = filters;
        return { data: [], pagination: { page: 1, pageSize: 20, total: 0, totalPages: 1 } };
      }) as any;

      const adminCtx: AuthContext = {
        userId: 'admin-uuid-1',
        email: 'admin@abps.edu',
        role: 'admin',
        isStaff: true,
      };

      await inventoryService.listInventory({ page: 1, pageSize: 20, sortOrder: 'desc' }, adminCtx);
      assert.strictEqual(capturedFilters.branchId, undefined);
    });
  });

  // --------------------------------------------------------------------------
  // 3. Atomic Stock Adjustments & Non-Negative Constraints
  // --------------------------------------------------------------------------
  describe('Atomic Stock Adjustments & Audit Movement Logging', () => {
    let originalAdjustStockTx: typeof inventoryRepository.adjustStockTx;
    let originalFindStock: typeof inventoryRepository.findStock;

    beforeEach(() => {
      originalAdjustStockTx = inventoryRepository.adjustStockTx;
      originalFindStock = inventoryRepository.findStock;
    });

    afterEach(() => {
      inventoryRepository.adjustStockTx = originalAdjustStockTx;
      inventoryRepository.findStock = originalFindStock;
    });

    it('performs positive stock adjustment and passes caller userId to performedBy', async () => {
      let capturedTxInput: any = null;
      inventoryRepository.adjustStockTx = (async (input: any) => {
        capturedTxInput = input;
        return {
          inventoryId: 'inv-uuid-1',
          previousQuantity: 50,
          newQuantity: 75,
          movement: {
            id: 'mov-uuid-1',
            inventoryId: 'inv-uuid-1',
            branchId: input.branchId,
            productId: input.productId,
            movementType: input.movementType,
            quantity: input.quantityDelta,
            previousQuantity: 50,
            newQuantity: 75,
            referenceType: input.referenceType,
            referenceId: input.referenceId,
            notes: input.notes,
            performedBy: input.performedBy,
          },
        };
      }) as any;

      const adminCtx: AuthContext = {
        userId: 'admin-uuid-1',
        email: 'admin@abps.edu',
        role: 'admin',
        isStaff: true,
      };

      const res = await inventoryService.adjustStock(
        {
          branchId: 'b1a2c3d4-0000-0000-0000-000000000001',
          productId: 'p1a2c3d4-0000-0000-0000-000000000001',
          quantityDelta: 25,
          movementType: 'Stock Adjustment',
          referenceType: 'MANUAL_AUDIT',
          referenceId: 'AUDIT-2026-001',
          notes: 'Year-end physical count reconciliation',
        },
        adminCtx
      );

      assert.strictEqual(res.previousQuantity, 50);
      assert.strictEqual(res.newQuantity, 75);
      assert.strictEqual(capturedTxInput.performedBy, 'admin-uuid-1');
      assert.strictEqual(capturedTxInput.quantityDelta, 25);
      assert.strictEqual(capturedTxInput.movementType, 'Stock Adjustment');
    });

    it('throws BusinessRuleError when repository throws insufficient stock error (newQty < 0)', async () => {
      inventoryRepository.adjustStockTx = (async () => {
        throw new Error('Insufficient stock. Available: 5, Requested reduction: 10');
      }) as any;

      await assert.rejects(
        async () => {
          await inventoryService.adjustStock({
            branchId: 'b1a2c3d4-0000-0000-0000-000000000001',
            productId: 'p1a2c3d4-0000-0000-0000-000000000001',
            quantityDelta: -10,
            movementType: 'Damaged/Scrap',
            referenceType: 'DAMAGED_ITEMS',
          });
        },
        (err: any) => {
          assert.ok(err instanceof BusinessRuleError);
          assert.match(err.message, /Insufficient stock/);
          return true;
        }
      );
    });

    it('validates stock availability correctly against availableQuantity (quantityOnHand - reservedQuantity)', async () => {
      inventoryRepository.findStock = (async (branchId: string, productId: string) => {
        return {
          id: 'inv-1',
          branchId,
          productId,
          quantityOnHand: 20,
          reservedQuantity: 5, // Available = 15
          reorderThreshold: 10,
          aisleLocation: null,
          rackLocation: null,
          shelfLocation: null,
          binLocation: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      }) as any;

      // Available is 15, requesting 10 should succeed
      const ok = await inventoryService.validateStockAvailability('b1', [
        { productId: 'p1', quantity: 10 },
      ]);
      assert.strictEqual(ok, true);

      // Available is 15, requesting 20 should throw BusinessRuleError
      await assert.rejects(
        async () => {
          await inventoryService.validateStockAvailability('b1', [
            { productId: 'p1', quantity: 20 },
          ]);
        },
        (err: any) => {
          assert.ok(err instanceof BusinessRuleError);
          assert.match(err.message, /sufficient stock/);
          return true;
        }
      );
    });
  });
});
