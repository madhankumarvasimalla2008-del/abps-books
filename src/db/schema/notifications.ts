import { pgTable, uuid, varchar, text, boolean, timestamp, index } from 'drizzle-orm/pg-core';
import { notificationTypeEnum, notificationSeverityEnum } from './enums';
import { authUsers } from './identity';

export const notifications = pgTable('notifications', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => authUsers.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  message: text('message').notNull(),
  type: notificationTypeEnum('type').default('system').notNull(),
  severity: notificationSeverityEnum('severity').default('info').notNull(),
  actionUrl: varchar('action_url', { length: 512 }),
  isRead: boolean('is_read').default(false).notNull(),
  readAt: timestamp('read_at', { withTimezone: true, mode: 'string' }),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
  index('idx_notifications_user_id').on(table.userId),
  index('idx_notifications_is_read').on(table.isRead),
  index('idx_notifications_created_at').on(table.createdAt),
]);
