/**
 * ============================================================================
 * ABPS Book Distribution Platform — Staging Safe Seed Script
 * ============================================================================
 * PURPOSE: Seeds ONLY the foundational system roles required by the schema.
 *
 * SAFETY INVARIANTS:
 * - Seeds ONLY the 5 system roles: admin, branch_admin, warehouse, sales, customer.
 * - Idempotent via .onConflictDoNothing().
 * - NO user accounts, NO auth_users, NO customer/staff profiles.
 * - NO school branches, NO products, NO categories, NO inventory.
 * - NO suppliers, NO purchase orders, NO orders, NO payments.
 * - NO shipments, NO notifications, NO audit logs.
 * - ZERO synthetic or fictional business fixtures.
 * - Fails safely if DATABASE_URL is missing.
 * ============================================================================
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// 1. Load environment variables BEFORE importing database modules
const envLocalPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envLocalPath)) {
  dotenv.config({ path: envLocalPath });
}
dotenv.config();

if (!process.env.DATABASE_URL) {
  console.error('❌ Error: DATABASE_URL environment variable is not defined.');
  console.error('   Please provide DATABASE_URL in .env.local or execution environment.');
  process.exit(1);
}

const STAGING_ROLES = [
  {
    id: 'admin',
    name: 'Central Administrator',
    description: 'Full system-wide administrative access',
  },
  {
    id: 'branch_admin',
    name: 'Branch Administrator',
    description: 'School campus coordinator and branch order manager',
  },
  {
    id: 'warehouse',
    name: 'Warehouse Manager',
    description: 'Inventory stock, inward/outward logistics management',
  },
  {
    id: 'sales',
    name: 'Sales Representative',
    description: 'Institutional accounts and bulk quotation specialist',
  },
  {
    id: 'customer',
    name: 'School Staff / Teacher',
    description: 'Standard school staff ordering educational material',
  },
] as const;

async function seedStaging() {
  // 2. Dynamically import database client AFTER dotenv is evaluated
  const { db, client } = await import('../src/db');
  const { roles } = await import('../src/db/schema');

  console.log('🔒 Starting staging-safe seed (System Roles only)...');

  try {
    let processedCount = 0;

    for (const role of STAGING_ROLES) {
      await db.insert(roles).values(role).onConflictDoNothing();
      processedCount++;
    }

    console.log(`✅ Staging role seeding complete. Processed ${processedCount} system roles:`);
    for (const role of STAGING_ROLES) {
      console.log(`   - ${role.id}: ${role.name}`);
    }
  } catch (error) {
    console.error('❌ Error during staging seed:', error);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

seedStaging();
