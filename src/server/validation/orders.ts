import { z } from 'zod';
import { baseFilterSchema, moneyAmountSchema, phoneSchema, positiveIntegerSchema } from './common';

export const orderStatusSchema = z.enum([
  'Pending',
  'Confirmed',
  'Processing',
  'Packed',
  'Shipped',
  'Out for Delivery',
  'Delivered',
  'Cancelled',
]);

export const paymentStatusSchema = z.enum([
  'Pending',
  'Processing',
  'Paid',
  'Partial',
  'Failed',
  'Cancelled',
  'Expired',
  'Refunded',
  'Partially Refunded',
]);

export const paymentMethodSchema = z.enum(['UPI', 'Card', 'Net Banking', 'Wallet', 'Manual Payment']);
export const upiSubMethodSchema = z.enum(['intent', 'qr', 'collect']);
export const upiAppSchema = z.enum(['phonepe', 'gpay', 'bhim', 'paytm', 'other']);

export const orderItemInputSchema = z.object({
  productId: z.string().uuid('Valid product ID is required'),
  quantity: positiveIntegerSchema,
});

export const orderShippingAddressInputSchema = z.object({
  recipientName: z.string().trim().min(1, 'Recipient name is required').max(150),
  recipientPhone: phoneSchema,
  addressLine1: z.string().trim().min(1, 'Address line 1 is required').max(255),
  addressLine2: z.string().trim().max(255).optional(),
  landmark: z.string().trim().max(150).optional(),
  city: z.string().trim().min(1, 'City is required').max(100),
  state: z.string().trim().min(1, 'State is required').max(100),
  pincode: z.string().trim().min(5, 'Valid pincode required').max(10),
});

export const createOrderSchema = z.object({
  userId: z.string().uuid('Valid customer user ID is required'),
  branchId: z.string().uuid('Valid branch ID is required'),
  items: z.array(orderItemInputSchema).min(1, 'At least one item is required'),
  shippingAddress: orderShippingAddressInputSchema,
  paymentMethod: paymentMethodSchema.default('Manual Payment'),
  upiSubMethod: upiSubMethodSchema.optional(),
  upiApp: upiAppSchema.optional(),
  paymentReference: z.string().trim().max(100).optional(),
  customerNotes: z.string().trim().optional(),
  internalNotes: z.string().trim().optional(),
});

export const updateOrderStatusSchema = z.object({
  status: orderStatusSchema,
  notes: z.string().trim().optional(),
  changedById: z.string().uuid().optional(),
});

export const orderFilterSchema = baseFilterSchema.extend({
  userId: z.string().uuid().optional(),
  branchId: z.string().uuid().optional(),
  status: orderStatusSchema.optional(),
  paymentStatus: paymentStatusSchema.optional(),
  fromDate: z.string().datetime().optional(),
  toDate: z.string().datetime().optional(),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
export type OrderFilterInput = z.infer<typeof orderFilterSchema>;
