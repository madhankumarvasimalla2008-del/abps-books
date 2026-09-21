import { z } from 'zod';

export const uuidParamSchema = z.object({
  id: z.string().uuid({ message: 'Invalid UUID format' }),
});

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const baseFilterSchema = paginationQuerySchema.extend({
  search: z.string().trim().optional(),
  sortBy: z.string().trim().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const moneyAmountSchema = z.coerce
  .number()
  .min(0, { message: 'Monetary amount must be non-negative' });

export const positiveIntegerSchema = z.coerce
  .number()
  .int()
  .min(1, { message: 'Must be a positive integer' });

export const nonNegativeIntegerSchema = z.coerce
  .number()
  .int()
  .min(0, { message: 'Must be a non-negative integer' });

export const phoneSchema = z
  .string()
  .trim()
  .min(7, { message: 'Phone number too short' })
  .max(20, { message: 'Phone number too long' });

export const emailSchema = z
  .string()
  .trim()
  .email({ message: 'Invalid email address' })
  .toLowerCase();
