import { pgTable, uuid, varchar, text, integer, boolean, numeric, timestamp, index } from 'drizzle-orm/pg-core';
import { productStatusEnum } from './enums';

export const categories = pgTable('categories', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 150 }).notNull(),
  slug: varchar('slug', { length: 150 }).notNull().unique(),
  description: text('description'),
  gradeLevels: text('grade_levels').array().default([]).notNull(),
  displayOrder: integer('display_order').default(0).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
});

export const products = pgTable('products', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  isbn: varchar('isbn', { length: 30 }).notNull(),
  sku: varchar('sku', { length: 50 }).notNull().unique(),
  categoryId: uuid('category_id').notNull().references(() => categories.id, { onDelete: 'restrict' }),
  publisher: varchar('publisher', { length: 150 }).notNull(),
  author: varchar('author', { length: 200 }).notNull(),
  edition: varchar('edition', { length: 50 }).notNull(),
  academicYear: varchar('academic_year', { length: 20 }).notNull(),
  grade: varchar('grade', { length: 50 }).notNull(),
  subject: varchar('subject', { length: 100 }).notNull(),
  description: text('description'),
  coverImageUrl: varchar('cover_image_url', { length: 512 }),
  language: varchar('language', { length: 50 }).default('English').notNull(),
  pages: integer('pages'),
  weightGrams: integer('weight_grams').default(300).notNull(),
  mrp: numeric('mrp', { precision: 10, scale: 2 }).notNull(),
  sellingPrice: numeric('selling_price', { precision: 10, scale: 2 }).notNull(),
  bulkDiscountPercent: numeric('bulk_discount_percent', { precision: 5, scale: 2 }).default('0.00').notNull(),
  bulkThreshold: integer('bulk_threshold').default(0).notNull(),
  isFeatured: boolean('is_featured').default(false).notNull(),
  isAbpsApproved: boolean('is_abps_approved').default(true).notNull(),
  status: productStatusEnum('status').default('in_stock').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
  deletedAt: timestamp('deleted_at', { withTimezone: true, mode: 'string' }),
}, (table) => [
  index('idx_products_isbn').on(table.isbn),
  index('idx_products_grade_subject').on(table.grade, table.subject),
  index('idx_products_category_id').on(table.categoryId),
]);
