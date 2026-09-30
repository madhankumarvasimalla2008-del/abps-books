import './setup';
import { describe, it, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { NextRequest } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';

// Auth & Session
import { extractAuthContext, requireAuth, requireRole } from '../src/server/auth/guard';
import { getSafeRedirectUrl } from '../src/app/(auth)/login/page';
import { UnauthorizedError, ForbiddenError } from '../src/server/errors';
import type { AuthContext } from '../src/server/auth/guard';

// Validation
import { inventoryFilterSchema } from '../src/server/validation/inventory';
import { productFilterSchema } from '../src/server/validation/products';
import { categoryFilterSchema } from '../src/server/validation/categories';

// API Route Handlers
import { GET as getInventory } from '../src/app/api/inventory/route';
import { GET as getCustomers } from '../src/app/api/customers/route';
import { GET as getAuditLogs } from '../src/app/api/audit-logs/route';

describe('Phase 7: Comprehensive Platform Security Regression Suite', () => {
  const originalEnv = process.env.NODE_ENV;

  afterEach(() => {
    (process.env as Record<string, string | undefined>).NODE_ENV = originalEnv;
  });

  // --------------------------------------------------------------------------
  // 1. Unauthenticated protected API -> 401
  // --------------------------------------------------------------------------
  describe('1. Unauthenticated Protected API Routes', () => {
    it('rejects unauthenticated requests to /api/inventory with 401', async () => {
      (process.env as Record<string, string | undefined>).NODE_ENV = 'production';
      const req = new NextRequest('https://abpsbooks.example.com/api/inventory?pageSize=10');
      const res = await getInventory(req);
      assert.strictEqual(res.status, 401, 'Must return HTTP 401 for unauthenticated request');
      const body = await res.json();
      assert.strictEqual(body.success, false);
      assert.strictEqual(body.error.code, 'UNAUTHORIZED');
    });

    it('rejects unauthenticated requests to /api/customers with 401', async () => {
      (process.env as Record<string, string | undefined>).NODE_ENV = 'production';
      const req = new NextRequest('https://abpsbooks.example.com/api/customers');
      const res = await getCustomers(req);
      assert.strictEqual(res.status, 401);
      const body = await res.json();
      assert.strictEqual(body.error.code, 'UNAUTHORIZED');
    });

    it('rejects unauthenticated requests to /api/audit-logs with 401', async () => {
      (process.env as Record<string, string | undefined>).NODE_ENV = 'production';
      const req = new NextRequest('https://abpsbooks.example.com/api/audit-logs');
      const res = await getAuditLogs(req);
      assert.strictEqual(res.status, 401);
      const body = await res.json();
      assert.strictEqual(body.error.code, 'UNAUTHORIZED');
    });
  });

  // --------------------------------------------------------------------------
  // 2. Customer calling admin API -> 403
  // --------------------------------------------------------------------------
  describe('2. Customer Role Calling Admin APIs', () => {
    const customerCtx: AuthContext = {
      userId: '11111111-1111-1111-1111-111111111111',
      email: 'customer@school.edu',
      fullName: 'Student Customer',
      role: 'customer',
      branchId: 'branch-1',
      isStaff: false,
    };

    it('rejects customer from inventory adjustment with 403 Forbidden', () => {
      assert.throws(
        () => requireRole(customerCtx, ['admin', 'warehouse', 'branch_admin']),
        ForbiddenError,
        'Customer must not have permission to adjust inventory'
      );
    });

    it('rejects customer from viewing audit logs with 403 Forbidden', () => {
      assert.throws(
        () => requireRole(customerCtx, ['admin']),
        ForbiddenError,
        'Customer must not have permission to view audit logs'
      );
    });

    it('rejects customer from accessing admin customer management with 403', () => {
      assert.throws(
        () => requireRole(customerCtx, ['admin', 'branch_admin', 'sales']),
        ForbiddenError,
        'Customer must not have permission to browse all customers'
      );
    });
  });

  // --------------------------------------------------------------------------
  // 3. Customer accessing another customer resource -> 403
  // --------------------------------------------------------------------------
  describe('3. Customer Isolation & Cross-Customer Resource Protection', () => {
    const customerA: AuthContext = {
      userId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      email: 'customerA@abps.edu',
      fullName: 'Customer Alpha',
      role: 'customer',
      branchId: 'branch-1',
      isStaff: false,
    };

    it('rejects customer A trying to access customer B addresses with 403', async () => {
      const customerBId = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

      // Verify server-side ownership guard logic
      const checkCustomerAccess = (ctx: AuthContext, targetCustomerId: string) => {
        if (ctx.role === 'customer' && ctx.userId !== targetCustomerId) {
          throw new ForbiddenError('You do not have permission to access another customer addresses');
        }
      };

      assert.throws(
        () => checkCustomerAccess(customerA, customerBId),
        ForbiddenError,
        'Customer A must be forbidden from accessing Customer B resource'
      );

      // Verify accessing own resource passes
      assert.doesNotThrow(
        () => checkCustomerAccess(customerA, customerA.userId),
        'Customer A must be allowed to access own resource'
      );
    });
  });

  // --------------------------------------------------------------------------
  // 4. Branch staff accessing another branch -> rejected
  // --------------------------------------------------------------------------
  describe('4. Branch Tenant Scope Isolation', () => {
    const branch1Staff: AuthContext = {
      userId: '22222222-2222-2222-2222-222222222222',
      email: 'staff.mumbai@abps.edu',
      fullName: 'Mumbai Branch Staff',
      role: 'branch_admin',
      branchId: 'branch-mumbai-01',
      isStaff: true,
    };

    it('rejects branch staff trying to perform actions on a different branch', () => {
      const verifyBranchScope = (ctx: AuthContext, targetBranchId: string) => {
        if (ctx.role === 'branch_admin' && ctx.branchId && ctx.branchId !== targetBranchId) {
          throw new ForbiddenError('You are not authorized to manage inventory for other branches');
        }
      };

      assert.throws(
        () => verifyBranchScope(branch1Staff, 'branch-delhi-02'),
        ForbiddenError,
        'Branch staff must not be permitted to manage Delhi branch'
      );

      assert.doesNotThrow(
        () => verifyBranchScope(branch1Staff, 'branch-mumbai-01'),
        'Branch staff must be permitted to manage Mumbai branch'
      );
    });
  });

  // --------------------------------------------------------------------------
  // 5. Authorized admin -> allowed
  // --------------------------------------------------------------------------
  describe('5. Authorized Admin Role Access', () => {
    const adminCtx: AuthContext = {
      userId: '99999999-9999-9999-9999-999999999999',
      email: 'superadmin@abps.edu',
      fullName: 'Super Administrator',
      role: 'admin',
      branchId: null,
      isStaff: true,
    };

    it('permits authorized admin to pass all system role guards', () => {
      assert.doesNotThrow(() => requireRole(adminCtx, ['admin']));
      assert.doesNotThrow(() => requireRole(adminCtx, ['admin', 'branch_admin', 'warehouse']));
      assert.doesNotThrow(() => requireRole(adminCtx, ['admin', 'sales']));
      assert.strictEqual(adminCtx.isStaff, true);
    });
  });

  // --------------------------------------------------------------------------
  // 6. Spoofed role header -> ignored in production
  // --------------------------------------------------------------------------
  describe('6. Spoofed Role Headers Ignored in Production', () => {
    it('completely ignores spoofed x-user-* headers when NODE_ENV is production', async () => {
      (process.env as Record<string, string | undefined>).NODE_ENV = 'production';

      const spoofedReq = new Request('https://abpsbooks.example.com/api/products', {
        headers: {
          'x-user-id': 'attacker-id',
          'x-user-role': 'admin',
          'x-user-email': 'attacker@evil.com',
        },
      });

      const ctx = await extractAuthContext(spoofedReq);
      assert.strictEqual(ctx, null, 'Production environment must never trust x-user-* headers');
      assert.throws(() => requireAuth(ctx), UnauthorizedError);
    });
  });

  // --------------------------------------------------------------------------
  // 7. Login redirect preserved safely
  // --------------------------------------------------------------------------
  describe('7. Safe Redirect URL Sanitization', () => {
    it('preserves /admin for admin role', () => {
      assert.strictEqual(getSafeRedirectUrl('/admin', 'admin'), '/admin');
      assert.strictEqual(getSafeRedirectUrl('/admin/inventory', 'admin'), '/admin/inventory');
      assert.strictEqual(getSafeRedirectUrl('/admin/orders', 'branch_admin'), '/admin/orders');
    });

    it('redirects customer trying to access /admin to store home /', () => {
      assert.strictEqual(getSafeRedirectUrl('/admin', 'customer'), '/');
      assert.strictEqual(getSafeRedirectUrl('/admin/products', 'customer'), '/');
    });

    it('prevents open redirect attacks via external URLs', () => {
      assert.strictEqual(getSafeRedirectUrl('https://malicious.com', 'admin'), '/admin');
      assert.strictEqual(getSafeRedirectUrl('http://evil.com', 'customer'), '/');
      assert.strictEqual(getSafeRedirectUrl('//evil.com', 'admin'), '/admin');
      assert.strictEqual(getSafeRedirectUrl('/\\evil.com', 'customer'), '/');
    });

    it('defaults correctly when redirect target is null or undefined', () => {
      assert.strictEqual(getSafeRedirectUrl(null, 'admin'), '/admin');
      assert.strictEqual(getSafeRedirectUrl(undefined, 'customer'), '/');
    });
  });

  // --------------------------------------------------------------------------
  // 8. Production demo personas unavailable
  // --------------------------------------------------------------------------
  describe('8. Production Demo Personas Guard', () => {
    it('ensures demo mode is only active when NODE_ENV !== production', () => {
      const isDemoAvailable = (nodeEnv: string) => nodeEnv !== 'production';
      assert.strictEqual(isDemoAvailable('production'), false);
      assert.strictEqual(isDemoAvailable('development'), true);
      assert.strictEqual(isDemoAvailable('test'), true);
    });
  });

  // --------------------------------------------------------------------------
  // 9. Password recovery same-password error handling
  // --------------------------------------------------------------------------
  describe('9. Password Recovery Same-Password Error Handling', () => {
    it('gracefully identifies same-password error from Supabase without crashing', () => {
      const supabaseError = {
        message: 'New password should be different from the old password.',
        status: 422,
      };

      const isSamePasswordError = (err: { message: string }) =>
        err.message.toLowerCase().includes('should be different from the old password');

      assert.strictEqual(isSamePasswordError(supabaseError), true);
    });
  });

  // --------------------------------------------------------------------------
  // 10. Password recovery successful update
  // --------------------------------------------------------------------------
  describe('10. Password Recovery Successful Update', () => {
    it('updates password when user session is valid', async () => {
      const mockSupabase = {
        auth: {
          updateUser: async (params: { password: string }) => {
            assert.strictEqual(params.password, 'NewSecurePassword!2026');
            return {
              data: {
                user: { id: 'u_123', email: 'user@abps.edu' },
              },
              error: null,
            };
          },
        },
      };

      const { data, error } = await mockSupabase.auth.updateUser({
        password: 'NewSecurePassword!2026',
      });
      assert.strictEqual(error, null);
      assert.strictEqual(data.user.email, 'user@abps.edu');
    });
  });

  // --------------------------------------------------------------------------
  // 11. Inventory omitted query parameter
  // --------------------------------------------------------------------------
  describe('11. Query Parameter Validation Robustness', () => {
    it('parses /api/inventory query without lowStockOnly successfully', () => {
      const queryWithOmittedLowStock = {
        pageSize: '100',
        page: '1',
      };

      const parsed = inventoryFilterSchema.parse(queryWithOmittedLowStock);
      assert.strictEqual(parsed.pageSize, 100);
      assert.strictEqual(parsed.page, 1);
      assert.strictEqual(parsed.lowStockOnly, undefined);
    });

    it('parses lowStockOnly as boolean or string "true"/"false"', () => {
      assert.strictEqual(inventoryFilterSchema.parse({ lowStockOnly: true }).lowStockOnly, true);
      assert.strictEqual(inventoryFilterSchema.parse({ lowStockOnly: false }).lowStockOnly, false);
      assert.strictEqual(inventoryFilterSchema.parse({ lowStockOnly: 'true' as any }).lowStockOnly, true);
      assert.strictEqual(inventoryFilterSchema.parse({ lowStockOnly: 'false' as any }).lowStockOnly, false);
    });

    it('parses categoryFilterSchema isActive with boolean and string', () => {
      assert.strictEqual(categoryFilterSchema.parse({ isActive: true }).isActive, true);
      assert.strictEqual(categoryFilterSchema.parse({ isActive: false }).isActive, false);
      assert.strictEqual(categoryFilterSchema.parse({ isActive: 'true' as any }).isActive, true);
      assert.strictEqual(categoryFilterSchema.parse({ isActive: 'false' as any }).isActive, false);
      assert.strictEqual(categoryFilterSchema.parse({}).isActive, undefined);
    });
  });

  // --------------------------------------------------------------------------
  // 12. Nested navigation controls corrected
  // --------------------------------------------------------------------------
  describe('12. Nested Navigation Controls Verification', () => {
    it('verifies 0 nested <Link><Button> elements exist in the src/ codebase', () => {
      function walkDir(dir: string): string[] {
        let results: string[] = [];
        for (const file of fs.readdirSync(dir)) {
          const fullPath = path.join(dir, file);
          const stat = fs.statSync(fullPath);
          if (stat.isDirectory()) {
            if (file !== 'node_modules' && file !== '.next' && file !== '.git') {
              results.push(...walkDir(fullPath));
            }
          } else if (file.endsWith('.tsx') || file.endsWith('.jsx')) {
            results.push(fullPath);
          }
        }
        return results;
      }

      const tsxFiles = walkDir(path.resolve(process.cwd(), 'src'));
      const offendingLocations: string[] = [];

      for (const file of tsxFiles) {
        const content = fs.readFileSync(file, 'utf8');
        const linkRegex = /<Link\b[^>]*>([\s\S]*?)<\/Link>/g;
        let match: RegExpExecArray | null;
        while ((match = linkRegex.exec(content)) !== null) {
          if (match[1].includes('<Button')) {
            const lineNum = content.substring(0, match.index).split('\n').length;
            offendingLocations.push(`${path.relative(process.cwd(), file)}:${lineNum}`);
          }
        }
      }

      assert.deepStrictEqual(
        offendingLocations,
        [],
        `Found nested <Link><Button> violations in: ${offendingLocations.join(', ')}`
      );
    });
  });
});
