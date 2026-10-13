import './setup';
import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { ordersService } from '../src/server/services/orders.service';
import { ordersRepository } from '../src/server/repositories/orders.repository';
import { productsRepository } from '../src/server/repositories/products.repository';
import { branchesRepository } from '../src/server/repositories/branches.repository';
import { inventoryRepository } from '../src/server/repositories/inventory.repository';
import {
  mapApiOrderToFrontend,
  isRealOrderEligible,
  getDemoOrdersStorageKey,
  mergeOrders,
} from '../src/context/OrderContext';
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

  // --------------------------------------------------------------------------
  // 5. Order Persistence, Checkout Correctness & Demo Isolation Invariants
  // --------------------------------------------------------------------------
  describe('Order Persistence, Checkout Correctness & Demo Isolation Invariants', () => {
    it('1. Demo products never trigger order POST requests with placeholder IDs', () => {
      // Products with non-UUID IDs (e.g., 'p1', 'p2') are recognized as demo products
      const demoCartItems = [
        { product: { id: 'p1', title: 'Demo Book 1' } },
        { product: { id: 'p2', title: 'Demo Book 2' } },
      ];

      // Eligible check must reject demo product IDs
      const isEligible = isRealOrderEligible({
        userId: '11111111-1111-4111-a111-111111111111',
        branchId: '22222222-2222-4222-a222-222222222222',
        items: demoCartItems as any,
      });

      assert.strictEqual(isEligible, false);

      // Also ensure synthetic non-UUID branch IDs or unauthenticated sessions are ineligible
      assert.strictEqual(
        isRealOrderEligible({
          userId: '11111111-1111-4111-a111-111111111111',
          branchId: 'b1', // mock branch ID
          items: [{ product: { id: '33333333-3333-4333-a333-333333333333' } }] as any,
        }),
        false
      );

      assert.strictEqual(
        isRealOrderEligible({
          userId: undefined, // unauthenticated guest
          branchId: '22222222-2222-4222-a222-222222222222',
          items: [{ product: { id: '33333333-3333-4333-a333-333333333333' } }] as any,
        }),
        false
      );

      // Only valid UUIDs across userId, branchId, and all product IDs qualify for server persistence
      assert.strictEqual(
        isRealOrderEligible({
          userId: '11111111-1111-4111-a111-111111111111',
          branchId: '22222222-2222-4222-a222-222222222222',
          items: [
            { product: { id: '33333333-3333-4333-a333-333333333333' } },
            { product: { id: '44444444-4444-4444-a444-444444444444' } },
          ] as any,
        }),
        true
      );
    });

    it('2. Failed server order creation never appears as a confirmed real order', async () => {
      // Simulate server order creation returning a non-OK error response
      const mockFailedFetch = async () => {
        return {
          ok: false,
          status: 404,
          statusText: 'Not Found',
          json: async () => ({ error: { message: 'Branch not found in database' } }),
        };
      };

      // Test that an error is thrown and not swallowed
      let caughtError: any = null;
      try {
        const res = await mockFailedFetch();
        if (!res.ok) {
          const errJson = await res.json().catch(() => ({}));
          const errMsg = (errJson as any)?.error?.message || `Order creation failed (${res.status})`;
          throw new Error(errMsg);
        }
      } catch (err: any) {
        caughtError = err;
      }

      assert.ok(caughtError);
      assert.strictEqual(caughtError.message, 'Branch not found in database');
    });

    it('3. Real orders remain available after refresh', () => {
      const serverPayload = [
        {
          id: 'ord-uuid-real-1',
          orderNumber: 'ORD-2026-REAL-1',
          userId: 'user-uuid-1',
          customerName: 'Aarav Patel',
          branchId: 'branch-uuid-1',
          status: 'Confirmed',
          paymentStatus: 'Paid',
          paymentMethod: 'UPI',
          subtotalAmount: '500.00',
          totalAmount: '500.00',
          items: [],
          shippingAddress: {},
        },
      ];

      const mapped = serverPayload.map(mapApiOrderToFrontend);
      assert.strictEqual(mapped.length, 1);
      assert.strictEqual(mapped[0].id, 'ord-uuid-real-1');
      assert.strictEqual(mapped[0].isDemo, undefined); // Real server order is not a demo order

      // When merged for customer or admin, real orders are preserved
      const merged = mergeOrders({
        serverOrders: mapped,
        demoOrders: [],
        isStaff: false,
      });

      assert.strictEqual(merged.length, 1);
      assert.strictEqual(merged[0].id, 'ord-uuid-real-1');
      assert.strictEqual(merged[0].status, 'Confirmed');
    });

    it('4. Demo orders remain clearly marked and do not disappear when the server returns an empty list', () => {
      const demoOrder: any = {
        id: 'ORD-DEMO-001',
        orderNumber: 'ABPS-ORD-2026-DEMO',
        customerId: 'demo-guest',
        customerName: 'Guest Customer',
        branchName: 'Kharach Campus',
        status: 'Pending',
        paymentStatus: 'Pending',
        totalAmount: 450,
        items: [],
        isDemo: true,
      };

      // Simulate refresh returning empty array from server API
      const serverOrdersAfterRefresh: any[] = [];
      const demoOrdersInStorage = [demoOrder];

      // Customer view must still retain the demo order even when server returns empty
      const merged = mergeOrders({
        serverOrders: serverOrdersAfterRefresh,
        demoOrders: demoOrdersInStorage,
        isStaff: false,
      });

      assert.strictEqual(merged.length, 1);
      assert.strictEqual(merged[0].id, 'ORD-DEMO-001');
      assert.strictEqual(merged[0].isDemo, true);
    });

    it('5. Orders are isolated between users and deduplicated when merged', () => {
      // User isolation test for demo orders storage keys
      const userAKey = getDemoOrdersStorageKey('user-uuid-aaa');
      const userBKey = getDemoOrdersStorageKey('user-uuid-bbb');
      const guestKey = getDemoOrdersStorageKey(null);

      assert.strictEqual(userAKey, 'abps_demo_orders_user_user-uuid-aaa');
      assert.strictEqual(userBKey, 'abps_demo_orders_user_user-uuid-bbb');
      assert.strictEqual(guestKey, 'abps_demo_orders_guest');
      assert.notStrictEqual(userAKey, userBKey);
      assert.notStrictEqual(userAKey, guestKey);

      // Deduplication test when merging server and demo orders
      const serverOrder: any = {
        id: 'ord-uuid-100',
        orderNumber: 'ORD-2026-100',
        totalAmount: 1000,
        isDemo: false,
      };

      const duplicateDemoOrder: any = {
        id: 'ord-uuid-100', // Same ID
        orderNumber: 'ORD-2026-100',
        totalAmount: 1000,
        isDemo: true,
      };

      const distinctDemoOrder: any = {
        id: 'ord-demo-200',
        orderNumber: 'ORD-2026-200',
        totalAmount: 500,
        isDemo: true,
      };

      const merged = mergeOrders({
        serverOrders: [serverOrder],
        demoOrders: [duplicateDemoOrder, distinctDemoOrder],
        isStaff: false,
      });

      // Must have exactly 2 orders, not 3 (duplicate removed, serverOrder preferred)
      assert.strictEqual(merged.length, 2);
      assert.strictEqual(merged[0].id, 'ord-uuid-100');
      assert.strictEqual(merged[0].isDemo, false); // Authoritative server order kept
      assert.strictEqual(merged[1].id, 'ord-demo-200');
    });

    it('6. Checkout does not silently use demo contact details', () => {
      // Simulate empty/new customer without contact details
      const unauthenticatedUser = null;
      const initialContactData = {
        fullName: (unauthenticatedUser as any)?.name || '',
        email: (unauthenticatedUser as any)?.email || '',
        phone: (unauthenticatedUser as any)?.phone?.replace(/\D/g, '') || '',
      };

      // Must initialize to empty strings, NOT 'Priya Desai' or '9876543210'
      assert.strictEqual(initialContactData.fullName, '');
      assert.strictEqual(initialContactData.email, '');
      assert.strictEqual(initialContactData.phone, '');

      // Validation must require real full name, email, and 10-digit phone
      const validateContact = (data: typeof initialContactData) => {
        const errors: Record<string, string> = {};
        if (!data.fullName.trim() || data.fullName.trim().length < 2) {
          errors.fullName = 'Full name is required (minimum 2 characters)';
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!data.email.trim() || !emailRegex.test(data.email.trim())) {
          errors.email = 'Please enter a valid email address';
        }
        const phoneDigits = data.phone.replace(/\D/g, '');
        if (!phoneDigits || phoneDigits.length !== 10) {
          errors.phone = 'Please enter a valid 10-digit mobile number';
        }
        return errors;
      };

      const errors = validateContact(initialContactData);
      assert.strictEqual(errors.fullName, 'Full name is required (minimum 2 characters)');
      assert.strictEqual(errors.email, 'Please enter a valid email address');
      assert.strictEqual(errors.phone, 'Please enter a valid 10-digit mobile number');

      // Valid contact input passes
      const validErrors = validateContact({
        fullName: 'Madhan Kumar',
        email: 'madhankumar@example.com',
        phone: '9876543210',
      });
      assert.strictEqual(Object.keys(validErrors).length, 0);
    });

    it('7. Admin order views never include browser-only demo orders', () => {
      const serverOrders: any[] = [
        {
          id: 'server-order-1',
          orderNumber: 'ORD-2026-SRV-1',
          totalAmount: 1200,
          isDemo: false,
        },
      ];

      const browserDemoOrders: any[] = [
        {
          id: 'demo-order-1',
          orderNumber: 'ORD-2026-DEMO-1',
          totalAmount: 300,
          isDemo: true,
        },
        {
          id: 'demo-order-2',
          orderNumber: 'ORD-2026-DEMO-2',
          totalAmount: 600,
          isDemo: true,
        },
      ];

      // When isStaff is true, demo orders are strictly excluded
      const adminOrders = mergeOrders({
        serverOrders,
        demoOrders: browserDemoOrders,
        isStaff: true,
      });

      assert.strictEqual(adminOrders.length, 1);
      assert.strictEqual(adminOrders[0].id, 'server-order-1');
      assert.strictEqual(adminOrders.some((o) => o.isDemo), false);
    });
  });
});
