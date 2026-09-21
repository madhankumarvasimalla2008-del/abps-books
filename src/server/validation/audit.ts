import { z } from 'zod';
import { baseFilterSchema } from './common';

export const createAuditLogSchema = z.object({
  actorId: z.string().uuid({ message: 'Invalid actor UUID format' }).optional().nullable(),
  actorEmail: z.string().email().optional().nullable(),
  actorRole: z.string().trim().max(50).optional().nullable(),
  action: z.string().trim().min(1, { message: 'Action is required' }).max(100),
  entityType: z.string().trim().min(1, { message: 'Entity type is required' }).max(100),
  entityId: z.string().trim().max(255).optional().nullable(),
  branchId: z.string().uuid({ message: 'Invalid branch UUID format' }).optional().nullable(),
  details: z.record(z.string(), z.unknown()).optional().nullable(),
  ipAddress: z.string().trim().max(45).optional().nullable(),
  userAgent: z.string().trim().max(512).optional().nullable(),
});

export const auditLogFilterSchema = baseFilterSchema.extend({
  actorId: z.string().uuid().optional(),
  action: z.string().trim().optional(),
  entityType: z.string().trim().optional(),
  entityId: z.string().trim().optional(),
  branchId: z.string().uuid().optional(),
  startDate: z.string().trim().optional(),
  endDate: z.string().trim().optional(),
});

export type CreateAuditLogInput = z.infer<typeof createAuditLogSchema>;
export type AuditLogFilterInput = z.infer<typeof auditLogFilterSchema>;
