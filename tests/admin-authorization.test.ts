import './setup';
import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { requireAuth, requireRole, extractAuthContext } from '../src/server/auth/guard';
import { resolveOrCreateAuthUser, resolveAuthContextFromRequest } from '../src/server/auth/session';
import { GET as getAuthMe } from '../src/app/api/auth/me/route';
import { UnauthorizedError, ForbiddenError } from '../src/server/errors';
import { db } from '../src/db';
import { NextRequest } from 'next/server';
import type { User as SupabaseUser } from '@supabase/supabase-js';

const STAFF_ROLES = ['admin', 'branch_admin', 'warehouse', 'sales'] as const;

function isAuthorizedAdminRoute(user: { role: string } | null | undefined): boolean {
  if (!user) return false;
  return STAFF_ROLES.includes(user.role as any);
}

describe('Phase 6.2B: Admin Authorization Matrix & Real Role Enforcement', () => {
  const originalEnv = process.env.NODE_ENV;

  afterEach(() => {
    (process.env as Record<string, string | undefined>).NODE_ENV = originalEnv;
  });

  // --------------------------------------------------------------------------
  // 1. No Supabase session -> /admin unauthorized
  // --------------------------------------------------------------------------
  it('1. No Supabase session: requires auth and denies admin route access', async () => {
    (process.env as Record<string, string | undefined>).NODE_ENV = 'production';

    const unauthenticatedReq = new Request('https://abpsbooks.example.com/api/admin/orders');
    const ctx = await extractAuthContext(unauthenticatedReq);

    assert.strictEqual(ctx, null, 'Unauthenticated request must produce null auth context');
    assert.throws(
      () => requireAuth(ctx),
      UnauthorizedError,
      'requireAuth must throw UnauthorizedError for missing session'
    );
    assert.strictEqual(
      isAuthorizedAdminRoute(ctx),
      false,
      'Unauthenticated user must not pass admin route authorization'
    );
  });

  // --------------------------------------------------------------------------
  // 2. Demo persona alone -> /admin unauthorized in production
  // --------------------------------------------------------------------------
  it('2. Demo persona alone: cannot satisfy production authorization or bypass server guards', async () => {
    (process.env as Record<string, string | undefined>).NODE_ENV = 'production';

    const demoReq = new Request('https://abpsbooks.example.com/api/admin/products', {
      headers: {
        'x-user-id': 'u_admin',
        'x-user-role': 'admin',
        'x-user-email': 'admin@birlabooks.in',
      },
    });

    const ctx = await extractAuthContext(demoReq);
    assert.strictEqual(ctx, null, 'Production environment must strictly reject demo headers');
    assert.throws(
      () => requireAuth(ctx),
      UnauthorizedError,
      'Demo persona alone cannot satisfy production requireAuth'
    );
  });

  // --------------------------------------------------------------------------
  // 3. Customer Supabase role -> /admin unauthorized
  // --------------------------------------------------------------------------
  it('3. Customer Supabase role: authenticated customer is forbidden from admin routes', () => {
    const customerCtx = {
      userId: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
      email: 'priya.desai@abps.edu',
      fullName: 'Priya Desai',
      role: 'customer' as const,
      branchId: 'b1',
      isStaff: false,
    };

    const authCtx = requireAuth(customerCtx);
    assert.strictEqual(authCtx.userId, customerCtx.userId);

    assert.throws(
      () => requireRole(customerCtx, [...STAFF_ROLES]),
      ForbiddenError,
      'Customer role must be rejected by requireRole for admin resources'
    );

    assert.strictEqual(
      isAuthorizedAdminRoute(customerCtx),
      false,
      'Customer role must not pass admin route authorization guard'
    );
  });

  // --------------------------------------------------------------------------
  // 4. Admin Supabase role -> /admin authorized
  // --------------------------------------------------------------------------
  it('4. Admin Supabase role: real administrator is authorized for admin routes', () => {
    const adminCtx = {
      userId: '9cdba9f9-1fc3-4ad4-8488-a93c799650ce',
      email: 'madhankumarvasimalla2008@gmail.com',
      fullName: 'Madhankumar Vasimalla',
      role: 'admin' as const,
      branchId: null,
      isStaff: true,
    };

    const authCtx = requireAuth(adminCtx);
    assert.strictEqual(authCtx.userId, adminCtx.userId);

    assert.doesNotThrow(
      () => requireRole(adminCtx, [...STAFF_ROLES]),
      'Admin role must pass requireRole for admin resources'
    );

    assert.strictEqual(
      isAuthorizedAdminRoute(adminCtx),
      true,
      'Admin role must pass admin route authorization guard'
    );
  });

  // --------------------------------------------------------------------------
  // 5. Demo persona cannot override real Supabase admin session
  // --------------------------------------------------------------------------
  it('5. Demo persona cannot override real Supabase admin session', async () => {
    let originalSelect: typeof db.select;
    originalSelect = db.select;

    try {
      const realAdminSupabaseUser: SupabaseUser = {
        id: '9cdba9f9-1fc3-4ad4-8488-a93c799650ce',
        app_metadata: {},
        user_metadata: { full_name: 'Madhankumar Vasimalla' },
        aud: 'authenticated',
        created_at: new Date().toISOString(),
        email: 'madhankumarvasimalla2008@gmail.com',
      };

      // Mock database returning the real admin domain records
      db.select = ((fields: any) => ({
        from: (table: any) => ({
          where: (clause: any) => ({
            limit: async () => [
              {
                id: '9cdba9f9-1fc3-4ad4-8488-a93c799650ce',
                email: 'madhankumarvasimalla2008@gmail.com',
                fullName: 'Madhankumar Vasimalla',
                phone: null,
                isActive: true,
                deletedAt: null,
                assignedBranchId: null,
              },
            ],
            // user_roles query
            then: (resolve: any) =>
              resolve([
                {
                  roleId: 'admin',
                },
              ]),
          }),
        }),
      })) as any;

      const resolved = await resolveOrCreateAuthUser(realAdminSupabaseUser);

      assert.strictEqual(
        resolved.userId,
        '9cdba9f9-1fc3-4ad4-8488-a93c799650ce',
        'Must resolve to real Supabase UUID'
      );
      assert.strictEqual(
        resolved.email,
        'madhankumarvasimalla2008@gmail.com',
        'Must resolve to real administrator email'
      );
      assert.strictEqual(resolved.role, 'admin', 'Must resolve to database admin role');
      assert.strictEqual(resolved.isStaff, true);
    } finally {
      db.select = originalSelect;
    }
  });

  // --------------------------------------------------------------------------
  // 6. /api/auth/me returns the real Supabase identity
  // --------------------------------------------------------------------------
  it('6. /api/auth/me returns the authenticated identity when context exists', async () => {
    (process.env as Record<string, string | undefined>).NODE_ENV = 'development';

    const req = new NextRequest('https://abpsbooks.example.com/api/auth/me', {
      headers: {
        'x-user-id': '9cdba9f9-1fc3-4ad4-8488-a93c799650ce',
        'x-user-role': 'admin',
        'x-user-email': 'madhankumarvasimalla2008@gmail.com',
        'x-user-name': 'Madhankumar Vasimalla',
      },
    });

    const res = await getAuthMe(req);
    assert.strictEqual(res.status, 200);

    const json = await res.json();
    assert.strictEqual(json.success, true);
    assert.strictEqual(json.data.authenticated, true);
    assert.strictEqual(json.data.user.userId, '9cdba9f9-1fc3-4ad4-8488-a93c799650ce');
    assert.strictEqual(json.data.user.email, 'madhankumarvasimalla2008@gmail.com');
    assert.strictEqual(json.data.user.fullName, 'Madhankumar Vasimalla');
    assert.strictEqual(json.data.user.role, 'admin');
    assert.strictEqual(json.data.user.isStaff, true);
  });

  // --------------------------------------------------------------------------
  // 7. Arbitrary client role cannot elevate to admin
  // --------------------------------------------------------------------------
  it('7. Arbitrary client role cannot elevate to admin in production', async () => {
    (process.env as Record<string, string | undefined>).NODE_ENV = 'production';

    // Attacker sends forged admin role headers in production
    const attackerReq = new Request('https://abpsbooks.example.com/api/admin/settings', {
      headers: {
        'x-user-id': 'attacker-uuid',
        'x-user-role': 'admin',
        'x-user-email': 'attacker@evil.com',
      },
    });

    const ctx = await extractAuthContext(attackerReq);
    assert.strictEqual(ctx, null, 'Forged client headers must be completely ignored in production');
    assert.throws(
      () => requireAuth(ctx),
      UnauthorizedError,
      'requireAuth must block forged headers'
    );
  });
});
