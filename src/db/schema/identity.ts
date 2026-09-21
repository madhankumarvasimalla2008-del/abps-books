import { pgTable, uuid, varchar, text, boolean, timestamp, primaryKey, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { branches } from './business';

/**
 * auth_users: Business-side user identity reference.
 * Note: Authentication credentials (passwords, tokens) are managed by the auth provider
 * (e.g. Supabase Auth) and are strictly NOT stored in this business table.
 */
export const authUsers = pgTable('auth_users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  phone: varchar('phone', { length: 20 }),
  fullName: varchar('full_name', { length: 150 }).notNull(),
  avatarUrl: varchar('avatar_url', { length: 512 }),
  isActive: boolean('is_active').default(true).notNull(),
  emailVerifiedAt: timestamp('email_verified_at', { withTimezone: true, mode: 'string' }),
  phoneVerifiedAt: timestamp('phone_verified_at', { withTimezone: true, mode: 'string' }),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
  deletedAt: timestamp('deleted_at', { withTimezone: true, mode: 'string' }),
}, (table) => [
  index('idx_auth_users_phone').on(table.phone),
]);

export const roles = pgTable('roles', {
  id: varchar('id', { length: 50 }).primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
});

export const userRoles = pgTable('user_roles', {
  userId: uuid('user_id').notNull().references(() => authUsers.id, { onDelete: 'cascade' }),
  roleId: varchar('role_id', { length: 50 }).notNull().references(() => roles.id, { onDelete: 'cascade' }),
  assignedAt: timestamp('assigned_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
  primaryKey({ columns: [table.userId, table.roleId] }),
]);

export const customerProfiles = pgTable('customer_profiles', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().unique().references(() => authUsers.id, { onDelete: 'cascade' }),
  defaultBranchId: uuid('default_branch_id').references(() => branches.id, { onDelete: 'set null' }),
  designation: varchar('designation', { length: 100 }),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
});

export const staffProfiles = pgTable('staff_profiles', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().unique().references(() => authUsers.id, { onDelete: 'cascade' }),
  assignedBranchId: uuid('assigned_branch_id').references(() => branches.id, { onDelete: 'set null' }),
  department: varchar('department', { length: 100 }),
  employeeCode: varchar('employee_code', { length: 50 }).unique(),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
});
