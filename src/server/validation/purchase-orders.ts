import { z } from 'zod';
import { baseFilterSchema, moneyAmountSchema, positiveIntegerSchema } from './common';

export const poStatusSchema = z.enum([
  'Draft',
  'Sent',
  'Partially Received',
  'Completed',
  'Cancelled',
]);

export const poItemInputSchema = z.object({
  productId: z.string().uuid('Valid product ID is required'),
  quantityOrdered: positiveIntegerSchema,
  unitCost: moneyAmountSchema,
});

export const createPurchaseOrderSchema = z.object({
  supplierId: z.string().uuid('Valid supplier ID is required'),
  targetBranchId: z.string().uuid('Valid branch ID is required'),
  expectedDeliveryDate: z.string().datetime().optional(),
  notes: z.string().trim().optional(),
  items: z.array(poItemInputSchema).min(1, 'At least one item is required'),
});

export const updatePurchaseOrderStatusSchema = z.object({
  status: poStatusSchema,
});

export const receivePoItemsSchema = z.object({
  receiptNumber: z.string().trim().max(50).optional(),
  notes: z.string().trim().optional(),
  items: z.array(
    z.object({
      itemId: z.string().uuid('Valid PO item ID is required'),
      quantityReceived: positiveIntegerSchema,
    })
  ).min(1, 'At least one item must be received'),
});

export const poFilterSchema = baseFilterSchema.extend({
  supplierId: z.string().uuid().optional(),
  branchId: z.string().uuid().optional(),
  status: poStatusSchema.optional(),
});

export type CreatePurchaseOrderInput = z.infer<typeof createPurchaseOrderSchema>;
export type UpdatePurchaseOrderStatusInput = z.infer<typeof updatePurchaseOrderStatusSchema>;
export type ReceivePoItemsInput = z.infer<typeof receivePoItemsSchema>;
export type PoFilterInput = z.infer<typeof poFilterSchema>;
