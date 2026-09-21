import { pgTable, uuid, integer, varchar, timestamp, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { inventoryMovementTypeEnum } from './enums';
import { branches } from './business';
import { products } from './catalog';
import { authUsers } from './identity';

export const inventory = pgTable('inventory', {
  id: uuid('id').defaultRandom().primaryKey(),
  branchId: uuid('branch_id').notNull().references(() => branches.id, { onDelete: 'cascade' }),
  productId: uuid('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  quantityOnHand: integer('quantity_on_hand').default(0).notNull(),
  reservedQuantity: integer('reserved_quantity').default(0).notNull(),
  reorderThreshold: integer('reorder_threshold').default(10).notNull(),
  aisleLocation: varchar('aisle_location', { length: 50 }),
  rackLocation: varchar('rack_location', { length: 50 }),
  shelfLocation: varchar('shelf_location', { length: 50 }),
  binLocation: varchar('bin_location', { length: 50 }),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
  uniqueIndex('idx_inventory_branch_product').on(table.branchId, table.productId),
  index('idx_inventory_product_id').on(table.productId),
  index('idx_inventory_branch_id').on(table.branchId),
]);

export const inventoryMovements = pgTable('inventory_movements', {
  id: uuid('id').defaultRandom().primaryKey(),
  inventoryId: uuid('inventory_id').references(() => inventory.id, { onDelete: 'set null' }),
  branchId: uuid('branch_id').notNull().references(() => branches.id, { onDelete: 'restrict' }),
  productId: uuid('product_id').notNull().references(() => products.id, { onDelete: 'restrict' }),
  movementType: inventoryMovementTypeEnum('movement_type').notNull(),
  quantity: integer('quantity').notNull(),
  previousQuantity: integer('previous_quantity').notNull(),
  newQuantity: integer('new_quantity').notNull(),
  referenceType: varchar('reference_type', { length: 50 }).notNull(),
  referenceId: varchar('reference_id', { length: 100 }),
  notes: varchar('notes', { length: 500 }),
  performedBy: uuid('performed_by').references(() => authUsers.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
  index('idx_inventory_movements_branch_product').on(table.branchId, table.productId),
  index('idx_inventory_movements_created_at').on(table.createdAt),
  index('idx_inventory_movements_ref').on(table.referenceType, table.referenceId),
]);
