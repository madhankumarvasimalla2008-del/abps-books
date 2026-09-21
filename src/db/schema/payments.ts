import { pgTable, uuid, varchar, text, integer, numeric, timestamp, index } from 'drizzle-orm/pg-core';
import { paymentStatusEnum, paymentMethodEnum, upiSubMethodEnum, upiAppEnum, transactionTypeEnum, transactionStatusEnum, refundReasonEnum, refundStatusEnum } from './enums';
import { orders } from './orders';
import { authUsers } from './identity';

export const payments = pgTable('payments', {
  id: uuid('id').defaultRandom().primaryKey(),
  orderId: uuid('order_id').notNull().references(() => orders.id, { onDelete: 'restrict' }),
  amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 10 }).default('INR').notNull(),
  status: paymentStatusEnum('status').default('Pending').notNull(),
  paymentMethod: paymentMethodEnum('payment_method').notNull(),
  upiSubMethod: upiSubMethodEnum('upi_sub_method'),
  upiApp: upiAppEnum('upi_app'),
  gatewayOrderId: varchar('gateway_order_id', { length: 150 }),
  gatewayPaymentId: varchar('gateway_payment_id', { length: 150 }),
  gatewaySignature: varchar('gateway_signature', { length: 255 }),
  idempotencyKey: varchar('idempotency_key', { length: 100 }).unique(),
  payerVpa: varchar('payer_vpa', { length: 150 }),
  payerPhone: varchar('payer_phone', { length: 20 }),
  receiptNumber: varchar('receipt_number', { length: 100 }),
  failureReason: text('failure_reason'),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
  index('idx_payments_order_id').on(table.orderId),
  index('idx_payments_status').on(table.status),
  index('idx_payments_created_at').on(table.createdAt),
]);

export const paymentAttempts = pgTable('payment_attempts', {
  id: uuid('id').defaultRandom().primaryKey(),
  paymentId: uuid('payment_id').notNull().references(() => payments.id, { onDelete: 'cascade' }),
  attemptNumber: integer('attempt_number').default(1).notNull(),
  method: paymentMethodEnum('method').notNull(),
  status: paymentStatusEnum('status').notNull(),
  idempotencyKey: varchar('idempotency_key', { length: 100 }),
  gatewayResponse: text('gateway_response'),
  errorMessage: text('error_message'),
  initiatedAt: timestamp('initiated_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
  completedAt: timestamp('completed_at', { withTimezone: true, mode: 'string' }),
}, (table) => [
  index('idx_payment_attempts_payment_id').on(table.paymentId),
]);

/**
 * Financial Transaction Ledger
 * Note: Tracks financial events and audit records. Not a double-entry / general accounting system.
 */
export const transactions = pgTable('transactions', {
  id: uuid('id').defaultRandom().primaryKey(),
  orderId: uuid('order_id').notNull().references(() => orders.id, { onDelete: 'restrict' }),
  paymentId: uuid('payment_id').references(() => payments.id, { onDelete: 'set null' }),
  transactionNumber: varchar('transaction_number', { length: 50 }).notNull().unique(),
  type: transactionTypeEnum('type').notNull(),
  status: transactionStatusEnum('status').default('Successful').notNull(),
  amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
  method: paymentMethodEnum('method').notNull(),
  referenceNumber: varchar('reference_number', { length: 100 }),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
  index('idx_transactions_order_id').on(table.orderId),
  index('idx_transactions_payment_id').on(table.paymentId),
  index('idx_transactions_type_status').on(table.type, table.status),
]);

export const refunds = pgTable('refunds', {
  id: uuid('id').defaultRandom().primaryKey(),
  paymentId: uuid('payment_id').notNull().references(() => payments.id, { onDelete: 'restrict' }),
  orderId: uuid('order_id').notNull().references(() => orders.id, { onDelete: 'restrict' }),
  amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
  reason: refundReasonEnum('reason').notNull(),
  status: refundStatusEnum('status').default('Pending Review').notNull(),
  refundReference: varchar('refund_reference', { length: 100 }),
  notes: text('notes'),
  requestedById: uuid('requested_by_id').notNull().references(() => authUsers.id, { onDelete: 'restrict' }),
  approvedById: uuid('approved_by_id').references(() => authUsers.id, { onDelete: 'set null' }),
  processedAt: timestamp('processed_at', { withTimezone: true, mode: 'string' }),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
  index('idx_refunds_order_id').on(table.orderId),
  index('idx_refunds_payment_id').on(table.paymentId),
  index('idx_refunds_status').on(table.status),
]);
