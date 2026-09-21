import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/abps_books';

// Disable prefetch as it is not supported for "Transaction" pool mode if using PgBouncer / Supabase transaction pooler
export const client = postgres(connectionString, {
  prepare: false,
  max: process.env.NODE_ENV === 'production' ? 20 : 5,
});

export const db = drizzle(client, { schema });

export type Database = typeof db;
