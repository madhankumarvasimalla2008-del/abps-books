import { z } from 'zod';

export const notificationTypeEnum = z.enum([
  'order',
  'inventory',
  'shipment',
  'payment',
  'system',
]);

export const notificationSeverityEnum = z.enum([
  'info',
  'warning',
  'success',
  'danger',
]);

export const createNotificationSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  title: z.string().min(1, 'Title is required').max(255, 'Title too long'),
  message: z.string().min(1, 'Message is required').max(5000, 'Message too long'),
  type: notificationTypeEnum.default('system'),
  severity: notificationSeverityEnum.default('info'),
  actionUrl: z.string().max(512).optional().nullable(),
});

export const updateNotificationSchema = z.object({
  isRead: z.boolean().optional(),
});

export const notificationFilterSchema = z.object({
  userId: z.string().uuid().optional(),
  type: notificationTypeEnum.optional(),
  severity: notificationSeverityEnum.optional(),
  isRead: z
    .union([z.boolean(), z.string()])
    .optional()
    .transform((val) => {
      if (typeof val === 'string') {
        if (val === 'true') return true;
        if (val === 'false') return false;
      }
      return val as boolean | undefined;
    }),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.enum(['createdAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type CreateNotificationInput = z.infer<typeof createNotificationSchema>;
export type UpdateNotificationInput = z.infer<typeof updateNotificationSchema>;
export type NotificationFilterInput = z.infer<typeof notificationFilterSchema>;
