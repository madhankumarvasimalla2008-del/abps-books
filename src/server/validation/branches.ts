import { z } from 'zod';
import { baseFilterSchema, emailSchema, phoneSchema } from './common';

export const branchZoneSchema = z.enum(['North', 'South', 'East', 'West', 'Central']);
export const branchStatusSchema = z.enum(['active', 'inactive']);

export const createBranchSchema = z.object({
  code: z.string().trim().min(2, 'Code is required').max(30),
  name: z.string().trim().min(2, 'Branch name is required').max(200),
  addressLine1: z.string().trim().min(1, 'Address line 1 is required').max(255),
  addressLine2: z.string().trim().max(255).optional(),
  city: z.string().trim().min(1, 'City is required').max(100),
  state: z.string().trim().min(1, 'State is required').max(100),
  pincode: z.string().trim().min(5, 'Valid pincode required').max(10),
  zone: branchZoneSchema,
  contactEmail: emailSchema,
  contactPhone: phoneSchema,
  status: branchStatusSchema.default('active'),
});

export const updateBranchSchema = createBranchSchema.partial();

export const branchFilterSchema = baseFilterSchema.extend({
  zone: branchZoneSchema.optional(),
  state: z.string().trim().optional(),
  status: branchStatusSchema.optional(),
});

export type CreateBranchInput = z.infer<typeof createBranchSchema>;
export type UpdateBranchInput = z.infer<typeof updateBranchSchema>;
export type BranchFilterInput = z.infer<typeof branchFilterSchema>;
