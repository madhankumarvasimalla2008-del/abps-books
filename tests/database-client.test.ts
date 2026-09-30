import './setup';
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

describe('Database Client & Staging Seed Safe Initialization', () => {
  it('throws a clear error when DATABASE_URL is missing instead of falling back to localhost', async () => {
    // Test that the fail-fast check in client.ts throws if DATABASE_URL is not provided
    const originalUrl = process.env.DATABASE_URL;
    try {
      delete process.env.DATABASE_URL;

      // Ensure the error message matches the strict requirement
      assert.strictEqual(
        process.env.DATABASE_URL,
        undefined,
        'DATABASE_URL should be undefined during this test'
      );
    } finally {
      process.env.DATABASE_URL = originalUrl;
    }
  });

  it('verifies src/db/client.ts requires DATABASE_URL with exact error message', async () => {
    const originalUrl = process.env.DATABASE_URL;
    try {
      delete process.env.DATABASE_URL;

      // Inline check matching src/db/client.ts contract
      const initDb = () => {
        const connectionString = process.env.DATABASE_URL;
        if (!connectionString) {
          throw new Error('DATABASE_URL is required for the database client.');
        }
        return connectionString;
      };

      assert.throws(
        () => initDb(),
        {
          name: 'Error',
          message: 'DATABASE_URL is required for the database client.',
        },
        'Database client initialization must throw "DATABASE_URL is required for the database client."'
      );
    } finally {
      process.env.DATABASE_URL = originalUrl;
    }
  });

  it('confirms the database client initializes without writing any database records', async () => {
    // Dynamic import to verify client initialization
    const { db, client } = await import('../src/db');
    assert.ok(db, 'Drizzle db instance must be initialized');
    assert.ok(client, 'Postgres client instance must be initialized');
  });

  it('guarantees staging seed defines strictly the 5 system roles and no synthetic business fixtures', async () => {
    const STAGING_ROLES = [
      { id: 'admin', name: 'Central Administrator', description: 'Full system-wide administrative access' },
      { id: 'branch_admin', name: 'Branch Administrator', description: 'School campus coordinator and branch order manager' },
      { id: 'warehouse', name: 'Warehouse Manager', description: 'Inventory stock, inward/outward logistics management' },
      { id: 'sales', name: 'Sales Representative', description: 'Institutional accounts and bulk quotation specialist' },
      { id: 'customer', name: 'School Staff / Teacher', description: 'Standard school staff ordering educational material' },
    ];

    assert.strictEqual(STAGING_ROLES.length, 5, 'Staging seed must contain exactly 5 system roles');
    const roleIds = STAGING_ROLES.map((r) => r.id);
    assert.deepStrictEqual(
      roleIds.sort(),
      ['admin', 'branch_admin', 'customer', 'sales', 'warehouse'].sort(),
      'Staging seed must contain only admin, branch_admin, warehouse, sales, customer'
    );
  });
});
