import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { requireAuth, requireRole, requireBranchAccess, extractAuthContext } from '../src/server/auth/guard';
import { resolveOrCreateAuthUser, resolveAuthContextFromRequest } from '../src/server/auth/session';
import { UnauthorizedError, ForbiddenError } from '../src/server/errors';
import { authUsers } from '../src/db/schema/identity';
import { getTableColumns } from 'drizzle-orm';
import { db } from '../src/db';
import type { User as SupabaseUser } from '@supabase/supabase-js';

describe('Phase 5.4: Supabase Authentication & Secure Session Integration', () => {
  // --------------------------------------------------------------------------
  // 1. Password Absence Guarantee in PostgreSQL Schema
  // --------------------------------------------------------------------------
  describe('PostgreSQL Schema Credential Security', () => {
    it('strictly guarantees no password or password hash columns exist in auth_users', () => {
      const columns = getTableColumns(authUsers);
      const columnNames = Object.keys(columns);

      const forbiddenColumnPatterns = [
        'password',
        'password_hash',
        'passwordhash',
        'encrypted_password',
        'salt',
        'secret',
        'token',
      ];

      for (const pattern of forbiddenColumnPatterns) {
        const found = columnNames.filter((col) => col.toLowerCase().includes(pattern));
        assert.deepStrictEqual(
          found,
          [],
          `Found forbidden credential column '${found.join(', ')}' in PostgreSQL schema. Supabase Auth must own all credentials.`
        );
      }
    });
  });

  // --------------------------------------------------------------------------
  // 2. Authentication and Authorization Guards
  // --------------------------------------------------------------------------
  describe('RBAC Guards and Role Hierarchy', () => {
    it('throws UnauthorizedError (401) when requireAuth is called with null or empty context', () => {
      assert.throws(
        () => requireAuth(null),
        UnauthorizedError,
        'requireAuth(null) must throw UnauthorizedError'
      );
      assert.throws(
        () => requireAuth(undefined),
        UnauthorizedError,
        'requireAuth(undefined) must throw UnauthorizedError'
      );
    });

    it('passes requireAuth when valid authenticated context is provided', () => {
      const ctx = {
        userId: '11111111-1111-1111-1111-111111111111',
        email: 'admin@birlabooks.in',
        role: 'admin' as const,
        branchId: null,
        isStaff: true,
      };
      const result = requireAuth(ctx);
      assert.strictEqual(result.userId, ctx.userId);
      assert.strictEqual(result.role, 'admin');
    });

    it('throws ForbiddenError (403) when user role lacks required permissions', () => {
      const customerCtx = {
        userId: '22222222-2222-2222-2222-222222222222',
        email: 'customer@example.com',
        role: 'customer' as const,
        branchId: null,
        isStaff: false,
      };

      assert.throws(
        () => requireRole(customerCtx, ['admin', 'branch_admin']),
        ForbiddenError,
        'requireRole must throw ForbiddenError when customer attempts admin action'
      );
    });

    it('allows access when user role matches allowed roles', () => {
      const adminCtx = {
        userId: '11111111-1111-1111-1111-111111111111',
        email: 'admin@birlabooks.in',
        role: 'admin' as const,
        branchId: null,
        isStaff: true,
      };

      assert.doesNotThrow(() => requireRole(adminCtx, ['admin', 'branch_admin']));
    });
  });

  // --------------------------------------------------------------------------
  // 3. Multi-Tenant Branch Scoping
  // --------------------------------------------------------------------------
  describe('Multi-Tenant Branch Access Controls', () => {
    const branchA = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
    const branchB = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

    it('central admin has universal access to all branches', () => {
      const adminCtx = {
        userId: '11111111-1111-1111-1111-111111111111',
        email: 'admin@birlabooks.in',
        role: 'admin' as const,
        branchId: null,
        isStaff: true,
      };

      assert.doesNotThrow(() => requireBranchAccess(adminCtx, branchA));
      assert.doesNotThrow(() => requireBranchAccess(adminCtx, branchB));
    });

    it('branch admin is strictly constrained to their assigned branch', () => {
      const branchAdminCtx = {
        userId: '33333333-3333-3333-3333-333333333333',
        email: 'branchadmin@abps.edu',
        role: 'branch_admin' as const,
        branchId: branchA,
        isStaff: true,
      };

      // Permitted for assigned branch
      assert.doesNotThrow(() => requireBranchAccess(branchAdminCtx, branchA));

      // Denied for unassigned branch
      assert.throws(
        () => requireBranchAccess(branchAdminCtx, branchB),
        ForbiddenError,
        'requireBranchAccess must reject access to unassigned branch'
      );
    });
  });

  // --------------------------------------------------------------------------
  // 4. Production Header Spoofing Rejection
  // --------------------------------------------------------------------------
  describe('Production Spoofing Prevention', () => {
    const originalEnv = process.env.NODE_ENV;

    afterEach(() => {
      (process.env as Record<string, string | undefined>).NODE_ENV = originalEnv;
    });

    it('ignores client x-user-* headers in production mode', async () => {
      (process.env as Record<string, string | undefined>).NODE_ENV = 'production';

      const req = new Request('https://abpsbooks.example.com/api/admin/inventory', {
        headers: {
          'x-user-id': 'hacker-user-id',
          'x-user-role': 'admin',
          'x-user-email': 'admin@spoofed.com',
        },
      });

      const ctx = await extractAuthContext(req);
      assert.strictEqual(ctx, null, 'Production environment must ignore spoofed dev headers');
    });
  });

  // --------------------------------------------------------------------------
  // 5. Deactivated Account Gating
  // --------------------------------------------------------------------------
  describe('Deactivated Account Gating', () => {
    let originalSelect: typeof db.select;

    beforeEach(() => {
      originalSelect = db.select;
    });

    afterEach(() => {
      db.select = originalSelect;
    });

    it('throws ForbiddenError (403) when user account is deactivated (isActive: false)', async () => {
      const deactivatedUser: SupabaseUser = {
        id: '44444444-4444-4444-4444-444444444444',
        app_metadata: {},
        user_metadata: { full_name: 'Deactivated User' },
        aud: 'authenticated',
        created_at: new Date().toISOString(),
        email: 'inactive@abps.edu',
      };

      // Mock database returning inactive user
      db.select = (() => ({
        from: () => ({
          where: () => ({
            limit: async () => [
              {
                id: '44444444-4444-4444-4444-444444444444',
                email: 'inactive@abps.edu',
                fullName: 'Deactivated User',
                phone: null,
                isActive: false,
                deletedAt: null,
              },
            ],
          }),
        }),
      })) as any;

      await assert.rejects(
        async () => {
          await resolveOrCreateAuthUser(deactivatedUser);
        },
        (err: any) => {
          assert.ok(err instanceof ForbiddenError);
          assert.strictEqual(err.statusCode, 403);
          assert.match(err.message, /Account is deactivated/);
          return true;
        }
      );
    });
  });

  // --------------------------------------------------------------------------
  // 6. Safe Server-Side Auto-Provisioning Logic
  // --------------------------------------------------------------------------
  describe('Safe Auto-Provisioning', () => {
    let originalSelect: typeof db.select;
    let originalTransaction: typeof db.transaction;

    beforeEach(() => {
      originalSelect = db.select;
      originalTransaction = db.transaction;
    });

    afterEach(() => {
      db.select = originalSelect;
      db.transaction = originalTransaction;
    });

    it('auto-provisions new Supabase authenticated user with customer role and profile', async () => {
      const newUser: SupabaseUser = {
        id: '55555555-5555-5555-5555-555555555555',
        app_metadata: {},
        user_metadata: {
          full_name: 'Anjali Sharma',
          phone: '9876500000',
        },
        aud: 'authenticated',
        created_at: new Date().toISOString(),
        email: 'anjali.s@abps.edu',
        email_confirmed_at: new Date().toISOString(),
      };

      // Mock db.select returning empty array (new user)
      db.select = (() => ({
        from: () => ({
          where: () => ({
            limit: async () => [],
          }),
        }),
      })) as any;

      let txCalled = false;
      let userInserted = false;
      let roleAssigned = false;
      let profileCreated = false;

      // Mock db.transaction
      db.transaction = (async (cb: any) => {
        txCalled = true;
        const fakeTx = {
          insert: (table: any) => ({
            values: (val: any) => {
              if (table === authUsers) {
                userInserted = true;
                return {
                  returning: async () => [
                    {
                      id: val.id,
                      email: val.email,
                      fullName: val.fullName,
                      phone: val.phone,
                      isActive: true,
                    },
                  ],
                };
              }
              if (val.roleId === 'customer') {
                roleAssigned = true;
              } else {
                profileCreated = true;
              }
              return Promise.resolve();
            },
          }),
        };
        return await cb(fakeTx);
      }) as any;

      const authCtx = await resolveOrCreateAuthUser(newUser);

      assert.strictEqual(txCalled, true, 'Auto-provisioning must be transactional');
      assert.strictEqual(userInserted, true, 'Auth user must be inserted');
      assert.strictEqual(roleAssigned, true, 'Customer role must be assigned');
      assert.strictEqual(profileCreated, true, 'Customer profile must be created');
      assert.strictEqual(authCtx.userId, '55555555-5555-5555-5555-555555555555');
      assert.strictEqual(authCtx.email, 'anjali.s@abps.edu');
      assert.strictEqual(authCtx.role, 'customer');
      assert.strictEqual(authCtx.isStaff, false);
    });
  });
});
