import { and, desc, eq, sql } from 'drizzle-orm';
import { db } from '@/db';
import {
  payments,
  paymentAttempts,
  transactions,
  refunds,
  orders,
  authUsers,
} from '@/db/schema';
import {
  InitiatePaymentInput,
  PaymentFilterInput,
  RecordPaymentResultInput,
  RequestRefundInput,
} from '../validation/payments';

export class PaymentsRepository {
  async findMany(filters: PaymentFilterInput) {
    const conditions = [];

    if (filters.orderId) {
      conditions.push(eq(payments.orderId, filters.orderId));
    }
    if (filters.status) {
      conditions.push(eq(payments.status, filters.status));
    }
    if (filters.paymentMethod) {
      conditions.push(eq(payments.paymentMethod, filters.paymentMethod));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [totalRes] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(payments)
      .where(whereClause);

    const total = totalRes?.count || 0;
    const page = filters.page || 1;
    const pageSize = filters.pageSize || 20;
    const offset = (page - 1) * pageSize;

    const data = await db
      .select({
        id: payments.id,
        orderId: payments.orderId,
        orderNumber: orders.orderNumber,
        amount: payments.amount,
        currency: payments.currency,
        status: payments.status,
        paymentMethod: payments.paymentMethod,
        upiSubMethod: payments.upiSubMethod,
        upiApp: payments.upiApp,
        gatewayOrderId: payments.gatewayOrderId,
        gatewayPaymentId: payments.gatewayPaymentId,
        idempotencyKey: payments.idempotencyKey,
        receiptNumber: payments.receiptNumber,
        failureReason: payments.failureReason,
        createdAt: payments.createdAt,
        updatedAt: payments.updatedAt,
      })
      .from(payments)
      .innerJoin(orders, eq(payments.orderId, orders.id))
      .where(whereClause)
      .orderBy(desc(payments.createdAt))
      .limit(pageSize)
      .offset(offset);

    return {
      data,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize) || 1,
      },
    };
  }

  async findById(id: string) {
    const [payment] = await db
      .select({
        id: payments.id,
        orderId: payments.orderId,
        orderNumber: orders.orderNumber,
        amount: payments.amount,
        currency: payments.currency,
        status: payments.status,
        paymentMethod: payments.paymentMethod,
        upiSubMethod: payments.upiSubMethod,
        upiApp: payments.upiApp,
        gatewayOrderId: payments.gatewayOrderId,
        gatewayPaymentId: payments.gatewayPaymentId,
        idempotencyKey: payments.idempotencyKey,
        payerVpa: payments.payerVpa,
        payerPhone: payments.payerPhone,
        receiptNumber: payments.receiptNumber,
        failureReason: payments.failureReason,
        notes: payments.notes,
        createdAt: payments.createdAt,
        updatedAt: payments.updatedAt,
      })
      .from(payments)
      .innerJoin(orders, eq(payments.orderId, orders.id))
      .where(eq(payments.id, id))
      .limit(1);

    if (!payment) return null;

    const attempts = await db
      .select()
      .from(paymentAttempts)
      .where(eq(paymentAttempts.paymentId, id))
      .orderBy(desc(paymentAttempts.initiatedAt));

    const ledgerTransactions = await db
      .select()
      .from(transactions)
      .where(eq(transactions.paymentId, id))
      .orderBy(desc(transactions.createdAt));

    const paymentRefunds = await db
      .select()
      .from(refunds)
      .where(eq(refunds.paymentId, id))
      .orderBy(desc(refunds.createdAt));

    return {
      ...payment,
      attempts,
      transactions: ledgerTransactions,
      refunds: paymentRefunds,
    };
  }

  async findByOrderId(orderId: string) {
    return await db
      .select()
      .from(payments)
      .where(eq(payments.orderId, orderId))
      .orderBy(desc(payments.createdAt));
  }

  async findByIdempotencyKey(key: string) {
    const [payment] = await db
      .select()
      .from(payments)
      .where(eq(payments.idempotencyKey, key))
      .limit(1);
    return payment || null;
  }

  async createPaymentTx(input: InitiatePaymentInput & { gatewayOrderId?: string }) {
    return await db.transaction(async (tx) => {
      const [payment] = await tx
        .insert(payments)
        .values({
          orderId: input.orderId,
          amount: input.amount.toFixed(2),
          currency: 'INR',
          status: 'Pending',
          paymentMethod: input.paymentMethod,
          upiSubMethod: input.upiSubMethod,
          upiApp: input.upiApp,
          gatewayOrderId: input.gatewayOrderId,
          payerVpa: input.payerVpa,
          payerPhone: input.payerPhone,
          idempotencyKey: input.idempotencyKey,
          notes: input.notes,
        })
        .returning();

      await tx.insert(paymentAttempts).values({
        paymentId: payment.id,
        attemptNumber: 1,
        method: input.paymentMethod,
        status: 'Pending',
        idempotencyKey: input.idempotencyKey,
      });

      return payment;
    });
  }

  async updatePaymentResultTx(input: RecordPaymentResultInput) {
    return await db.transaction(async (tx) => {
      const [payment] = await tx
        .select()
        .from(payments)
        .where(eq(payments.id, input.paymentId))
        .limit(1);

      if (!payment) {
        throw new Error(`Payment record ${input.paymentId} not found`);
      }

      const updateValues: Record<string, unknown> = {
        status: input.status,
        updatedAt: new Date().toISOString(),
      };
      if (input.gatewayPaymentId) updateValues.gatewayPaymentId = input.gatewayPaymentId;
      if (input.gatewayOrderId) updateValues.gatewayOrderId = input.gatewayOrderId;
      if (input.gatewaySignature) updateValues.gatewaySignature = input.gatewaySignature;
      if (input.receiptNumber) updateValues.receiptNumber = input.receiptNumber;
      if (input.failureReason) updateValues.failureReason = input.failureReason;
      if (input.notes) updateValues.notes = input.notes;

      const [updated] = await tx
        .update(payments)
        .set(updateValues)
        .where(eq(payments.id, input.paymentId))
        .returning();

      // Update Order payment status
      await tx
        .update(orders)
        .set({
          paymentStatus: input.status,
          paymentReference: input.gatewayPaymentId || input.receiptNumber || undefined,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(orders.id, payment.orderId));

      // Append transaction to financial ledger if Paid
      if (input.status === 'Paid') {
        const txNumber = `TXN-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
        await tx.insert(transactions).values({
          orderId: payment.orderId,
          paymentId: payment.id,
          transactionNumber: txNumber,
          type: 'Payment',
          status: 'Successful',
          amount: payment.amount,
          method: payment.paymentMethod,
          referenceNumber: input.gatewayPaymentId || input.receiptNumber,
          notes: input.notes || 'Payment captured successfully',
        });
      }

      return updated;
    });
  }

  async createRefundTx(input: RequestRefundInput & { requestedById: string }) {
    return await db.transaction(async (tx) => {
      const refundRef = `REF-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

      const [refund] = await tx
        .insert(refunds)
        .values({
          paymentId: input.paymentId,
          orderId: input.orderId,
          amount: input.amount.toFixed(2),
          reason: input.reason,
          status: 'Pending Review',
          refundReference: refundRef,
          notes: input.notes,
          requestedById: input.requestedById,
        })
        .returning();

      return refund;
    });
  }
}

export const paymentsRepository = new PaymentsRepository();
