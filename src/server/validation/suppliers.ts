import { z } from 'zod';
import { baseFilterSchema, emailSchema, phoneSchema } from './common';

export const supplierStatusSchema = z.enum(['active', 'inactive']);

export const createSupplierSchema = z.object({
  name: z.string().trim().min(2, 'Supplier name is required').max(200),
  contactPerson: z.string().trim().min(2, 'Contact person is required').max(150),
  email: emailSchema,
  phone: phoneSchema,
  addressLine1: z.string().trim().min(1, 'Address line 1 is required').max(255),
  addressLine2: z.string().trim().max(255).optional(),
  city: z.string().trim().min(1, 'City is required').max(100),
  state: z.string().trim().min(1, 'State is required').max(100),
  pincode: z.string().trim().min(5, 'Valid pincode required').max(10),
  gstNumber: z.string().trim().max(20).optional(),
  paymentTerms: z.string().trim().max(100).default('Net 30 Days'),
  status: supplierStatusSchema.default('active'),
});

export const updateSupplierSchema = createSupplierSchema.partial();

export const supplierFilterSchema = baseFilterSchema.extend({
  status: supplierStatusSchema.optional(),
  city: z.string().trim().optional(),
  state: z.string().trim().optional(),
});

export type CreateSupplierInput = z.infer<typeof createSupplierSchema>;
export type UpdateSupplierInput = z.infer<typeof updateSupplierSchema>;
export type SupplierFilterInput = z.infer<typeof supplierFilterSchema>;
