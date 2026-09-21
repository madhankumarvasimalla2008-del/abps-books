import { z } from 'zod';
import { baseFilterSchema, emailSchema, phoneSchema } from './common';

export const customerStatusSchema = z.enum(['active', 'inactive', 'blocked']);

export const createCustomerSchema = z.object({
  fullName: z.string().trim().min(1, 'Full name is required').max(150),
  email: emailSchema,
  phone: phoneSchema,
  parentName: z.string().trim().max(150).optional(),
  studentGrade: z.string().trim().max(50).optional(),
  studentSection: z.string().trim().max(20).optional(),
  preferredBranchId: z.string().uuid('Valid branch ID is required').optional(),
  notes: z.string().trim().optional(),
});

export const updateCustomerSchema = createCustomerSchema.partial().extend({
  status: customerStatusSchema.optional(),
});

export const customerAddressInputSchema = z.object({
  title: z.string().trim().max(100).optional(),
  label: z.string().trim().max(100).optional(),
  recipientName: z.string().trim().min(1, 'Recipient name is required').max(150),
  phone: phoneSchema.optional(),
  recipientPhone: phoneSchema.optional(),
  addressLine1: z.string().trim().min(1, 'Address line 1 is required').max(255),
  addressLine2: z.string().trim().max(255).optional(),
  landmark: z.string().trim().max(150).optional(),
  city: z.string().trim().min(1, 'City is required').max(100),
  state: z.string().trim().min(1, 'State is required').max(100),
  pincode: z.string().trim().min(5, 'Valid pincode required').max(10),
  addressType: z.enum(['home', 'school', 'office', 'other']).default('home'),
  isDefault: z.boolean().default(false),
});
export const customerAddressSchema = customerAddressInputSchema;
export const updateCustomerAddressSchema = customerAddressInputSchema.partial();

export const customerFilterSchema = baseFilterSchema.extend({
  status: customerStatusSchema.optional(),
  branchId: z.string().uuid().optional(),
  grade: z.string().trim().optional(),
});

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
export type CustomerAddressInput = z.infer<typeof customerAddressInputSchema>;
export type UpdateCustomerAddressInput = z.infer<typeof updateCustomerAddressSchema>;
export type CustomerFilterInput = z.infer<typeof customerFilterSchema>;
