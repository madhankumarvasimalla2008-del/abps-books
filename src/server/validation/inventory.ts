import { z } from 'zod';
import { baseFilterSchema, nonNegativeIntegerSchema } from './common';

export const inventoryMovementTypeSchema = z.enum([
  'Inward (PO)',
  'Outward (Order)',
  'Stock Adjustment',
  'Damaged/Scrap',
  'Branch Return',
]);

export const adjustInventorySchema = z.object({
  branchId: z.string().uuid('Valid branch ID is required'),
  productId: z.string().uuid('Valid product ID is required'),
  quantityDelta: z.coerce.number().int().refine((val) => val !== 0, 'Quantity delta cannot be zero'),
  movementType: inventoryMovementTypeSchema,
  referenceType: z.string().trim().min(1, 'Reference type is required').max(50),
  referenceId: z.string().trim().max(100).optional(),
  notes: z.string().trim().max(500).optional(),
  performedBy: z.string().uuid().optional(),
});

export const inventoryFilterSchema = baseFilterSchema.extend({
  branchId: z.string().uuid().optional(),
  productId: z.string().uuid().optional(),
  lowStockOnly: z.enum(['true', 'false']).transform((v) => v === 'true').optional(),
});

export const movementFilterSchema = baseFilterSchema.extend({
  branchId: z.string().uuid().optional(),
  productId: z.string().uuid().optional(),
  movementType: inventoryMovementTypeSchema.optional(),
  referenceType: z.string().trim().optional(),
});

export type AdjustInventoryInput = z.infer<typeof adjustInventorySchema>;
export type InventoryFilterInput = z.infer<typeof inventoryFilterSchema>;
export type MovementFilterInput = z.infer<typeof movementFilterSchema>;
