import { z } from 'zod';
import { baseFilterSchema, moneyAmountSchema, nonNegativeIntegerSchema, positiveIntegerSchema } from './common';

export const productStatusSchema = z.enum(['in_stock', 'low_stock', 'out_of_stock', 'discontinued']);

export const createProductSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(255),
  isbn: z.string().trim().min(5, 'ISBN is required').max(30),
  sku: z.string().trim().min(3, 'SKU is required').max(50),
  categoryId: z.string().uuid('Valid category ID is required'),
  publisher: z.string().trim().min(1, 'Publisher is required').max(150),
  author: z.string().trim().min(1, 'Author is required').max(200),
  edition: z.string().trim().min(1, 'Edition is required').max(50),
  academicYear: z.string().trim().min(1, 'Academic year is required').max(20),
  grade: z.string().trim().min(1, 'Grade is required').max(50),
  subject: z.string().trim().min(1, 'Subject is required').max(100),
  description: z.string().trim().optional(),
  coverImageUrl: z.string().trim().url('Must be a valid URL').optional().or(z.literal('')),
  language: z.string().trim().default('English'),
  pages: positiveIntegerSchema.optional(),
  weightGrams: positiveIntegerSchema.default(300),
  mrp: moneyAmountSchema,
  sellingPrice: moneyAmountSchema,
  bulkDiscountPercent: z.coerce.number().min(0).max(100).default(0),
  bulkThreshold: nonNegativeIntegerSchema.default(0),
  isFeatured: z.boolean().default(false),
  isAbpsApproved: z.boolean().default(true),
  status: productStatusSchema.default('in_stock'),
});

export const updateProductSchema = createProductSchema.partial();

export const productFilterSchema = baseFilterSchema.extend({
  categoryId: z.string().uuid().optional(),
  grade: z.string().trim().optional(),
  subject: z.string().trim().optional(),
  status: productStatusSchema.optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  isFeatured: z.union([z.boolean(), z.enum(['true', 'false']).transform((v) => v === 'true')]).optional(),
  isAbpsApproved: z.union([z.boolean(), z.enum(['true', 'false']).transform((v) => v === 'true')]).optional(),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type ProductFilterInput = z.infer<typeof productFilterSchema>;
