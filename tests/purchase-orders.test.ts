import './setup';
import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { purchaseOrdersService } from '../src/server/services/purchase-orders.service';
import { purchaseOrdersRepository } from '../src/server/repositories/purchase-orders.repository';
import { suppliersService } from '../src/server/services/suppliers.service';
import { suppliersRepository } from '../src/server/repositories/suppliers.repository';
import { productsRepository } from '../src/server/repositories/products.repository';
import { branchesRepository } from '../src/server/repositories/branches.repository';
import { inventoryRepository } from '../src/server/repositories/inventory.repository';
import { mapApiSupplierToFrontend } from '../src/context/SupplierContext';
import { mapApiPurchaseOrderToFrontend } from '../src/context/PurchaseOrderContext';
import { BusinessRuleError, ForbiddenError, NotFoundError } from '../src/server/errors';
import { AuthContext } from '../src/server/auth/types';

describe('Phase 5.5E: Production Suppliers & Purchase Orders Service Invariants', () => {
  // --------------------------------------------------------------------------
  // 1. Transactional PO Creation with Manual Unit Cost & Total Computation
  // --------------------------------------------------------------------------
  describe('Authoritative PO Creation & Manual Unit Cost Handling', () => {
    let originalFindSupplierById: typeof suppliersRepository.findById;
    let originalFindBranchById: typeof branchesRepository.findById;
    let originalFindProductById: typeof productsRepository.findById;
    let originalCreateWithItemsTx: typeof purchaseOrdersRepository.createWithItemsTx;

    beforeEach(() => {
      originalFindSupplierById = suppliersRepository.findById;
      originalFindBranchById = branchesRepository.findById;
      originalFindProductById = productsRepository.findById;
      originalCreateWithItemsTx = purchaseOrdersRepository.createWithItemsTx;
    });

    afterEach(() => {
      suppliersRepository.findById = originalFindSupplierById;
      branchesRepository.findById = originalFindBranchById;
      productsRepository.findById = originalFindProductById;
      purchaseOrdersRepository.createWithItemsTx = originalCreateWithItemsTx;
    });

    it('creates purchase order with manual unit cost without deriving from MRP or selling price', async () => {
      suppliersRepository.findById = (async (id: string) => ({
        id,
        name: 'NCERT Official Distributor',
        status: 'active',
      })) as any;

      branchesRepository.findById = (async (id: string) => ({
        id,
        name: 'The Aditya Birla Public School, Kharach',
        status: 'active',
      })) as any;

      productsRepository.findById = (async (id: string) => ({
        id,
        title: 'NCERT Class 10 Science',
        mrp: '350.00',
        sellingPrice: '320.00',
        bulkDiscountPercent: '15.00',
      })) as any;

      let capturedTxInput: any = null;
      purchaseOrdersRepository.createWithItemsTx = (async (input: any) => {
        capturedTxInput = input;
        return {
          id: 'po-uuid-1',
          poNumber: input.poNumber,
          supplierId: input.supplierId,
          targetBranchId: input.targetBranchId,
          status: 'Draft',
          totalAmount: '25000.00',
          createdById: input.createdById,
          items: input.items.map((item: any, idx: number) => ({
            id: `poi-${idx}`,
            purchaseOrderId: 'po-uuid-1',
            productId: item.productId,
            quantityOrdered: item.quantityOrdered,
            quantityReceived: 0,
            unitCost: item.unitCost.toFixed(2),
            totalCost: (item.quantityOrdered * item.unitCost).toFixed(2),
          })),
        };
      }) as any;

      const staffCtx: AuthContext = {
        userId: 'staff-uuid-1',
        email: 'procurement@abps.edu',
        role: 'admin',
        isStaff: true,
      };

      // Manual unit cost entered: 250.00 (distinct from MRP: 350.00, sellingPrice: 320.00, or bulk discounted price)
      const res = await purchaseOrdersService.createPurchaseOrder(
        {
          supplierId: 'sup-uuid-1',
          targetBranchId: 'b1a2c3d4-0000-0000-0000-000000000001',
          notes: 'Standard academic term replenishment',
          items: [
            {
              productId: 'prod-uuid-1',
              quantityOrdered: 100,
              unitCost: 250.0,
            },
          ],
        },
        staffCtx
      );

      assert.strictEqual(capturedTxInput.supplierId, 'sup-uuid-1');
      assert.strictEqual(capturedTxInput.createdById, 'staff-uuid-1');
      assert.strictEqual(capturedTxInput.items[0].quantityOrdered, 100);
      assert.strictEqual(capturedTxInput.items[0].unitCost, 250.0);
      assert.strictEqual(res.id, 'po-uuid-1');
      assert.strictEqual(res.items.length, 1);
      assert.strictEqual(res.items[0].unitCost, '250.00');
    });

    it('rejects PO creation if supplier does not exist', async () => {
      suppliersRepository.findById = (async () => null) as any;

      await assert.rejects(
        async () => {
          await purchaseOrdersService.createPurchaseOrder({
            supplierId: 'non-existent-sup',
            targetBranchId: 'b1',
            items: [{ productId: 'p1', quantityOrdered: 10, unitCost: 100 }],
          });
        },
        (err: any) => {
          assert.ok(err instanceof NotFoundError);
          assert.match(err.message, /Supplier/);
          return true;
        }
      );
    });

    it('rejects PO creation if target branch does not exist', async () => {
      suppliersRepository.findById = (async () => ({ id: 'sup-1' })) as any;
      branchesRepository.findById = (async () => null) as any;

      await assert.rejects(
        async () => {
          await purchaseOrdersService.createPurchaseOrder({
            supplierId: 'sup-1',
            targetBranchId: 'non-existent-branch',
            items: [{ productId: 'p1', quantityOrdered: 10, unitCost: 100 }],
          });
        },
        (err: any) => {
          assert.ok(err instanceof NotFoundError);
          assert.match(err.message, /Branch/);
          return true;
        }
      );
    });
  });

  // --------------------------------------------------------------------------
  // 2. CRITICAL INVARIANT: Zero Automatic Inventory Mutation During PO Receiving
  // --------------------------------------------------------------------------
  describe('Zero Inventory Mutation on PO Receiving Invariant', () => {
    let originalAdjustStockTx: typeof inventoryRepository.adjustStockTx;
    let originalReceiveItemsTx: typeof purchaseOrdersRepository.receiveItemsTx;
    let originalFindPoById: typeof purchaseOrdersRepository.findById;
    let inventoryMutationCalled = false;

    beforeEach(() => {
      inventoryMutationCalled = false;
      originalAdjustStockTx = inventoryRepository.adjustStockTx;
      originalReceiveItemsTx = purchaseOrdersRepository.receiveItemsTx;
      originalFindPoById = purchaseOrdersRepository.findById;

      inventoryRepository.adjustStockTx = (async () => {
        inventoryMutationCalled = true;
        throw new Error('INVENTORY MUTATION PROHIBITED DURING PO RECEIVING');
      }) as any;
    });

    afterEach(() => {
      inventoryRepository.adjustStockTx = originalAdjustStockTx;
      purchaseOrdersRepository.receiveItemsTx = originalReceiveItemsTx;
      purchaseOrdersRepository.findById = originalFindPoById;
    });

    it('RULE: Receiving a purchase order MUST NOT mutate inventory, create movements, or create shipments/payments', async () => {
      purchaseOrdersRepository.findById = (async (id: string) => ({
        id,
        poNumber: 'PO-2026-0001',
        supplierId: 'sup-1',
        targetBranchId: 'b1',
        status: 'Sent',
        items: [
          {
            id: 'poi-1',
            purchaseOrderId: id,
            productId: 'prod-1',
            quantityOrdered: 50,
            quantityReceived: 0,
            unitCost: '180.00',
            totalCost: '9000.00',
          },
        ],
      })) as any;

      purchaseOrdersRepository.receiveItemsTx = (async (
        poId: string,
        receivedById: string,
        receiptNumber: string,
        receivedItemsList: Array<{ itemId: string; quantityReceived: number }>,
        notes?: string
      ) => {
        return {
          purchaseOrder: {
            id: poId,
            poNumber: 'PO-2026-0001',
            status: 'Partially Received',
            updatedAt: new Date().toISOString(),
          },
          receipt: {
            id: 'rec-uuid-1',
            purchaseOrderId: poId,
            receiptNumber,
            receivedById,
            notes,
            createdAt: new Date().toISOString(),
          },
        };
      }) as any;

      const warehouseStaffCtx: AuthContext = {
        userId: 'wh-staff-uuid',
        email: 'warehouse@abps.edu',
        role: 'warehouse',
        branchId: 'b1',
        isStaff: true,
      };

      const result = await purchaseOrdersService.receiveItems(
        'po-uuid-1',
        {
          items: [{ itemId: 'poi-1', quantityReceived: 25 }],
          notes: 'Received partial batch at dock 2',
        },
        warehouseStaffCtx
      );

      assert.strictEqual(result.purchaseOrder.status, 'Partially Received');
      assert.strictEqual(result.receipt.receiptNumber.startsWith('REC-'), true);
      assert.strictEqual(inventoryMutationCalled, false, 'Inventory must not be touched during PO receiving');
    });

    it('rejects receiving if cumulative quantity exceeds ordered quantity (over-receiving check)', async () => {
      purchaseOrdersRepository.findById = (async (id: string) => ({
        id,
        status: 'Sent',
        items: [
          {
            id: 'poi-1',
            productId: 'prod-1',
            quantityOrdered: 20,
            quantityReceived: 15,
          },
        ],
      })) as any;

      // Repository layer rejects over-receiving: 15 + 10 = 25 > 20
      purchaseOrdersRepository.receiveItemsTx = (async () => {
        throw new Error('Received quantity (25) cannot exceed ordered quantity (20) for item prod-1');
      }) as any;

      await assert.rejects(
        async () => {
          await purchaseOrdersService.receiveItems('po-uuid-1', {
            items: [{ itemId: 'poi-1', quantityReceived: 10 }],
          });
        },
        (err: any) => {
          assert.ok(err instanceof BusinessRuleError);
          assert.match(err.message, /cannot exceed ordered quantity/);
          return true;
        }
      );
    });

    it('rejects receiving on Cancelled or Completed purchase orders', async () => {
      purchaseOrdersRepository.findById = (async (id: string) => ({
        id,
        status: 'Cancelled',
        items: [],
      })) as any;

      purchaseOrdersRepository.receiveItemsTx = (async () => {
        throw new Error('Cannot receive items for purchase order in status Cancelled');
      }) as any;

      await assert.rejects(
        async () => {
          await purchaseOrdersService.receiveItems('po-cancelled', {
            items: [{ itemId: 'poi-1', quantityReceived: 5 }],
          });
        },
        (err: any) => {
          assert.ok(err instanceof BusinessRuleError);
          assert.match(err.message, /Cannot receive items for purchase order in status/);
          return true;
        }
      );
    });
  });

  // --------------------------------------------------------------------------
  // 3. Role-Based Procurement Authorization Scoping
  // --------------------------------------------------------------------------
  describe('Procurement Role-Based Access Control', () => {
    let originalFindPoMany: typeof purchaseOrdersRepository.findMany;
    let originalFindSupplierMany: typeof suppliersRepository.findMany;

    beforeEach(() => {
      originalFindPoMany = purchaseOrdersRepository.findMany;
      originalFindSupplierMany = suppliersRepository.findMany;
    });

    afterEach(() => {
      purchaseOrdersRepository.findMany = originalFindPoMany;
      suppliersRepository.findMany = originalFindSupplierMany;
    });

    it('restricts branch_admin and warehouse roles to their assigned branch for PO listing', async () => {
      let capturedFilters: any = null;
      purchaseOrdersRepository.findMany = (async (filters: any) => {
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

      await purchaseOrdersService.listPurchaseOrders({ page: 1, pageSize: 20, sortOrder: 'desc' }, branchAdminCtx);
      assert.strictEqual(capturedFilters.branchId, 'b1a2c3d4-0000-0000-0000-000000000001');
    });

    it('allows global admin to view purchase orders across all branches without branch filtering', async () => {
      let capturedFilters: any = null;
      purchaseOrdersRepository.findMany = (async (filters: any) => {
        capturedFilters = filters;
        return { data: [], pagination: { page: 1, pageSize: 20, total: 0, totalPages: 1 } };
      }) as any;

      const adminCtx: AuthContext = {
        userId: 'admin-uuid-1',
        email: 'admin@abps.edu',
        role: 'admin',
        isStaff: true,
      };

      await purchaseOrdersService.listPurchaseOrders({ page: 1, pageSize: 20, sortOrder: 'desc' }, adminCtx);
      assert.strictEqual(capturedFilters.branchId, undefined);
    });

    it('allows active suppliers listing for procurement staff', async () => {
      suppliersRepository.findMany = (async (filters: any) => {
        return {
          data: [
            {
              id: 'sup-1',
              name: 'Orient BlackSwan',
              code: 'SUP-OBS',
              contactPerson: 'Karan Mehra',
              email: 'karan@orientblackswan.com',
              phone: '9876543210',
              addressLine1: 'Road 5',
              city: 'Hyderabad',
              state: 'Telangana',
              pincode: '500001',
              status: 'active',
            },
          ],
          pagination: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
        };
      }) as any;

      const result = await suppliersService.listSuppliers({ page: 1, pageSize: 20, sortOrder: 'desc' });
      assert.strictEqual(result.data.length, 1);
      assert.strictEqual(result.data[0].name, 'Orient BlackSwan');
    });
  });

  // --------------------------------------------------------------------------
  // 4. Frontend Procurement Adapters Compatibility
  // --------------------------------------------------------------------------
  describe('Frontend Procurement Compatibility Adapters', () => {
    it('mapApiSupplierToFrontend correctly maps API supplier record into UI interface', () => {
      const apiSupplier = {
        id: 'sup-uuid-101',
        name: 'Oxford University Press India',
        contactPerson: 'Siddharth Rao',
        email: 'siddharth@oup.in',
        phone: '9876501234',
        addressLine1: 'Ground Floor, Plot 14',
        addressLine2: 'Sector 62',
        city: 'Noida',
        state: 'Uttar Pradesh',
        pincode: '201301',
        gstNumber: '09AAABO1234F1Z8',
        paymentTerms: 'Net 30 Days',
        status: 'active',
      };

      const mapped = mapApiSupplierToFrontend(apiSupplier);

      assert.strictEqual(mapped.id, 'sup-uuid-101');
      assert.strictEqual(mapped.name, 'Oxford University Press India');
      assert.strictEqual(mapped.contactPerson, 'Siddharth Rao');
      assert.strictEqual(mapped.address, 'Ground Floor, Plot 14, Sector 62');
      assert.strictEqual(mapped.gstin, '09AAABO1234F1Z8');
      assert.strictEqual(mapped.status, 'active');
    });

    it('mapApiPurchaseOrderToFrontend correctly maps API PO record with item numbers into UI interface', () => {
      const apiPO = {
        id: 'po-uuid-201',
        poNumber: 'PO-2026-8888',
        supplierId: 'sup-uuid-101',
        supplierName: 'Oxford University Press India',
        status: 'Partially Received',
        totalAmount: '45000.00',
        createdAt: '2026-09-15T10:00:00.000Z',
        expectedDeliveryDate: '2026-09-30T00:00:00.000Z',
        notes: 'Priority term shipment',
        items: [
          {
            id: 'poi-1',
            productId: 'p1',
            productTitle: 'Oxford School Atlas',
            isbn: '978-01-9012-345-6',
            publisher: 'Oxford University Press',
            quantityOrdered: 100,
            quantityReceived: 40,
            unitCost: '450.00',
            totalCost: '45000.00',
          },
        ],
      };

      const mapped = mapApiPurchaseOrderToFrontend(apiPO);

      assert.strictEqual(mapped.id, 'po-uuid-201');
      assert.strictEqual(mapped.poNumber, 'PO-2026-8888');
      assert.strictEqual(mapped.supplierName, 'Oxford University Press India');
      assert.strictEqual(mapped.status, 'Partially Received');
      assert.strictEqual(mapped.totalCost, 45000.0);
      assert.strictEqual(mapped.orderDate, '2026-09-15');
      assert.strictEqual(mapped.expectedDeliveryDate, '2026-09-30');
      assert.strictEqual(mapped.items.length, 1);
      assert.strictEqual(mapped.items[0].productTitle, 'Oxford School Atlas');
      assert.strictEqual(mapped.items[0].quantityOrdered, 100);
      assert.strictEqual(mapped.items[0].quantityReceived, 40);
      assert.strictEqual(mapped.items[0].unitCost, 450.0);
      assert.strictEqual(mapped.items[0].totalCost, 45000.0);
    });
  });
});
