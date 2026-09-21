import { z } from 'zod';
import { baseFilterSchema, moneyAmountSchema, phoneSchema } from './common';
import { paymentMethodSchema, paymentStatusSchema, upiAppSchema, upiSubMethodSchema } from './orders';

export const initiatePaymentSchema = z.object({
  orderId: z.string().uuid('Valid order ID is required'),
  amount: moneyAmountSchema,
  paymentMethod: paymentMethodSchema,
  upiSubMethod: upiSubMethodSchema.optional(),
  upiApp: upiAppSchema.optional(),
  payerVpa: z.string().trim().max(150).optional(),
  payerPhone: phoneSchema.optional(),
  idempotencyKey: z.string().trim().max(100).optional(),
  notes: z.string().trim().optional(),
});

export const recordPaymentResultSchema = z.object({
  paymentId: z.string().uuid('Valid payment ID is required'),
  status: paymentStatusSchema,
  gatewayPaymentId: z.string().trim().max(150).optional(),
  gatewayOrderId: z.string().trim().max(150).optional(),
  gatewaySignature: z.string().trim().max(255).optional(),
  failureReason: z.string().trim().optional(),
  receiptNumber: z.string().trim().max(100).optional(),
  notes: z.string().trim().optional(),
});

export const refundReasonSchema = z.enum([
  'Damaged during transit',
  'Wrong title delivered',
  'Excess quantity',
  'Syllabus change',
  'Order cancellation',
  'Damaged press copies',
  'Syllabus surplus return',
]);

export const requestRefundSchema = z.object({
  paymentId: z.string().uuid('Valid payment ID is required'),
  orderId: z.string().uuid('Valid order ID is required'),
  amount: moneyAmountSchema,
  reason: refundReasonSchema,
  notes: z.string().trim().optional(),
});

export const verifyPaymentSchema = recordPaymentResultSchema;
export const refundPaymentSchema = requestRefundSchema;

export const paymentFilterSchema = baseFilterSchema.extend({
  orderId: z.string().uuid().optional(),
  status: paymentStatusSchema.optional(),
  paymentMethod: paymentMethodSchema.optional(),
});

export type InitiatePaymentInput = z.infer<typeof initiatePaymentSchema>;
export type RecordPaymentResultInput = z.infer<typeof recordPaymentResultSchema>;
export type VerifyPaymentInput = z.infer<typeof verifyPaymentSchema>;
export type RequestRefundInput = z.infer<typeof requestRefundSchema>;
export type RefundPaymentInput = z.infer<typeof refundPaymentSchema>;
export type PaymentFilterInput = z.infer<typeof paymentFilterSchema>;
