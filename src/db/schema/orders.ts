import { pgTable, uuid, varchar, text, integer, numeric, timestamp, index } from 'drizzle-orm/pg-core';
import { orderStatusEnum, paymentStatusEnum, paymentMethodEnum, upiSubMethodEnum, upiAppEnum } from './enums';
import { branches } from './business';
import { products } from './catalog';
import { authUsers } from './identity';

export const orders = pgTable('orders', {
  id: uuid('id').defaultRandom().primaryKey(),
  orderNumber: varchar('order_number', { length: 50 }).notNull().unique(),
  userId: uuid('user_id').notNull().references(() => authUsers.id, { onDelete: 'restrict' }),
  branchId: uuid('branch_id').notNull().references(() => branches.id, { onDelete: 'restrict' }),
  status: orderStatusEnum('status').default('Pending').notNull(),
  paymentStatus: paymentStatusEnum('payment_status').default('Pending').notNull(),
  paymentMethod: paymentMethodEnum('payment_method'),
  upiSubMethod: upiSubMethodEnum('upi_sub_method'),
  upiApp: upiAppEnum('upi_app'),
  paymentReference: varchar('payment_reference', { length: 100 }),
  subtotalAmount: numeric('subtotal_amount', { precision: 12, scale: 2 }).notNull(),
  discountAmount: numeric('discount_amount', { precision: 12, scale: 2 }).default('0.00').notNull(),
  shippingFee: numeric('shipping_fee', { precision: 10, scale: 2 }).default('0.00').notNull(),
  taxAmount: numeric('tax_amount', { precision: 10, scale: 2 }).default('0.00').notNull(),
  totalAmount: numeric('total_amount', { precision: 12, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 10 }).default('INR').notNull(),
  customerNotes: text('customer_notes'),
  internalNotes: text('internal_notes'),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
  deletedAt: timestamp('deleted_at', { withTimezone: true, mode: 'string' }),
}, (table) => [
  index('idx_orders_user_id').on(table.userId),
  index('idx_orders_branch_id').on(table.branchId),
  index('idx_orders_status').on(table.status),
  index('idx_orders_payment_status').on(table.paymentStatus),
  index('idx_orders_created_at').on(table.createdAt),
]);

export const orderItems = pgTable('order_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  orderId: uuid('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  productId: uuid('product_id').notNull().references(() => products.id, { onDelete: 'restrict' }),
  quantity: integer('quantity').notNull(),
  unitMrp: numeric('unit_mrp', { precision: 10, scale: 2 }).notNull(),
  unitPrice: numeric('unit_price', { precision: 10, scale: 2 }).notNull(),
  discountPercent: numeric('discount_percent', { precision: 5, scale: 2 }).default('0.00').notNull(),
  totalPrice: numeric('total_price', { precision: 12, scale: 2 }).notNull(),
  titleSnapshot: varchar('title_snapshot', { length: 255 }).notNull(),
  isbnSnapshot: varchar('isbn_snapshot', { length: 30 }),
  skuSnapshot: varchar('sku_snapshot', { length: 50 }),
  publisherSnapshot: varchar('publisher_snapshot', { length: 150 }),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
  index('idx_order_items_order_id').on(table.orderId),
  index('idx_order_items_product_id').on(table.productId),
]);

export const orderShippingAddresses = pgTable('order_shipping_addresses', {
  id: uuid('id').defaultRandom().primaryKey(),
  orderId: uuid('order_id').notNull().unique().references(() => orders.id, { onDelete: 'cascade' }),
  recipientName: varchar('recipient_name', { length: 150 }).notNull(),
  recipientPhone: varchar('recipient_phone', { length: 20 }).notNull(),
  addressLine1: varchar('address_line1', { length: 255 }).notNull(),
  addressLine2: varchar('address_line2', { length: 255 }),
  landmark: varchar('landmark', { length: 150 }),
  city: varchar('city', { length: 100 }).notNull(),
  state: varchar('state', { length: 100 }).notNull(),
  pincode: varchar('pincode', { length: 10 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
});

export const orderStatusHistory = pgTable('order_status_history', {
  id: uuid('id').defaultRandom().primaryKey(),
  orderId: uuid('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  previousStatus: orderStatusEnum('previous_status'),
  newStatus: orderStatusEnum('new_status').notNull(),
  notes: text('notes'),
  changedById: uuid('changed_by_id').references(() => authUsers.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
  index('idx_order_status_history_order_id').on(table.orderId),
  index('idx_order_status_history_created_at').on(table.createdAt),
]);
