import { pgTable, uuid, varchar, text, integer, numeric, timestamp, index } from 'drizzle-orm/pg-core';
import { entityStatusEnum, purchaseOrderStatusEnum } from './enums';
import { branches } from './business';
import { products } from './catalog';
import { authUsers } from './identity';

export const suppliers = pgTable('suppliers', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 200 }).notNull(),
  contactPerson: varchar('contact_person', { length: 150 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 20 }).notNull(),
  addressLine1: varchar('address_line1', { length: 255 }).notNull(),
  addressLine2: varchar('address_line2', { length: 255 }),
  city: varchar('city', { length: 100 }).notNull(),
  state: varchar('state', { length: 100 }).notNull(),
  pincode: varchar('pincode', { length: 10 }).notNull(),
  gstNumber: varchar('gst_number', { length: 20 }),
  paymentTerms: varchar('payment_terms', { length: 100 }).default('Net 30 Days'),
  status: entityStatusEnum('status').default('active').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
});

export const purchaseOrders = pgTable('purchase_orders', {
  id: uuid('id').defaultRandom().primaryKey(),
  poNumber: varchar('po_number', { length: 50 }).notNull().unique(),
  supplierId: uuid('supplier_id').notNull().references(() => suppliers.id, { onDelete: 'restrict' }),
  targetBranchId: uuid('target_branch_id').notNull().references(() => branches.id, { onDelete: 'restrict' }),
  status: purchaseOrderStatusEnum('status').default('Draft').notNull(),
  totalAmount: numeric('total_amount', { precision: 12, scale: 2 }).default('0.00').notNull(),
  notes: text('notes'),
  createdById: uuid('created_by_id').notNull().references(() => authUsers.id, { onDelete: 'restrict' }),
  expectedDeliveryDate: timestamp('expected_delivery_date', { withTimezone: true, mode: 'string' }),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
  index('idx_purchase_orders_supplier').on(table.supplierId),
  index('idx_purchase_orders_branch').on(table.targetBranchId),
  index('idx_purchase_orders_status').on(table.status),
]);

export const purchaseOrderItems = pgTable('purchase_order_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  purchaseOrderId: uuid('purchase_order_id').notNull().references(() => purchaseOrders.id, { onDelete: 'cascade' }),
  productId: uuid('product_id').notNull().references(() => products.id, { onDelete: 'restrict' }),
  quantityOrdered: integer('quantity_ordered').notNull(),
  quantityReceived: integer('quantity_received').default(0).notNull(),
  unitCost: numeric('unit_cost', { precision: 10, scale: 2 }).notNull(),
  totalCost: numeric('total_cost', { precision: 12, scale: 2 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
  index('idx_po_items_po_id').on(table.purchaseOrderId),
  index('idx_po_items_product_id').on(table.productId),
]);

export const purchaseOrderReceipts = pgTable('purchase_order_receipts', {
  id: uuid('id').defaultRandom().primaryKey(),
  purchaseOrderId: uuid('purchase_order_id').notNull().references(() => purchaseOrders.id, { onDelete: 'cascade' }),
  receiptNumber: varchar('receipt_number', { length: 50 }).notNull().unique(),
  receivedById: uuid('received_by_id').notNull().references(() => authUsers.id, { onDelete: 'restrict' }),
  notes: text('notes'),
  receivedAt: timestamp('received_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
  index('idx_po_receipts_po_id').on(table.purchaseOrderId),
]);
