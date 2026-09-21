import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { shipmentsService } from '../src/server/services/shipments.service';
import { shipmentsRepository } from '../src/server/repositories/shipments.repository';
import { ordersRepository } from '../src/server/repositories/orders.repository';
import { inventoryRepository } from '../src/server/repositories/inventory.repository';
import { mapApiShipmentToFrontend } from '../src/context/ShipmentContext';
import { BusinessRuleError, ForbiddenError, NotFoundError } from '../src/server/errors';
import { AuthContext } from '../src/server/auth/types';

describe('Phase 5.5F: Production Shipments Service, Milestones & Cross-Domain Decoupling Invariants', () => {
  // --------------------------------------------------------------------------
  // 1. Transactional Shipment Creation & Destination Snapshotting
  // --------------------------------------------------------------------------
  describe('Authoritative Shipment Creation & Manifesting', () => {
    let originalFindOrderById: typeof ordersRepository.findById;
    let originalFindByOrderId: typeof shipmentsRepository.findByOrderId;
    let originalCreateShipmentTx: typeof shipmentsRepository.createShipmentTx;

    beforeEach(() => {
      originalFindOrderById = ordersRepository.findById;
      originalFindByOrderId = shipmentsRepository.findByOrderId;
      originalCreateShipmentTx = shipmentsRepository.createShipmentTx;
    });

    afterEach(() => {
      ordersRepository.findById = originalFindOrderById;
      shipmentsRepository.findByOrderId = originalFindByOrderId;
      shipmentsRepository.createShipmentTx = originalCreateShipmentTx;
    });

    it('creates shipment and initial manifest milestone for a valid order', async () => {
      ordersRepository.findById = (async (id: string) => ({
        id,
        orderNumber: 'ORD-2026-0042',
        branchId: 'b1a2c3d4-0000-0000-0000-000000000001',
        status: 'Processing',
        userId: 'cust-uuid-1',
      })) as any;

      shipmentsRepository.findByOrderId = (async () => null) as any;

      let capturedTxInput: any = null;
      shipmentsRepository.createShipmentTx = (async (input: any) => {
        capturedTxInput = input;
        return {
          id: 'shp-uuid-1',
          orderId: input.orderId,
          carrier: input.carrier,
          trackingNumber: input.trackingNumber,
          originBranchId: input.originBranchId,
          destinationAddress: input.destinationAddress,
          estimatedDeliveryDate: input.estimatedDeliveryDate,
          notes: input.notes,
          status: 'Created',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          milestones: [
            {
              id: 'milestone-1',
              shipmentId: 'shp-uuid-1',
              status: 'Created',
              location: 'Origin Warehouse',
              description: 'Shipment label created and manifested',
              occurredAt: new Date().toISOString(),
            },
          ],
        };
      }) as any;

      const staffCtx: AuthContext = {
        userId: 'staff-uuid-1',
        email: 'logistics@abps.edu',
        role: 'warehouse',
        branchId: 'b1a2c3d4-0000-0000-0000-000000000001',
        isStaff: true,
      };

      const result = await shipmentsService.createShipment(
        {
          orderId: 'b1a2c3d4-0000-0000-0000-000000000010',
          carrier: 'Delhivery Logistics',
          trackingNumber: 'DEL-99887766',
          destinationAddress: 'Campus Office Block B, Aditya Birla Township, Kharach, Gujarat 394120',
          estimatedDeliveryDate: '2026-09-25T18:00:00.000Z',
          notes: 'Standard priority surface manifest',
        },
        staffCtx
      );

      assert.strictEqual(capturedTxInput.orderId, 'b1a2c3d4-0000-0000-0000-000000000010');
      assert.strictEqual(capturedTxInput.carrier, 'Delhivery Logistics');
      assert.strictEqual(capturedTxInput.trackingNumber, 'DEL-99887766');
      assert.strictEqual(capturedTxInput.originBranchId, 'b1a2c3d4-0000-0000-0000-000000000001');
      assert.strictEqual(result.id, 'shp-uuid-1');
      assert.strictEqual(result.status, 'Created');
      assert.strictEqual(result.milestones.length, 1);
      assert.strictEqual(result.milestones[0].status, 'Created');
    });

    it('rejects shipment creation if order does not exist', async () => {
      ordersRepository.findById = (async () => null) as any;

      await assert.rejects(
        async () => {
          await shipmentsService.createShipment({
            orderId: 'non-existent-order',
            carrier: 'Blue Dart Express',
            trackingNumber: 'BD-123456',
            destinationAddress: 'Kharach, Gujarat',
          });
        },
        (err: any) => {
          assert.ok(err instanceof NotFoundError);
          assert.match(err.message, /Order/);
          return true;
        }
      );
    });

    it('rejects duplicate shipment creation for the same order', async () => {
      ordersRepository.findById = (async (id: string) => ({
        id,
        orderNumber: 'ORD-2026-0042',
        branchId: 'b1',
      })) as any;

      shipmentsRepository.findByOrderId = (async (orderId: string) => ({
        id: 'shp-existing',
        orderId,
        trackingNumber: 'EXISTING-TRK',
      })) as any;

      await assert.rejects(
        async () => {
          await shipmentsService.createShipment({
            orderId: 'ord-1',
            carrier: 'Blue Dart Express',
            trackingNumber: 'BD-NEW-TRK',
            destinationAddress: 'Kharach, Gujarat',
          });
        },
        (err: any) => {
          assert.ok(err instanceof BusinessRuleError);
          assert.match(err.message, /Shipment already exists for order ORD-2026-0042/);
          return true;
        }
      );
    });
  });

  // --------------------------------------------------------------------------
  // 2. CRITICAL INVARIANT: Zero Cross-Domain Side Effects
  // --------------------------------------------------------------------------
  describe('Zero Cross-Domain Mutation Invariant', () => {
    let originalAdjustStockTx: typeof inventoryRepository.adjustStockTx;
    let originalUpdateOrderStatus: typeof ordersRepository.updateStatus;
    let originalFindOrderById: typeof ordersRepository.findById;
    let originalFindByOrderId: typeof shipmentsRepository.findByOrderId;
    let originalFindShipmentById: typeof shipmentsRepository.findById;
    let originalCreateShipmentTx: typeof shipmentsRepository.createShipmentTx;
    let originalAddMilestoneTx: typeof shipmentsRepository.addMilestoneTx;

    let inventoryMutationCalled = false;
    let orderStatusMutationCalled = false;

    beforeEach(() => {
      inventoryMutationCalled = false;
      orderStatusMutationCalled = false;

      originalAdjustStockTx = inventoryRepository.adjustStockTx;
      originalUpdateOrderStatus = ordersRepository.updateStatus;
      originalFindOrderById = ordersRepository.findById;
      originalFindByOrderId = shipmentsRepository.findByOrderId;
      originalFindShipmentById = shipmentsRepository.findById;
      originalCreateShipmentTx = shipmentsRepository.createShipmentTx;
      originalAddMilestoneTx = shipmentsRepository.addMilestoneTx;

      inventoryRepository.adjustStockTx = (async () => {
        inventoryMutationCalled = true;
        throw new Error('INVENTORY MUTATION PROHIBITED DURING SHIPMENT LIFECYCLE');
      }) as any;

      ordersRepository.updateStatus = (async () => {
        orderStatusMutationCalled = true;
        throw new Error('ORDER STATUS MUTATION PROHIBITED DURING SHIPMENT LIFECYCLE');
      }) as any;
    });

    afterEach(() => {
      inventoryRepository.adjustStockTx = originalAdjustStockTx;
      ordersRepository.updateStatus = originalUpdateOrderStatus;
      ordersRepository.findById = originalFindOrderById;
      shipmentsRepository.findByOrderId = originalFindByOrderId;
      shipmentsRepository.findById = originalFindShipmentById;
      shipmentsRepository.createShipmentTx = originalCreateShipmentTx;
      shipmentsRepository.addMilestoneTx = originalAddMilestoneTx;
    });

    it('RULE 1: Creating a shipment MUST NOT mutate order status, inventory stock, or payments', async () => {
      ordersRepository.findById = (async (id: string) => ({
        id,
        orderNumber: 'ORD-2026-999',
        branchId: 'b1',
        status: 'Packed',
      })) as any;

      shipmentsRepository.findByOrderId = (async () => null) as any;

      shipmentsRepository.createShipmentTx = (async (input: any) => ({
        id: 'shp-1',
        ...input,
        status: 'Created',
        milestones: [{ status: 'Created' }],
      })) as any;

      const shipment = await shipmentsService.createShipment({
        orderId: 'ord-1',
        carrier: 'Safexpress Cargo',
        trackingNumber: 'SAFE-112233',
        destinationAddress: 'Kharach, Gujarat',
      });

      assert.strictEqual(shipment.id, 'shp-1');
      assert.strictEqual(inventoryMutationCalled, false, 'Inventory must not be touched on shipment creation');
      assert.strictEqual(orderStatusMutationCalled, false, 'Order status must not be touched on shipment creation');
    });

    it('RULE 2: Adding a milestone / updating shipment status to Delivered MUST NOT auto-mark order Delivered or mutate inventory', async () => {
      shipmentsRepository.findById = (async (id: string) => ({
        id,
        orderId: 'ord-1',
        orderNumber: 'ORD-2026-999',
        orderStatus: 'Shipped',
        status: 'In Transit',
        originBranchId: 'b1',
        trackingNumber: 'SAFE-112233',
      })) as any;

      shipmentsRepository.addMilestoneTx = (async (id: string, input: any) => ({
        shipment: {
          id,
          status: input.status,
          actualDeliveryDate: input.status === 'Delivered' ? new Date().toISOString() : undefined,
          updatedAt: new Date().toISOString(),
        },
        milestone: {
          id: 'm-delivered',
          shipmentId: id,
          status: input.status,
          location: input.location,
          description: input.description,
        },
      })) as any;

      const result = await shipmentsService.addMilestone('shp-1', {
        status: 'Delivered',
        location: 'Kharach Campus Dock',
        description: 'Package delivered to recipient',
      });

      assert.strictEqual(result.shipment.status, 'Delivered');
      assert.strictEqual(result.milestone.status, 'Delivered');
      assert.strictEqual(inventoryMutationCalled, false, 'Inventory must not be touched on shipment delivery');
      assert.strictEqual(orderStatusMutationCalled, false, 'Order status must remain independently persisted');
    });

    it('RULE 3: Returning a shipment MUST NOT auto-restore inventory or cancel order', async () => {
      shipmentsRepository.findById = (async (id: string) => ({
        id,
        orderId: 'ord-1',
        orderNumber: 'ORD-2026-999',
        orderStatus: 'Shipped',
        status: 'In Transit',
        originBranchId: 'b1',
        trackingNumber: 'SAFE-112233',
      })) as any;

      shipmentsRepository.addMilestoneTx = (async (id: string, input: any) => ({
        shipment: {
          id,
          status: 'Returned',
          updatedAt: new Date().toISOString(),
        },
        milestone: {
          id: 'm-returned',
          shipmentId: id,
          status: 'Returned',
          location: 'Hub',
          description: 'Package returned to sender',
        },
      })) as any;

      const result = await shipmentsService.addMilestone('shp-1', {
        status: 'Returned',
        location: 'Hub',
        description: 'Customer unavailable, returned to origin',
      });

      assert.strictEqual(result.shipment.status, 'Returned');
      assert.strictEqual(inventoryMutationCalled, false, 'Inventory must not be touched on shipment return');
      assert.strictEqual(orderStatusMutationCalled, false, 'Order must not be auto-cancelled on shipment return');
    });
  });

  // --------------------------------------------------------------------------
  // 3. Role-Based Authorization & Multi-Tenant Scoping
  // --------------------------------------------------------------------------
  describe('Role-Based Authorization & Tenant Scoping', () => {
    let originalFindMany: typeof shipmentsRepository.findMany;
    let originalFindById: typeof shipmentsRepository.findById;
    let originalFindOrderById: typeof ordersRepository.findById;

    beforeEach(() => {
      originalFindMany = shipmentsRepository.findMany;
      originalFindById = shipmentsRepository.findById;
      originalFindOrderById = ordersRepository.findById;
    });

    afterEach(() => {
      shipmentsRepository.findMany = originalFindMany;
      shipmentsRepository.findById = originalFindById;
      ordersRepository.findById = originalFindOrderById;
    });

    it('restricts branch_admin and warehouse roles to their originBranchId for listing', async () => {
      let capturedFilters: any = null;
      shipmentsRepository.findMany = (async (filters: any) => {
        capturedFilters = filters;
        return { data: [], pagination: { page: 1, pageSize: 20, total: 0, totalPages: 1 } };
      }) as any;

      const warehouseStaffCtx: AuthContext = {
        userId: 'wh-staff-1',
        email: 'warehouse@abps.edu',
        role: 'warehouse',
        branchId: 'b1a2c3d4-0000-0000-0000-000000000001',
        isStaff: true,
      };

      await shipmentsService.listShipments({ page: 1, pageSize: 20, sortOrder: 'desc' }, warehouseStaffCtx);
      assert.strictEqual(capturedFilters.originBranchId, 'b1a2c3d4-0000-0000-0000-000000000001');
    });

    it('allows global admin to view shipments across all branches without originBranchId filter', async () => {
      let capturedFilters: any = null;
      shipmentsRepository.findMany = (async (filters: any) => {
        capturedFilters = filters;
        return { data: [], pagination: { page: 1, pageSize: 20, total: 0, totalPages: 1 } };
      }) as any;

      const adminCtx: AuthContext = {
        userId: 'admin-1',
        email: 'admin@abps.edu',
        role: 'admin',
        isStaff: true,
      };

      await shipmentsService.listShipments({ page: 1, pageSize: 20, sortOrder: 'desc' }, adminCtx);
      assert.strictEqual(capturedFilters.originBranchId, undefined);
    });

    it('enforces customer isolation: customer cannot view shipment for another customer order (403 Forbidden)', async () => {
      shipmentsRepository.findById = (async (id: string) => ({
        id,
        orderId: 'ord-cust-2',
        trackingNumber: 'TRK-999',
        originBranchId: 'b1',
      })) as any;

      ordersRepository.findById = (async (id: string) => ({
        id,
        userId: 'cust-uuid-2', // Belongs to Customer 2
      })) as any;

      const customer1Ctx: AuthContext = {
        userId: 'cust-uuid-1', // Customer 1
        email: 'customer1@abps.edu',
        role: 'customer',
        isStaff: false,
      };

      await assert.rejects(
        async () => {
          await shipmentsService.getShipmentById('shp-cust-2', customer1Ctx);
        },
        (err: any) => {
          assert.ok(err instanceof ForbiddenError);
          assert.strictEqual(err.statusCode, 403);
          assert.match(err.message, /permission to view this shipment/);
          return true;
        }
      );
    });

    it('allows customer to view tracking for their own order and redacts internal staff notes', async () => {
      shipmentsRepository.findById = (async (id: string) => ({
        id,
        orderId: 'ord-cust-1',
        trackingNumber: 'TRK-12345',
        carrier: 'Delhivery Logistics',
        status: 'In Transit',
        originBranchId: 'b1',
        notes: 'CONFIDENTIAL: Internal driver route note',
        milestones: [
          {
            id: 'm1',
            status: 'In Transit',
            location: 'Hub',
            description: 'In transit to destination',
          },
        ],
      })) as any;

      ordersRepository.findById = (async (id: string) => ({
        id,
        userId: 'cust-uuid-1',
      })) as any;

      const customer1Ctx: AuthContext = {
        userId: 'cust-uuid-1',
        email: 'customer1@abps.edu',
        role: 'customer',
        isStaff: false,
      };

      const shipment = await shipmentsService.getShipmentById('shp-cust-1', customer1Ctx);
      assert.strictEqual(shipment.id, 'shp-cust-1');
      assert.strictEqual(shipment.trackingNumber, 'TRK-12345');
      assert.strictEqual(shipment.notes, undefined, 'Internal notes must be redacted for customer view');
    });
  });

  // --------------------------------------------------------------------------
  // 4. Frontend Shipment Compatibility Adapter
  // --------------------------------------------------------------------------
  describe('Frontend Shipment Compatibility Adapter (mapApiShipmentToFrontend)', () => {
    it('correctly maps API database shipment record with nested milestones to UI interface', () => {
      const apiShipment = {
        id: 'shp-uuid-501',
        orderId: 'ord-uuid-101',
        orderNumber: 'ORD-2026-9999',
        trackingNumber: 'DEL-88776655',
        carrier: 'Delhivery Logistics',
        status: 'In Transit',
        originBranchId: 'b1a2c3d4-0000-0000-0000-000000000001',
        branchName: 'The Aditya Birla Public School, Kharach',
        destinationAddress: 'Campus Office Block B, Kharach, Gujarat',
        estimatedDeliveryDate: '2026-09-26T12:00:00.000Z',
        actualDeliveryDate: null,
        notes: 'Handle curriculum material with care',
        createdAt: '2026-09-20T08:00:00.000Z',
        updatedAt: '2026-09-20T10:00:00.000Z',
        milestones: [
          {
            id: 'm-1',
            status: 'Created',
            location: 'Origin Warehouse',
            description: 'Shipment label created and manifested',
            occurredAt: '2026-09-20T08:00:00.000Z',
          },
          {
            id: 'm-2',
            status: 'In Transit',
            location: 'Surat Central Hub',
            description: 'Departed sorting facility',
            occurredAt: '2026-09-20T10:00:00.000Z',
          },
        ],
      };

      const mapped = mapApiShipmentToFrontend(apiShipment);

      assert.strictEqual(mapped.id, 'shp-uuid-501');
      assert.strictEqual(mapped.orderId, 'ord-uuid-101');
      assert.strictEqual(mapped.orderNumber, 'ORD-2026-9999');
      assert.strictEqual(mapped.trackingNumber, 'DEL-88776655');
      assert.strictEqual(mapped.carrier, 'Delhivery Logistics');
      assert.strictEqual(mapped.status, 'In Transit');
      assert.strictEqual(mapped.destinationCity, 'Kharach');
      assert.strictEqual(mapped.destinationState, 'Gujarat');
      assert.strictEqual(mapped.dispatchDate, '2026-09-20');
      assert.strictEqual(mapped.estimatedArrival, '2026-09-26');
      assert.strictEqual(mapped.milestones?.length, 2);
      assert.strictEqual(mapped.milestones?.[0].title, 'Shipment label created and manifested');
      assert.strictEqual(mapped.milestones?.[1].title, 'Departed sorting facility');
    });
  });
});
