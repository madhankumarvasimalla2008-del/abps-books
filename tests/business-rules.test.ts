import './setup';
import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { ordersService } from '../src/server/services/orders.service';
import { ordersRepository } from '../src/server/repositories/orders.repository';
import { productsRepository } from '../src/server/repositories/products.repository';
import { branchesRepository } from '../src/server/repositories/branches.repository';
import { inventoryRepository } from '../src/server/repositories/inventory.repository';
import { purchaseOrdersService } from '../src/server/services/purchase-orders.service';
import { purchaseOrdersRepository } from '../src/server/repositories/purchase-orders.repository';
import { shipmentsService } from '../src/server/services/shipments.service';
import { shipmentsRepository } from '../src/server/repositories/shipments.repository';
import { extractAuthContext, requireAuth } from '../src/server/auth/guard';
import { UnauthorizedError } from '../src/server/errors';

describe('Phase 5.3 Business-Rule Overrides', () => {
  // --------------------------------------------------------------------------
  // Rule A: Creating an order must NOT mutate inventory
  // --------------------------------------------------------------------------
  describe('Rule A: Order Creation does NOT mutate inventory', () => {
    let originalFindBranch: typeof branchesRepository.findById;
    let originalFindProduct: typeof productsRepository.findById;
    let originalCreateOrderTx: typeof ordersRepository.createOrderTx;
    let inventoryAdjustCalled = false;

    beforeEach(() => {
      inventoryAdjustCalled = false;
      originalFindBranch = branchesRepository.findById;
      originalFindProduct = productsRepository.findById;
      originalCreateOrderTx = ordersRepository.createOrderTx;

      // Mock branch
      branchesRepository.findById = async () => ({
        id: '11111111-1111-1111-1111-111111111111',
        name: 'Main Campus Store',
        code: 'MCS',
        addressLine1: 'Main Gate',
        addressLine2: null,
        city: 'City',
        state: 'State',
        pincode: '123456',
        zone: 'Central' as const,
        contactPhone: '1234567890',
        contactEmail: 'branch@test.com',
        isActive: true,
        status: 'active' as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      // Mock product with available stock
      productsRepository.findById = async (id: string) => ({
        id,
        title: 'CBSE Mathematics Grade 10',
        isbn: '978-0-123456-78-9',
        sku: 'CBSE-M10-001',
        categoryId: 'cat-1',
        categoryName: 'Textbooks',
        publisher: 'NCERT',
        author: 'Editorial Board',
        edition: '2026',
        academicYear: '2026-2027',
        grade: 'Class 10',
        subject: 'Mathematics',
        description: 'Standard textbook',
        coverImageUrl: null,
        language: 'English',
        pages: 320,
        weightGrams: 450,
        mrp: '500.00',
        sellingPrice: '450.00',
        bulkDiscountPercent: '10.00',
        bulkThreshold: 5,
        isFeatured: true,
        isAbpsApproved: true,
        status: 'in_stock' as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      // Mock order creation transaction
      ordersRepository.createOrderTx = async (input) => ({
        id: 'ord-123',
        orderNumber: input.orderNumber,
        userId: input.userId,
        branchId: input.branchId,
        status: 'Pending' as const,
        subtotalAmount: input.subtotalAmount.toFixed(2),
        discountAmount: input.discountAmount.toFixed(2),
        shippingFee: input.shippingFee.toFixed(2),
        taxAmount: input.taxAmount.toFixed(2),
        totalAmount: input.totalAmount.toFixed(2),
        currency: 'INR',
        paymentMethod: input.paymentMethod ?? null,
        upiSubMethod: null,
        upiApp: null,
        paymentReference: null,
        paymentStatus: 'Pending' as const,
        shippingAddress: {
          id: 'addr-1',
          orderId: 'ord-123',
          recipientName: input.shippingAddress.recipientName,
          recipientPhone: input.shippingAddress.recipientPhone,
          addressLine1: input.shippingAddress.addressLine1,
          addressLine2: input.shippingAddress.addressLine2 ?? null,
          landmark: input.shippingAddress.landmark ?? null,
          city: input.shippingAddress.city,
          state: input.shippingAddress.state,
          pincode: input.shippingAddress.pincode,
          createdAt: new Date().toISOString(),
        },
        customerNotes: input.customerNotes || null,
        internalNotes: input.internalNotes || null,
        deletedAt: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        items: input.items.map((it, idx) => ({
          id: `item-${idx}`,
          orderId: 'ord-123',
          productId: it.productId,
          quantity: it.quantity,
          unitMrp: it.unitMrp.toFixed(2),
          unitPrice: it.unitPrice.toFixed(2),
          discountPercent: it.discountPercent.toFixed(2),
          totalPrice: it.totalPrice.toFixed(2),
          titleSnapshot: it.titleSnapshot,
          isbnSnapshot: it.isbnSnapshot ?? null,
          skuSnapshot: it.skuSnapshot ?? null,
          publisherSnapshot: it.publisherSnapshot ?? null,
          createdAt: new Date().toISOString(),
        })),
      });

      // Monkey patch inventory adjustment to detect illegal calls
      inventoryRepository.adjustStockTx = async () => {
        inventoryAdjustCalled = true;
        throw new Error('Inventory should NOT be mutated on order creation!');
      };
    });

    afterEach(() => {
      branchesRepository.findById = originalFindBranch;
      productsRepository.findById = originalFindProduct;
      ordersRepository.createOrderTx = originalCreateOrderTx;
    });

    it('creates an order successfully without calling inventory adjustments or creating stock movements', async () => {
      const order = await ordersService.createOrder({
        userId: '22222222-2222-2222-2222-222222222222',
        branchId: '11111111-1111-1111-1111-111111111111',
        paymentMethod: 'Manual Payment',
        shippingAddress: {
          recipientName: 'Student Parent',
          recipientPhone: '9876543210',
          addressLine1: 'Flat 402, Green Valley',
          city: 'City',
          state: 'State',
          pincode: '123456',
        },
        items: [
          {
            productId: '33333333-3333-3333-3333-333333333333',
            quantity: 2,
          },
        ],
      });

      assert.ok(order);
      assert.strictEqual(order.id, 'ord-123');
      assert.strictEqual(inventoryAdjustCalled, false, 'Inventory adjust must not be called during order creation');
    });
  });

  // --------------------------------------------------------------------------
  // Rule B: Order Cancellation must NOT auto-restore inventory
  // --------------------------------------------------------------------------
  describe('Rule B: Order Cancellation does NOT auto-restore inventory', () => {
    let originalFindOrder: typeof ordersRepository.findById;
    let originalUpdateStatus: typeof ordersRepository.updateStatus;
    let inventoryRestored = false;

    beforeEach(() => {
      inventoryRestored = false;
      originalFindOrder = ordersRepository.findById;
      originalUpdateStatus = ordersRepository.updateStatus;

      ordersRepository.findById = async (id: string) => ({
        id,
        orderNumber: 'ORD-12345',
        userId: '22222222-2222-2222-2222-222222222222',
        customerName: 'Student Parent',
        customerEmail: 'parent@example.com',
        customerPhone: '9876543210',
        branchId: '11111111-1111-1111-1111-111111111111',
        branchName: 'Main Campus Store',
        branchCode: 'MCS',
        status: 'Confirmed' as const,
        paymentStatus: 'Pending' as const,
        paymentMethod: 'Manual Payment' as const,
        upiSubMethod: null,
        upiApp: null,
        paymentReference: null,
        subtotalAmount: '900.00',
        discountAmount: '0.00',
        shippingFee: '0.00',
        taxAmount: '0.00',
        totalAmount: '900.00',
        currency: 'INR',
        shippingAddress: {
          id: 'addr-1',
          orderId: id,
          recipientName: 'Student Parent',
          recipientPhone: '9876543210',
          addressLine1: 'Flat 402, Green Valley',
          addressLine2: null,
          landmark: null,
          city: 'City',
          state: 'State',
          pincode: '123456',
          createdAt: new Date().toISOString(),
        },
        customerNotes: null,
        internalNotes: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        items: [],
        statusHistory: [],
        payments: [],
      });

      ordersRepository.updateStatus = async (orderId, targetStatus) => ({
        id: orderId,
        orderNumber: 'ORD-12345',
        userId: '22222222-2222-2222-2222-222222222222',
        branchId: '11111111-1111-1111-1111-111111111111',
        status: targetStatus,
        paymentStatus: 'Pending' as const,
        paymentMethod: 'Manual Payment' as const,
        upiSubMethod: null,
        upiApp: null,
        paymentReference: null,
        subtotalAmount: '900.00',
        discountAmount: '0.00',
        shippingFee: '0.00',
        taxAmount: '0.00',
        totalAmount: '900.00',
        currency: 'INR',
        shippingAddress: null,
        customerNotes: null,
        internalNotes: null,
        deletedAt: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      inventoryRepository.adjustStockTx = async () => {
        inventoryRestored = true;
        throw new Error('Inventory should NOT be auto-restored on order cancellation!');
      };
    });

    afterEach(() => {
      ordersRepository.findById = originalFindOrder;
      ordersRepository.updateStatus = originalUpdateStatus;
    });

    it('cancelling an order updates status to Cancelled without mutating inventory', async () => {
      const updated = await ordersService.updateOrderStatus('ord-123', {
        status: 'Cancelled',
        notes: 'Customer requested cancellation',
      });

      assert.ok(updated);
      assert.strictEqual(updated.status, 'Cancelled');
      assert.strictEqual(inventoryRestored, false, 'Inventory restoration must not occur on order cancellation');
    });
  });

  // --------------------------------------------------------------------------
  // Rule C: Purchase Order Receiving must NOT auto-mutate inventory
  // --------------------------------------------------------------------------
  describe('Rule C: Purchase Order Receiving does NOT mutate inventory', () => {
    let originalFindPo: typeof purchaseOrdersRepository.findById;
    let originalReceiveItemsTx: typeof purchaseOrdersRepository.receiveItemsTx;
    let inventoryMutated = false;

    beforeEach(() => {
      inventoryMutated = false;
      originalFindPo = purchaseOrdersRepository.findById;
      originalReceiveItemsTx = purchaseOrdersRepository.receiveItemsTx;

      purchaseOrdersRepository.findById = async (id: string) => ({
        id,
        poNumber: 'PO-999001',
        supplierId: 'sup-1',
        supplierName: 'NCERT Publishing',
        targetBranchId: '11111111-1111-1111-1111-111111111111',
        branchName: 'Main Campus Store',
        branchCode: 'MCS',
        status: 'Sent' as const,
        totalAmount: '5000.00',
        notes: null,
        createdById: 'user-admin',
        creatorName: 'Admin User',
        expectedDeliveryDate: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        items: [
          {
            id: 'po-item-1',
            productId: '33333333-3333-3333-3333-333333333333',
            productTitle: 'CBSE Mathematics Grade 10',
            productSku: 'CBSE-M10-001',
            productIsbn: '978-0-123456-78-9',
            quantityOrdered: 50,
            quantityReceived: 0,
            unitCost: '100.00',
            totalCost: '5000.00',
          },
        ],
        receipts: [],
      });

      purchaseOrdersRepository.receiveItemsTx = async (poId, receivedById, receiptNumber, receivedItems) => {
        const item = receivedItems[0];
        const isComplete = item.quantityReceived >= 50;
        return {
          purchaseOrder: {
            id: poId,
            poNumber: 'PO-999001',
            supplierId: 'sup-1',
            targetBranchId: '11111111-1111-1111-1111-111111111111',
            status: isComplete ? ('Completed' as const) : ('Partially Received' as const),
            totalAmount: '5000.00',
            notes: null,
            createdById: 'user-admin',
            expectedDeliveryDate: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          receipt: {
            id: 'rec-1',
            purchaseOrderId: poId,
            receiptNumber,
            receivedById,
            notes: null,
            receivedAt: new Date().toISOString(),
          },
        };
      };

      inventoryRepository.adjustStockTx = async () => {
        inventoryMutated = true;
        throw new Error('Inventory should NOT be auto-mutated on PO receiving!');
      };
    });

    afterEach(() => {
      purchaseOrdersRepository.findById = originalFindPo;
      purchaseOrdersRepository.receiveItemsTx = originalReceiveItemsTx;
    });

    it('receiving PO items updates receipt & PO status without mutating inventory stock or creating movement entries', async () => {
      const result = await purchaseOrdersService.receiveItems('po-123', {
        items: [
          {
            itemId: 'po-item-1',
            quantityReceived: 50,
          },
        ],
      });

      assert.ok(result);
      assert.strictEqual(result.purchaseOrder.status, 'Completed');
      assert.ok(result.receipt.receiptNumber);
      assert.strictEqual(inventoryMutated, false, 'Inventory must not be mutated on PO receiving');
    });
  });

  // --------------------------------------------------------------------------
  // Rule D: Shipment Milestones must NOT auto-change parent order status
  // --------------------------------------------------------------------------
  describe('Rule D: Shipment Milestones do NOT auto-change parent order status', () => {
    let originalFindShipment: typeof shipmentsRepository.findById;
    let originalAddMilestoneTx: typeof shipmentsRepository.addMilestoneTx;
    let orderStatusUpdated = false;

    beforeEach(() => {
      orderStatusUpdated = false;
      originalFindShipment = shipmentsRepository.findById;
      originalAddMilestoneTx = shipmentsRepository.addMilestoneTx;

      shipmentsRepository.findById = async (id: string) => ({
        id,
        orderId: 'ord-123',
        orderNumber: 'ORD-12345',
        orderStatus: 'Processing' as const,
        originBranchId: '11111111-1111-1111-1111-111111111111',
        branchName: 'Main Campus Store',
        carrier: 'BlueDart',
        trackingNumber: 'BD123456789IN',
        shippingMethod: 'Standard Courier',
        status: 'In Transit' as const,
        destinationAddress: 'Main Gate, City, State',
        shippedAt: new Date().toISOString(),
        estimatedDeliveryDate: null,
        actualDeliveryDate: null,
        notes: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        milestones: [],
      });

      shipmentsRepository.addMilestoneTx = async (shipmentId, input) => ({
        shipment: {
          id: shipmentId,
          orderId: 'ord-123',
          originBranchId: '11111111-1111-1111-1111-111111111111',
          carrier: 'BlueDart',
          trackingNumber: 'BD123456789IN',
          shippingMethod: 'Standard Courier',
          status: input.status,
          shippedAt: new Date().toISOString(),
          estimatedDeliveryDate: null,
          actualDeliveryDate: input.status === 'Delivered' ? new Date().toISOString() : null,
          destinationAddress: 'Main Gate, City, State',
          notes: input.notes || null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        milestone: {
          id: 'ms-1',
          shipmentId,
          status: input.status,
          location: input.location || null,
          description: input.description,
          occurredAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        },
      });

      ordersRepository.updateStatus = async () => {
        orderStatusUpdated = true;
        throw new Error('Order status should NOT be automatically changed on shipment milestone updates!');
      };
    });

    afterEach(() => {
      shipmentsRepository.findById = originalFindShipment;
      shipmentsRepository.addMilestoneTx = originalAddMilestoneTx;
    });

    it('adding Delivered milestone updates shipment only and does not change parent order status', async () => {
      const result = await shipmentsService.addMilestone('shp-123', {
        status: 'Delivered',
        description: 'Delivered to recipient',
        location: 'Customer Doorstep',
        notes: 'Signed by recipient',
      });

      assert.ok(result);
      assert.strictEqual(result.shipment.status, 'Delivered');
      assert.strictEqual(orderStatusUpdated, false, 'Parent order status must not be modified by shipment milestones');
    });
  });

  // --------------------------------------------------------------------------
  // Rule E: Production Authentication Fallback Safety
  // --------------------------------------------------------------------------
  describe('Rule E: Production Authentication Safety', () => {
    const originalNodeEnv = process.env.NODE_ENV;

    afterEach(() => {
      (process.env as Record<string, string | undefined>).NODE_ENV = originalNodeEnv;
    });

    it('strictly rejects dev spoofed headers in production (NODE_ENV=production)', async () => {
      (process.env as Record<string, string | undefined>).NODE_ENV = 'production';

      const mockReq = new Request('https://abpsbooks.example.com/api/orders', {
        headers: {
          'x-user-id': '00000000-0000-0000-0000-000000000001',
          'x-user-role': 'admin',
          'x-user-email': 'admin@abps.com',
          'x-user-name': 'System Administrator',
        },
      });

      const ctx = await extractAuthContext(mockReq);
      assert.strictEqual(ctx, null, 'Auth context must be null when dev headers are sent in production');

      assert.throws(
        () => requireAuth(ctx),
        UnauthorizedError,
        'requireAuth must throw UnauthorizedError in production when only dev headers exist'
      );
    });

    it('allows dev headers in non-production environments for developer convenience', async () => {
      (process.env as Record<string, string | undefined>).NODE_ENV = 'development';

      const mockReq = new Request('http://localhost:3000/api/orders', {
        headers: {
          'x-user-id': '00000000-0000-0000-0000-000000000001',
          'x-user-role': 'admin',
          'x-user-email': 'admin@abps.com',
          'x-user-name': 'System Administrator',
        },
      });

      const ctx = await extractAuthContext(mockReq);
      assert.ok(ctx, 'Auth context should be extracted in development mode');
      assert.strictEqual(ctx.userId, '00000000-0000-0000-0000-000000000001');
      assert.strictEqual(ctx.role, 'admin');
      assert.strictEqual(ctx.isStaff, true);
    });
  });
});
