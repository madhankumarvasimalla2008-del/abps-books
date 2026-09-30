import './setup';
import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { ordersService } from '../src/server/services/orders.service';
import { ordersRepository } from '../src/server/repositories/orders.repository';
import { productsRepository } from '../src/server/repositories/products.repository';
import { branchesRepository } from '../src/server/repositories/branches.repository';
import { inventoryRepository } from '../src/server/repositories/inventory.repository';
import { mapApiOrderToFrontend } from '../src/context/OrderContext';
import { BusinessRuleError, ForbiddenError, NotFoundError } from '../src/server/errors';
import { AuthContext } from '../src/server/auth/types';

describe('Phase 5.5D: Production Orders Service, Invariants & Security Boundaries', () => {
  // --------------------------------------------------------------------------
  // 1. Transactional Order Creation with Authoritative Recalculation & Snapshots
  // --------------------------------------------------------------------------
  describe('Authoritative Pricing & Frozen Snapshots', () => {
    let originalFindProductById: typeof productsRepository.findById;
    let originalFindBranchById: typeof branchesRepository.findById;
    let originalCreateOrderTx: typeof ordersRepository.createOrderTx;

    beforeEach(() => {
      originalFindProductById = productsRepository.findById;
      originalFindBranchById = branchesRepository.findById;
      originalCreateOrderTx = ordersRepository.createOrderTx;
    });

    afterEach(() => {
      productsRepository.findById = originalFindProductById;
      branchesRepository.findById = originalFindBranchById;
      ordersRepository.createOrderTx = originalCreateOrderTx;
    });

    it('recalculates prices authoritatively from database catalog and freezes snapshots', async () => {
      branchesRepository.findById = (async (id: string) => ({
        id,
        code: 'ABPS-KHA',
        name: 'The Aditya Birla Public School, Kharach',
        addressLine1: 'Campus Dock',
        city: 'Kharach',
        state: 'Gujarat',
        pincode: '394120',
        status: 'active',
      })) as any;

      productsRepository.findById = (async (id: string) => {
        if (id === 'prod-1') {
          return {
            id: 'prod-1',
            title: 'CBSE Mathematics Class 10',
            isbn: '978-81-7450-485-2',
            sku: 'NCERT-MTH-10',
            publisher: 'NCERT',
            mrp: '300.00',
            sellingPrice: '280.00',
            bulkDiscountPercent: '10.00',
            bulkThreshold: 5,
            status: 'in_stock',
          };
        }
        return null;
      }) as any;

      let capturedTxInput: any = null;
      ordersRepository.createOrderTx = (async (input: any) => {
        capturedTxInput = input;
        return {
          id: 'ord-uuid-1',
          orderNumber: input.orderNumber,
          userId: input.userId,
          branchId: input.branchId,
          status: 'Pending',
          paymentStatus: 'Pending',
          paymentMethod: input.paymentMethod,
          subtotalAmount: input.subtotalAmount.toFixed(2),
          discountAmount: input.discountAmount.toFixed(2),
          shippingFee: input.shippingFee.toFixed(2),
          taxAmount: input.taxAmount.toFixed(2),
          totalAmount: input.totalAmount.toFixed(2),
          items: input.items.map((item: any, idx: number) => ({
            id: `oi-${idx}`,
            orderId: 'ord-uuid-1',
            ...item,
          })),
          shippingAddress: {
            id: 'addr-uuid-1',
            orderId: 'ord-uuid-1',
            ...input.shippingAddress,
          },
        };
      }) as any;

      const customerCtx: AuthContext = {
        userId: 'cust-uuid-1',
        email: 'priya@abps.edu',
        role: 'customer',
        isStaff: false,
      };

      const result = await ordersService.createOrder(
        {
          userId: 'cust-uuid-1',
          branchId: 'b1a2c3d4-0000-0000-0000-000000000001',
          paymentMethod: 'UPI',
          upiSubMethod: 'qr',
          customerNotes: 'Deliver to main office',
          shippingAddress: {
            recipientName: 'Priya Desai',
            recipientPhone: '9876543210',
            addressLine1: 'Campus Office Block B',
            addressLine2: 'Aditya Birla Township',
            city: 'Kharach',
            state: 'Gujarat',
            pincode: '394120',
          },
          items: [
            {
              productId: 'prod-1',
              quantity: 10, // Exceeds bulk threshold (5) -> 10% discount on sellingPrice (280 * 0.9 = 252)
            },
          ],
        },
        customerCtx
      );

      // Verify authoritative recalculations:
      // MRP = 300 * 10 = 3000 (Subtotal)
      // Selling price discounted = 252 * 10 = 2520 (Total)
      // Total discount = 3000 - 2520 = 480
      assert.strictEqual(capturedTxInput.subtotalAmount, 3000.0);
      assert.strictEqual(capturedTxInput.discountAmount, 480.0);
      assert.strictEqual(capturedTxInput.totalAmount, 2520.0);
      assert.strictEqual(capturedTxInput.items[0].unitPrice, 252.0);
      assert.strictEqual(capturedTxInput.items[0].discountPercent, 10.0);

      // Verify immutable snapshots:
      assert.strictEqual(capturedTxInput.items[0].titleSnapshot, 'CBSE Mathematics Class 10');
      assert.strictEqual(capturedTxInput.items[0].isbnSnapshot, '978-81-7450-485-2');
      assert.strictEqual(capturedTxInput.items[0].skuSnapshot, 'NCERT-MTH-10');
      assert.strictEqual(capturedTxInput.items[0].publisherSnapshot, 'NCERT');
      assert.strictEqual(capturedTxInput.shippingAddress.recipientName, 'Priya Desai');
      assert.strictEqual(capturedTxInput.shippingAddress.city, 'Kharach');

      assert.strictEqual(result.id, 'ord-uuid-1');
    });

    it('rejects order creation if product is unavailable (discontinued or out_of_stock)', async () => {
      branchesRepository.findById = (async (id: string) => ({ id })) as any;
      productsRepository.findById = (async () => ({
        id: 'prod-discontinued',
        title: 'Legacy Physics Guide',
        status: 'discontinued',
      })) as any;

      await assert.rejects(
        async () => {
          await ordersService.createOrder({
            userId: 'cust-uuid-1',
            branchId: 'b1',
            paymentMethod: 'UPI',
            shippingAddress: {
              recipientName: 'Priya Desai',
              recipientPhone: '9876543210',
              addressLine1: 'Campus Office',
              city: 'Kharach',
              state: 'Gujarat',
              pincode: '394120',
            },
            items: [{ productId: 'prod-discontinued', quantity: 2 }],
          });
        },
        (err: any) => {
          assert.ok(err instanceof BusinessRuleError);
          assert.match(err.message, /currently unavailable/);
          return true;
        }
      );
    });
  });

  // --------------------------------------------------------------------------
  // 2. CRITICAL INVARIANT: Zero Automatic Inventory Mutation
  // --------------------------------------------------------------------------
  describe('Zero Inventory Mutation Business Rules', () => {
    let originalAdjustStockTx: typeof inventoryRepository.adjustStockTx;
    let originalCreateOrderTx: typeof ordersRepository.createOrderTx;
    let originalUpdateStatus: typeof ordersRepository.updateStatus;
    let originalFindProductById: typeof productsRepository.findById;
    let originalFindBranchById: typeof branchesRepository.findById;
    let originalFindOrderById: typeof ordersRepository.findById;

    let inventoryMutationCalled = false;

    beforeEach(() => {
      inventoryMutationCalled = false;
      originalAdjustStockTx = inventoryRepository.adjustStockTx;
      originalCreateOrderTx = ordersRepository.createOrderTx;
      originalUpdateStatus = ordersRepository.updateStatus;
      originalFindProductById = productsRepository.findById;
      originalFindBranchById = branchesRepository.findById;
      originalFindOrderById = ordersRepository.findById;

      inventoryRepository.adjustStockTx = (async () => {
        inventoryMutationCalled = true;
        throw new Error('INVENTORY MUTATION PROHIBITED DURING ORDER LIFECYCLE');
      }) as any;
    });

    afterEach(() => {
      inventoryRepository.adjustStockTx = originalAdjustStockTx;
      ordersRepository.createOrderTx = originalCreateOrderTx;
      ordersRepository.updateStatus = originalUpdateStatus;
      productsRepository.findById = originalFindProductById;
      branchesRepository.findById = originalFindBranchById;
      ordersRepository.findById = originalFindOrderById;
    });

    it('RULE 1: Creating an order MUST NOT mutate inventory', async () => {
      branchesRepository.findById = (async (id: string) => ({ id })) as any;
      productsRepository.findById = (async (id: string) => ({
        id,
        title: 'Science Exemplar',
        mrp: '200.00',
        sellingPrice: '190.00',
        bulkThreshold: 0,
        bulkDiscountPercent: '0',
        status: 'in_stock',
      })) as any;

      ordersRepository.createOrderTx = (async (input: any) => ({
        id: 'ord-123',
        orderNumber: input.orderNumber,
        userId: input.userId,
        branchId: input.branchId,
        status: 'Pending',
        paymentStatus: 'Pending',
        totalAmount: input.totalAmount.toFixed(2),
        items: [],
      })) as any;

      const order = await ordersService.createOrder({
        userId: 'cust-uuid-1',
        branchId: 'b1',
        paymentMethod: 'UPI',
        shippingAddress: {
          recipientName: 'Priya',
          recipientPhone: '9876543210',
          addressLine1: 'Campus Office',
          city: 'Kharach',
          state: 'Gujarat',
          pincode: '394120',
        },
        items: [{ productId: 'prod-1', quantity: 3 }],
      });

      assert.strictEqual(order.id, 'ord-123');
      assert.strictEqual(inventoryMutationCalled, false, 'Inventory must not be touched on order creation');
    });

    it('RULE 2: Cancelling an order MUST NOT auto-restore inventory', async () => {
      ordersRepository.findById = (async (id: string) => ({
        id,
        orderNumber: 'ORD-123',
        userId: 'cust-uuid-1',
        branchId: 'b1',
        status: 'Pending',
        paymentStatus: 'Pending',
      })) as any;

      ordersRepository.updateStatus = (async (id: string, status: any, notes: any) => ({
        id,
        status,
        notes,
      })) as any;

      const updated = await ordersService.updateOrderStatus('ord-123', {
        status: 'Cancelled',
        notes: 'Customer changed mind',
      });

      assert.ok(updated, 'Updated order must not be null');
      assert.strictEqual(updated.status, 'Cancelled');
      assert.strictEqual(inventoryMutationCalled, false, 'Inventory must not be touched on order cancellation');
    });
  });

  // --------------------------------------------------------------------------
  // 3. Customer Authorization Scoping & Cross-Tenant Isolation
  // --------------------------------------------------------------------------
  describe('Customer Authorization Isolation & Role Boundaries', () => {
    let originalFindById: typeof ordersRepository.findById;
    let originalFindMany: typeof ordersRepository.findMany;

    beforeEach(() => {
      originalFindById = ordersRepository.findById;
      originalFindMany = ordersRepository.findMany;
    });

    afterEach(() => {
      ordersRepository.findById = originalFindById;
      ordersRepository.findMany = originalFindMany;
    });

    it('enforces customer isolation: customer cannot view another customer order (403 Forbidden)', async () => {
      ordersRepository.findById = (async (id: string) => ({
        id,
        orderNumber: 'ORD-FOREIGN-999',
        userId: 'cust-uuid-2', // Belongs to Customer 2
        branchId: 'b1',
        status: 'Confirmed',
      })) as any;

      const customer1Ctx: AuthContext = {
        userId: 'cust-uuid-1', // Customer 1
        email: 'cust1@abps.edu',
        role: 'customer',
        isStaff: false,
      };

      await assert.rejects(
        async () => {
          await ordersService.getOrderById('ord-foreign-id', customer1Ctx);
        },
        (err: any) => {
          assert.ok(err instanceof ForbiddenError);
          assert.strictEqual(err.statusCode, 403);
          assert.match(err.message, /permission to view this order/);
          return true;
        }
      );
    });

    it('allows customer to view their own order', async () => {
      ordersRepository.findById = (async (id: string) => ({
        id,
        orderNumber: 'ORD-OWN-123',
        userId: 'cust-uuid-1',
        branchId: 'b1',
        status: 'Confirmed',
      })) as any;

      const customer1Ctx: AuthContext = {
        userId: 'cust-uuid-1',
        email: 'cust1@abps.edu',
        role: 'customer',
        isStaff: false,
      };

      const order = await ordersService.getOrderById('ord-own-id', customer1Ctx);
      assert.strictEqual(order.id, 'ord-own-id');
      assert.strictEqual(order.userId, 'cust-uuid-1');
    });

    it('restricts branch_admin and warehouse roles to their assigned branchId', async () => {
      let capturedFilters: any = null;
      ordersRepository.findMany = (async (filters: any) => {
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

      await ordersService.listOrders({ page: 1, pageSize: 20, sortOrder: 'desc' }, branchAdminCtx);
      assert.strictEqual(capturedFilters.branchId, 'b1a2c3d4-0000-0000-0000-000000000001');
    });
  });

  // --------------------------------------------------------------------------
  // 4. Frontend Order Adapter & Compatibility
  // --------------------------------------------------------------------------
  describe('Frontend Order Compatibility Adapter (mapApiOrderToFrontend)', () => {
    it('maps database order response correctly into frontend Order interface', () => {
      const apiOrder = {
        id: 'ord-uuid-101',
        orderNumber: 'ORD-2026-9999',
        userId: 'user-uuid-1',
        customerName: 'Priya Desai',
        customerEmail: 'priya@abps.edu',
        customerPhone: '9876543210',
        branchId: 'b1a2c3d4-0000-0000-0000-000000000001',
        branchName: 'The Aditya Birla Public School, Kharach',
        branchCode: 'ABPS-KHA',
        status: 'Processing',
        paymentStatus: 'Paid',
        paymentMethod: 'UPI',
        subtotalAmount: '1200.00',
        discountAmount: '100.00',
        shippingFee: '0.00',
        taxAmount: '0.00',
        totalAmount: '1100.00',
        customerNotes: 'Please ring the bell',
        shippingAddress: {
          recipientName: 'Priya Desai',
          recipientPhone: '9876543210',
          addressLine1: 'Campus Office Block B',
          addressLine2: 'Aditya Birla Township',
          city: 'Kharach',
          state: 'Gujarat',
          pincode: '394120',
        },
        items: [
          {
            id: 'item-1',
            productId: 'p1',
            titleSnapshot: 'CBSE Mathematics Class 10',
            skuSnapshot: 'NCERT-MTH-10',
            isbnSnapshot: '978-81-7450-485-2',
            publisherSnapshot: 'NCERT',
            unitPrice: '275.00',
            quantity: 4,
            totalPrice: '1100.00',
          },
        ],
        statusHistory: [
          { newStatus: 'Pending', notes: 'Order placed', createdAt: new Date().toISOString() },
          { newStatus: 'Processing', notes: 'Order in preparation', createdAt: new Date().toISOString() },
        ],
      };

      const mapped = mapApiOrderToFrontend(apiOrder);

      assert.strictEqual(mapped.id, 'ord-uuid-101');
      assert.strictEqual(mapped.orderNumber, 'ORD-2026-9999');
      assert.strictEqual(mapped.subtotal, 1200.0);
      assert.strictEqual(mapped.discount, 100.0);
      assert.strictEqual(mapped.totalAmount, 1100.0);
      assert.strictEqual(mapped.status, 'Processing');
      assert.strictEqual(mapped.paymentStatus, 'Paid');
      assert.strictEqual(mapped.items.length, 1);
      assert.strictEqual(mapped.items[0].productTitle, 'CBSE Mathematics Class 10');
      assert.strictEqual(mapped.deliveryAddress.recipientName, 'Priya Desai');
      assert.strictEqual(mapped.deliveryAddress.city, 'Kharach');
      assert.strictEqual(mapped.timeline.length > 0, true);
    });
  });
});
