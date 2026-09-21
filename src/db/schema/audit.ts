import { pgTable, uuid, varchar, jsonb, timestamp, index } from 'drizzle-orm/pg-core';
import { authUsers } from './identity';
import { branches } from './business';

/**
 * Audit Logs Table
 * Immutable, append-only security ledger of business operations, administrative changes,
 * and security events across all ABPS operational domains.
 */
export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  actorId: uuid('actor_id').references(() => authUsers.id, { onDelete: 'set null' }),
  actorEmail: varchar('actor_email', { length: 255 }),
  actorRole: varchar('actor_role', { length: 50 }),
  action: varchar('action', { length: 100 }).notNull(),
  entityType: varchar('entity_type', { length: 100 }).notNull(),
  entityId: varchar('entity_id', { length: 255 }),
  branchId: uuid('branch_id').references(() => branches.id, { onDelete: 'set null' }),
  details: jsonb('details').$type<Record<string, unknown>>(),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: varchar('user_agent', { length: 512 }),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
  index('idx_audit_logs_created_at').on(table.createdAt),
  index('idx_audit_logs_actor_id').on(table.actorId),
  index('idx_audit_logs_entity_type').on(table.entityType),
  index('idx_audit_logs_entity_id').on(table.entityId),
  index('idx_audit_logs_branch_id').on(table.branchId),
  index('idx_audit_logs_action').on(table.action),
]);
