import { pgTable, uuid, varchar, text, timestamp, index } from 'drizzle-orm/pg-core';
import { shipmentStatusEnum } from './enums';
import { orders } from './orders';
import { branches } from './business';

export const shipments = pgTable('shipments', {
  id: uuid('id').defaultRandom().primaryKey(),
  orderId: uuid('order_id').notNull().references(() => orders.id, { onDelete: 'restrict' }),
  trackingNumber: varchar('tracking_number', { length: 100 }).notNull().unique(),
  carrier: varchar('carrier', { length: 100 }).notNull(),
  status: shipmentStatusEnum('status').default('Created').notNull(),
  originBranchId: uuid('origin_branch_id').references(() => branches.id, { onDelete: 'set null' }),
  destinationAddress: text('destination_address').notNull(),
  estimatedDeliveryDate: timestamp('estimated_delivery_date', { withTimezone: true, mode: 'string' }),
  actualDeliveryDate: timestamp('actual_delivery_date', { withTimezone: true, mode: 'string' }),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
  index('idx_shipments_order_id').on(table.orderId),
  index('idx_shipments_status').on(table.status),
  index('idx_shipments_tracking_number').on(table.trackingNumber),
]);

export const shipmentMilestones = pgTable('shipment_milestones', {
  id: uuid('id').defaultRandom().primaryKey(),
  shipmentId: uuid('shipment_id').notNull().references(() => shipments.id, { onDelete: 'cascade' }),
  status: shipmentStatusEnum('status').notNull(),
  location: varchar('location', { length: 150 }),
  description: text('description').notNull(),
  occurredAt: timestamp('occurred_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
  index('idx_shipment_milestones_shipment_id').on(table.shipmentId),
  index('idx_shipment_milestones_occurred_at').on(table.occurredAt),
]);
