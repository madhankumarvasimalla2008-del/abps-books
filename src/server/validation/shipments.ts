import { z } from 'zod';
import { baseFilterSchema } from './common';

export const shipmentStatusSchema = z.enum([
  'Created',
  'In Transit',
  'Out for Delivery',
  'Delivered',
  'Returned',
  'Delayed',
]);

export const createShipmentSchema = z.object({
  orderId: z.string().uuid('Valid order ID is required'),
  carrier: z.string().trim().min(1, 'Carrier name is required').max(100),
  trackingNumber: z.string().trim().min(1, 'Tracking number is required').max(100),
  originBranchId: z.string().uuid().optional(),
  destinationAddress: z.string().trim().min(1, 'Destination address is required'),
  estimatedDeliveryDate: z.string().datetime().optional(),
  notes: z.string().trim().optional(),
});

export const updateShipmentStatusSchema = z.object({
  status: shipmentStatusSchema,
  location: z.string().trim().max(150).optional(),
  description: z.string().trim().min(1, 'Milestone description is required'),
  notes: z.string().trim().optional(),
});

export const shipmentFilterSchema = baseFilterSchema.extend({
  orderId: z.string().uuid().optional(),
  carrier: z.string().trim().optional(),
  status: shipmentStatusSchema.optional(),
  originBranchId: z.string().uuid().optional(),
});

export type CreateShipmentInput = z.infer<typeof createShipmentSchema>;
export type UpdateShipmentStatusInput = z.infer<typeof updateShipmentStatusSchema>;
export type ShipmentFilterInput = z.infer<typeof shipmentFilterSchema>;
