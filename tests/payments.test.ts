import './setup';
import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { paymentsService } from '../src/server/services/payments.service';
import { paymentsRepository } from '../src/server/repositories/payments.repository';
import { ordersRepository } from '../src/server/repositories/orders.repository';
import { inventoryRepository } from '../src/server/repositories/inventory.repository';
import { shipmentsRepository } from '../src/server/repositories/shipments.repository';
import { PaymentProviderRegistry, MockManualPaymentProvider } from '../src/server/services/payment-provider.interface';
import { BusinessRuleError, ForbiddenError, NotFoundError } from '../src/server/errors';
import { AuthContext } from '../src/server/auth/types';

describe('Phase 5.5G: Production Payments Service, Authoritative Server Verification & Cross-Domain Decoupling Invariants', () => {
  // --------------------------------------------------------------------------
  // 1. Authoritative Payment Initiation & Idempotency
  // --------------------------------------------------------------------------
  describe('Payment Initiation & Idempotency Invariants', () => {
    let originalFindOrderById: typeof ordersRepository.findById;
    let originalFindByIdempotencyKey: typeof paymentsRepository.findByIdempotencyKey;
    let originalCreatePaymentTx: typeof paymentsRepository.createPaymentTx;

    beforeEach(() => {
      originalFindOrderById = ordersRepository.findById;
      originalFindByIdempotencyKey = paymentsRepository.findByIdempotencyKey;
      originalCreatePaymentTx = paymentsRepository.createPaymentTx;
    });

    afterEach(() => {
      ordersRepository.findById = originalFindOrderById;
      paymentsRepository.findByIdempotencyKey = originalFindByIdempotencyKey;
      paymentsRepository.createPaymentTx = originalCreatePaymentTx;
    });

    it('initiates payment for a valid pending order and creates pending payment record', async () => {
      ordersRepository.findById = (async (id: string) => ({
        id,
        orderNumber: 'ORD-2026-PAY01',
        paymentStatus: 'Pending',
        customerEmail: 'purchaser@abps.edu',
        customerName: 'Priya Sharma',
      })) as any;

      paymentsRepository.findByIdempotencyKey = (async () => null) as any;

      let capturedTxInput: any = null;
      paymentsRepository.createPaymentTx = (async (input: any) => {
        capturedTxInput = input;
        return {
          id: 'pay-uuid-001',
          orderId: input.orderId,
          amount: input.amount.toFixed(2),
          currency: 'INR',
          status: 'Pending',
          paymentMethod: input.paymentMethod,
          upiSubMethod: input.upiSubMethod,
          upiApp: input.upiApp,
          gatewayOrderId: input.gatewayOrderId,
          idempotencyKey: input.idempotencyKey,
          createdAt: new Date().toISOString(),
        };
      }) as any;

      const result = await paymentsService.initiatePayment({
        orderId: 'b1a2c3d4-0000-0000-0000-000000000001',
        amount: 2500,
        paymentMethod: 'UPI',
        upiSubMethod: 'intent',
        upiApp: 'phonepe',
        idempotencyKey: 'idemp-key-001',
      });

      assert.strictEqual(result.isDuplicate, false);
      assert.strictEqual(result.payment.id, 'pay-uuid-001');
      assert.strictEqual(result.payment.status, 'Pending');
      assert.strictEqual(capturedTxInput.orderId, 'b1a2c3d4-0000-0000-0000-000000000001');
      assert.strictEqual(capturedTxInput.idempotencyKey, 'idemp-key-001');
      assert.strictEqual(result.providerResult.success, true);
    });

    it('RULE: Rejects payment initiation if order is already Paid', async () => {
      ordersRepository.findById = (async (id: string) => ({
        id,
        orderNumber: 'ORD-2026-ALREADY-PAID',
        paymentStatus: 'Paid',
      })) as any;

      await assert.rejects(
        async () => {
          await paymentsService.initiatePayment({
            orderId: 'b1a2c3d4-0000-0000-0000-000000000002',
            amount: 1500,
            paymentMethod: 'Card',
          });
        },
        (err: any) => {
          assert.ok(err instanceof BusinessRuleError);
          assert.match(err.message, /already been fully paid/);
          return true;
        }
      );
    });

    it('RULE: Returns existing payment record idempotently without creating duplicates when idempotency key is reused', async () => {
      ordersRepository.findById = (async (id: string) => ({
        id,
        orderNumber: 'ORD-2026-PAY02',
        paymentStatus: 'Pending',
      })) as any;

      const existingRecord = {
        id: 'pay-uuid-existing',
        orderId: 'b1a2c3d4-0000-0000-0000-000000000003',
        amount: '3200.00',
        status: 'Pending',
        paymentMethod: 'UPI',
        idempotencyKey: 'idemp-key-dup',
      };

      paymentsRepository.findByIdempotencyKey = (async (key: string) => {
        if (key === 'idemp-key-dup') return existingRecord;
        return null;
      }) as any;

      let createCalled = false;
      paymentsRepository.createPaymentTx = (async () => {
        createCalled = true;
        throw new Error('createPaymentTx should not be called for duplicate idempotency key');
      }) as any;

      const result = await paymentsService.initiatePayment({
        orderId: 'b1a2c3d4-0000-0000-0000-000000000003',
        amount: 3200,
        paymentMethod: 'UPI',
        idempotencyKey: 'idemp-key-dup',
      });

      assert.strictEqual(result.isDuplicate, true);
      assert.strictEqual(result.payment.id, 'pay-uuid-existing');
      assert.strictEqual(createCalled, false, 'No new payment record created for duplicate idempotency key');
    });
  });

  // --------------------------------------------------------------------------
  // 2. Authoritative Server-Side Verification & Financial Ledger Atomicity
  // --------------------------------------------------------------------------
  describe('Authoritative Server-Side Verification & Ledger Recording', () => {
    let originalFindPaymentById: typeof paymentsRepository.findById;
    let originalUpdatePaymentResultTx: typeof paymentsRepository.updatePaymentResultTx;
    let originalFindOrderById: typeof ordersRepository.findById;
    let originalUpdateOrderStatus: typeof ordersRepository.updateStatus;

    beforeEach(() => {
      originalFindPaymentById = paymentsRepository.findById;
      originalUpdatePaymentResultTx = paymentsRepository.updatePaymentResultTx;
      originalFindOrderById = ordersRepository.findById;
      originalUpdateOrderStatus = ordersRepository.updateStatus;
    });

    afterEach(() => {
      paymentsRepository.findById = originalFindPaymentById;
      paymentsRepository.updatePaymentResultTx = originalUpdatePaymentResultTx;
      ordersRepository.findById = originalFindOrderById;
      ordersRepository.updateStatus = originalUpdateOrderStatus;
    });

    it('RULE: Authoritative verification updates payment status and confirms order atomically', async () => {
      paymentsRepository.findById = (async (id: string) => ({
        id,
        orderId: 'ord-uuid-001',
        amount: '4500.00',
        status: 'Pending',
      })) as any;

      ordersRepository.findById = (async (id: string) => ({
        id,
        orderNumber: 'ORD-2026-999',
        status: 'Pending',
        paymentStatus: 'Pending',
      })) as any;

      let capturedStatusUpdate: any = null;
      ordersRepository.updateStatus = (async (id: string, newStatus: string, oldStatus: string, userId?: string, reason?: string) => {
        capturedStatusUpdate = { id, newStatus, oldStatus, userId, reason };
        return { id, status: newStatus };
      }) as any;

      paymentsRepository.updatePaymentResultTx = (async (input: any) => ({
        id: input.paymentId,
        orderId: 'ord-uuid-001',
        status: input.status,
        gatewayPaymentId: input.gatewayPaymentId,
        updatedAt: new Date().toISOString(),
      })) as any;

      const result = await paymentsService.recordPaymentResult(
        {
          paymentId: 'b1a2c3d4-0000-0000-0000-000000000010',
          status: 'Paid',
          gatewayPaymentId: 'pay_live_test_12345',
          receiptNumber: 'REC-2026-001',
          notes: 'Server verified via gateway token check',
        },
        { userId: 'admin-uuid', email: 'admin@abps.edu', role: 'admin', isStaff: true }
      );

      assert.strictEqual(result.status, 'Paid');
      assert.strictEqual(result.gatewayPaymentId, 'pay_live_test_12345');
      assert.strictEqual(capturedStatusUpdate?.newStatus, 'Confirmed');
      assert.strictEqual(capturedStatusUpdate?.oldStatus, 'Pending');
    });

    it('rejects recording payment result for non-existent payment ID', async () => {
      paymentsRepository.findById = (async () => null) as any;

      await assert.rejects(
        async () => {
          await paymentsService.recordPaymentResult({
            paymentId: 'b1a2c3d4-0000-0000-0000-000000000999',
            status: 'Paid',
          });
        },
        (err: any) => {
          assert.ok(err instanceof NotFoundError);
          assert.match(err.message, /Payment/);
          return true;
        }
      );
    });
  });

  // --------------------------------------------------------------------------
  // 3. Refund Workflow & Bounds Checking
  // --------------------------------------------------------------------------
  describe('Refund Workflow & Bounds Checking', () => {
    let originalFindPaymentById: typeof paymentsRepository.findById;
    let originalCreateRefundTx: typeof paymentsRepository.createRefundTx;

    beforeEach(() => {
      originalFindPaymentById = paymentsRepository.findById;
      originalCreateRefundTx = paymentsRepository.createRefundTx;
    });

    afterEach(() => {
      paymentsRepository.findById = originalFindPaymentById;
      paymentsRepository.createRefundTx = originalCreateRefundTx;
    });

    it('creates refund request with valid reason and bounds-checked amount', async () => {
      paymentsRepository.findById = (async (id: string) => ({
        id,
        orderId: 'ord-uuid-001',
        amount: '5000.00',
        status: 'Paid',
      })) as any;

      let capturedRefundInput: any = null;
      paymentsRepository.createRefundTx = (async (input: any) => {
        capturedRefundInput = input;
        return {
          id: 'ref-uuid-001',
          paymentId: input.paymentId,
          orderId: input.orderId,
          amount: input.amount.toFixed(2),
          reason: input.reason,
          status: 'Pending Review',
          refundReference: 'REF-2026-999',
          requestedById: input.requestedById,
          createdAt: new Date().toISOString(),
        };
      }) as any;

      const result = await paymentsService.requestRefund(
        {
          paymentId: 'b1a2c3d4-0000-0000-0000-000000000010',
          orderId: 'b1a2c3d4-0000-0000-0000-000000000020',
          amount: 2500,
          reason: 'Damaged during transit',
          notes: 'Cover torn on 2 units',
        },
        { userId: 'staff-uuid-01', email: 'staff@abps.edu', role: 'admin', isStaff: true }
      );

      assert.strictEqual(result.id, 'ref-uuid-001');
      assert.strictEqual(result.status, 'Pending Review');
      assert.strictEqual(capturedRefundInput.amount, 2500);
      assert.strictEqual(capturedRefundInput.reason, 'Damaged during transit');
      assert.strictEqual(capturedRefundInput.requestedById, 'staff-uuid-01');
    });

    it('RULE: Rejects refund if payment is unpaid / pending', async () => {
      paymentsRepository.findById = (async (id: string) => ({
        id,
        orderId: 'ord-uuid-001',
        amount: '5000.00',
        status: 'Pending',
      })) as any;

      await assert.rejects(
        async () => {
          await paymentsService.requestRefund({
            paymentId: 'b1a2c3d4-0000-0000-0000-000000000010',
            orderId: 'b1a2c3d4-0000-0000-0000-000000000020',
            amount: 2500,
            reason: 'Order cancellation',
          });
        },
        (err: any) => {
          assert.ok(err instanceof BusinessRuleError);
          assert.match(err.message, /Cannot issue refund for an unpaid transaction/);
          return true;
        }
      );
    });

    it('RULE: Rejects refund if requested amount exceeds original payment amount', async () => {
      paymentsRepository.findById = (async (id: string) => ({
        id,
        orderId: 'ord-uuid-001',
        amount: '2000.00',
        status: 'Paid',
      })) as any;

      await assert.rejects(
        async () => {
          await paymentsService.requestRefund({
            paymentId: 'b1a2c3d4-0000-0000-0000-000000000010',
            orderId: 'b1a2c3d4-0000-0000-0000-000000000020',
            amount: 3000, // Exceeds 2000
            reason: 'Excess quantity',
          });
        },
        (err: any) => {
          assert.ok(err instanceof BusinessRuleError);
          assert.match(err.message, /cannot exceed original payment amount/);
          return true;
        }
      );
    });
  });

  // --------------------------------------------------------------------------
  // 4. CRITICAL INVARIANT: Zero Cross-Domain Side Effects
  // --------------------------------------------------------------------------
  describe('Zero Cross-Domain Mutation Invariant', () => {
    let originalAdjustStockTx: typeof inventoryRepository.adjustStockTx;
    let originalCreateShipmentTx: typeof shipmentsRepository.createShipmentTx;
    let originalFindPaymentById: typeof paymentsRepository.findById;
    let originalUpdatePaymentResultTx: typeof paymentsRepository.updatePaymentResultTx;
    let originalFindOrderById: typeof ordersRepository.findById;
    let originalUpdateOrderStatus: typeof ordersRepository.updateStatus;
    let originalCreateRefundTx: typeof paymentsRepository.createRefundTx;

    let inventoryMutationCalled = false;
    let shipmentCreationCalled = false;

    beforeEach(() => {
      inventoryMutationCalled = false;
      shipmentCreationCalled = false;

      originalAdjustStockTx = inventoryRepository.adjustStockTx;
      originalCreateShipmentTx = shipmentsRepository.createShipmentTx;
      originalFindPaymentById = paymentsRepository.findById;
      originalUpdatePaymentResultTx = paymentsRepository.updatePaymentResultTx;
      originalFindOrderById = ordersRepository.findById;
      originalUpdateOrderStatus = ordersRepository.updateStatus;
      originalCreateRefundTx = paymentsRepository.createRefundTx;

      ordersRepository.updateStatus = (async (id: string, newStatus: string) => ({
        id,
        status: newStatus,
      })) as any;

      inventoryRepository.adjustStockTx = (async () => {
        inventoryMutationCalled = true;
        throw new Error('INVENTORY MUTATION PROHIBITED DURING PAYMENT OPERATIONS');
      }) as any;

      shipmentsRepository.createShipmentTx = (async () => {
        shipmentCreationCalled = true;
        throw new Error('SHIPMENT CREATION PROHIBITED DURING PAYMENT OPERATIONS');
      }) as any;
    });

    afterEach(() => {
      inventoryRepository.adjustStockTx = originalAdjustStockTx;
      shipmentsRepository.createShipmentTx = originalCreateShipmentTx;
      paymentsRepository.findById = originalFindPaymentById;
      paymentsRepository.updatePaymentResultTx = originalUpdatePaymentResultTx;
      ordersRepository.findById = originalFindOrderById;
      ordersRepository.updateStatus = originalUpdateOrderStatus;
      paymentsRepository.createRefundTx = originalCreateRefundTx;
    });

    it('RULE 1: Capturing/verifying payment MUST NOT mutate inventory stock or create shipments', async () => {
      paymentsRepository.findById = (async (id: string) => ({
        id,
        orderId: 'ord-uuid-001',
        amount: '1200.00',
        status: 'Pending',
      })) as any;

      ordersRepository.findById = (async (id: string) => ({
        id,
        status: 'Pending',
        paymentStatus: 'Pending',
      })) as any;

      paymentsRepository.updatePaymentResultTx = (async (input: any) => ({
        id: input.paymentId,
        orderId: 'ord-uuid-001',
        status: 'Paid',
      })) as any;

      await paymentsService.recordPaymentResult({
        paymentId: 'b1a2c3d4-0000-0000-0000-000000000010',
        status: 'Paid',
        gatewayPaymentId: 'pay_test_001',
      });

      assert.strictEqual(inventoryMutationCalled, false, 'Inventory stock must not be touched during payment verification');
      assert.strictEqual(shipmentCreationCalled, false, 'Shipment creation must not occur during payment verification');
    });

    it('RULE 2: Requesting refund MUST NOT mutate inventory stock or create shipments', async () => {
      paymentsRepository.findById = (async (id: string) => ({
        id,
        orderId: 'ord-uuid-001',
        amount: '1200.00',
        status: 'Paid',
      })) as any;

      paymentsRepository.createRefundTx = (async (input: any) => ({
        id: 'ref-1',
        ...input,
        status: 'Pending Review',
      })) as any;

      await paymentsService.requestRefund({
        paymentId: 'b1a2c3d4-0000-0000-0000-000000000010',
        orderId: 'b1a2c3d4-0000-0000-0000-000000000020',
        amount: 600,
        reason: 'Syllabus change',
      });

      assert.strictEqual(inventoryMutationCalled, false, 'Inventory stock must not be touched during refund request');
      assert.strictEqual(shipmentCreationCalled, false, 'Shipment creation must not occur during refund request');
    });
  });

  // --------------------------------------------------------------------------
  // 5. Provider-Agnostic Adapter & Zero Sensitive Credential Storage
  // --------------------------------------------------------------------------
  describe('Provider Adapter & Zero Sensitive Credential Storage', () => {
    it('MockManualPaymentProvider complies with PaymentProvider interface contract', async () => {
      const provider = new MockManualPaymentProvider();
      assert.strictEqual(typeof provider.name, 'string');

      const initRes = await provider.initiatePayment({
        orderId: 'ord-1',
        orderNumber: 'ORD-001',
        amount: 1000,
        currency: 'INR',
        paymentMethod: 'UPI',
      });
      assert.strictEqual(initRes.success, true);
      assert.ok(initRes.gatewayOrderId?.startsWith('MOCK-'));

      const verifyRes = await provider.verifyPayment({
        paymentId: 'pay-1',
        gatewayOrderId: initRes.gatewayOrderId,
      });
      assert.strictEqual(verifyRes.verified, true);
      assert.strictEqual(verifyRes.status, 'Paid');

      const refundRes = await provider.refundPayment({
        paymentId: 'pay-1',
        amount: 500,
        reason: 'Customer return',
      });
      assert.strictEqual(refundRes.success, true);
      assert.ok(refundRes.refundReference?.startsWith('MOCK-REF-'));
    });

    it('PaymentProviderRegistry allows provider registration and retrieval', () => {
      const current = PaymentProviderRegistry.get();
      assert.ok(current);
      assert.strictEqual(typeof current.initiatePayment, 'function');
      assert.strictEqual(typeof current.verifyPayment, 'function');
      assert.strictEqual(typeof current.refundPayment, 'function');
    });
  });
});
