import { z } from 'zod';
import { baseFilterSchema, nonNegativeIntegerSchema } from './common';

export const createCategorySchema = z.object({
  name: z.string().trim().min(1, 'Category name is required').max(150),
  slug: z.string().trim().min(1, 'Slug is required').max(150).regex(/^[a-z0-9-]+$/, 'Slug must be alphanumeric with dashes'),
  description: z.string().trim().optional(),
  gradeLevels: z.array(z.string().trim()).default([]),
  displayOrder: nonNegativeIntegerSchema.default(0),
  isActive: z.boolean().default(true),
});

export const updateCategorySchema = createCategorySchema.partial();

export const categoryFilterSchema = baseFilterSchema.extend({
  isActive: z.enum(['true', 'false']).transform((v) => v === 'true').optional(),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type CategoryFilterInput = z.infer<typeof categoryFilterSchema>;
