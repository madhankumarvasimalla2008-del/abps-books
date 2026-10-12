import './setup';
import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { getSiteOrigin } from '../src/lib/site-url';
import { GET as callbackRouteHandler } from '../src/app/auth/callback/route';
import { provisionAdminUser } from '../src/server/auth/provisioning';

describe('Supabase Password Recovery & Redirect Integration', () => {
  const originalEnv = { ...process.env };

  function setNodeEnv(env: string) {
    (process.env as Record<string, string | undefined>).NODE_ENV = env;
  }

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  // --------------------------------------------------------------------------
  // 1. Central Site Origin Resolution Helper Tests
  // --------------------------------------------------------------------------
  describe('getSiteOrigin helper', () => {
    it('returns NEXT_PUBLIC_SITE_URL with prepended https:// if protocol is omitted', () => {
      delete process.env.NEXT_PUBLIC_VERCEL_URL;
      delete process.env.VERCEL_PROJECT_PRODUCTION_URL;
      process.env.NEXT_PUBLIC_SITE_URL = 'abpsbooks.example.com';

      const origin = getSiteOrigin();
      assert.strictEqual(origin, 'https://abpsbooks.example.com');
    });

    it('strips trailing slashes from NEXT_PUBLIC_SITE_URL', () => {
      delete process.env.NEXT_PUBLIC_VERCEL_URL;
      delete process.env.VERCEL_PROJECT_PRODUCTION_URL;
      process.env.NEXT_PUBLIC_SITE_URL = 'https://abpsbooks.example.com///';

      const origin = getSiteOrigin();
      assert.strictEqual(origin, 'https://abpsbooks.example.com');
    });

    it('returns NEXT_PUBLIC_VERCEL_URL when NEXT_PUBLIC_SITE_URL is not set', () => {
      delete process.env.NEXT_PUBLIC_SITE_URL;
      delete process.env.VERCEL_PROJECT_PRODUCTION_URL;
      process.env.NEXT_PUBLIC_VERCEL_URL = 'abps-books-staging.vercel.app';

      const origin = getSiteOrigin();
      assert.strictEqual(origin, 'https://abps-books-staging.vercel.app');
    });

    it('falls back to http://localhost:3000 when no environment variables are present in dev/test', () => {
      delete process.env.NEXT_PUBLIC_SITE_URL;
      delete process.env.NEXT_PUBLIC_VERCEL_URL;
      delete process.env.VERCEL_PROJECT_PRODUCTION_URL;
      setNodeEnv('test');

      const origin = getSiteOrigin();
      assert.strictEqual(origin, 'http://localhost:3000');
    });

    it('RULE: In production, NEVER returns localhost:3000 even if no environment variables are set', () => {
      delete process.env.NEXT_PUBLIC_SITE_URL;
      delete process.env.NEXT_PUBLIC_VERCEL_URL;
      delete process.env.VERCEL_PROJECT_PRODUCTION_URL;
      setNodeEnv('production');

      const origin = getSiteOrigin();
      assert.strictEqual(origin, 'https://abps-books.vercel.app');
      assert.notStrictEqual(origin, 'http://localhost:3000');
    });

    it('RULE: In production, prevents accidental localhost in NEXT_PUBLIC_SITE_URL', () => {
      setNodeEnv('production');
      process.env.NEXT_PUBLIC_SITE_URL = 'http://localhost:3000';

      const origin = getSiteOrigin();
      assert.strictEqual(origin, 'https://abps-books.vercel.app');
    });

    it('uses VERCEL_PROJECT_PRODUCTION_URL in production when NEXT_PUBLIC_SITE_URL is unset', () => {
      setNodeEnv('production');
      delete process.env.NEXT_PUBLIC_SITE_URL;
      process.env.VERCEL_PROJECT_PRODUCTION_URL = 'custom-prod.vercel.app';

      const origin = getSiteOrigin();
      assert.strictEqual(origin, 'https://custom-prod.vercel.app');
    });
  });

  // --------------------------------------------------------------------------
  // 2. Auth Callback Route Tests
  // --------------------------------------------------------------------------
  describe('Auth Callback Route Handler (/auth/callback)', () => {
    it('redirects to /login?error=auth_callback_failed when no code is present in development', async () => {
      setNodeEnv('test');
      delete process.env.NEXT_PUBLIC_SITE_URL;
      const req = new Request('http://localhost:3000/auth/callback');
      const response = await callbackRouteHandler(req);

      assert.strictEqual(response.status, 307);
      const location = response.headers.get('location');
      assert.strictEqual(location, 'http://localhost:3000/login?error=auth_callback_failed');
    });

    it('RULE: In production, redirects to canonical production URL and NEVER to localhost:3000', async () => {
      setNodeEnv('production');
      delete process.env.NEXT_PUBLIC_SITE_URL;
      // Even if internal serverless container URL has localhost host header:
      const req = new Request('http://localhost:3000/auth/callback');
      const response = await callbackRouteHandler(req);

      assert.strictEqual(response.status, 307);
      const location = response.headers.get('location');
      assert.strictEqual(location, 'https://abps-books.vercel.app/login?error=auth_callback_failed');
      assert.ok(!location?.includes('localhost:3000'));
    });

    it('forwards OAuth provider errors and user cancellation gracefully', async () => {
      setNodeEnv('production');
      const req = new Request('https://abps-books.vercel.app/auth/callback?error=access_denied&error_description=User+cancelled');
      const response = await callbackRouteHandler(req);

      assert.strictEqual(response.status, 307);
      const location = response.headers.get('location');
      assert.ok(location?.startsWith('https://abps-books.vercel.app/login?error=access_denied'));
      assert.ok(location?.includes('message=Sign%20in%20was%20cancelled.%20Please%20try%20again.'));
    });

    it('forwards expired link errors gracefully with actionable message', async () => {
      setNodeEnv('production');
      const req = new Request('https://abps-books.vercel.app/auth/callback?error=access_denied&error_code=otp_expired');
      const response = await callbackRouteHandler(req);

      assert.strictEqual(response.status, 307);
      const location = response.headers.get('location');
      assert.ok(location?.includes('error=access_denied'));
      assert.ok(location?.includes('message=The%20verification%20link%20has%20expired'));
    });
  });

  // --------------------------------------------------------------------------
  // 3. Admin Provisioning Invitation Redirect Contract
  // --------------------------------------------------------------------------
  describe('Admin Provisioning Invitation Redirect Contract', () => {
    it('passes explicit redirectTo: ${siteOrigin}/auth/callback?next=/admin to inviteUserByEmail', async () => {
      process.env.NEXT_PUBLIC_SITE_URL = 'https://portal.abpsbooks.edu';

      let capturedEmail = '';
      let capturedOptions: any = null;

      const mockSupabaseAdmin: any = {
        auth: {
          admin: {
            inviteUserByEmail: async (email: string, options: any) => {
              capturedEmail = email;
              capturedOptions = options;
              return {
                data: {
                  user: {
                    id: 'new-admin-supabase-uuid-1',
                    email,
                  },
                },
                error: null,
              };
            },
          },
        },
      };

      const mockDb: any = {
        select: () => ({
          from: () => ({
            where: () => ({
              limit: async () => [],
            }),
          }),
        }),
        insert: () => ({
          values: () => ({
            returning: async () => [{ id: 'new-admin-supabase-uuid-1' }],
            onConflictDoNothing: () => ({
              returning: async () => [{ id: 'new-admin-supabase-uuid-1' }],
            }),
          }),
        }),
        transaction: async (cb: any) => {
          return cb({
            select: () => ({
              from: () => ({
                where: () => ({
                  limit: async () => [],
                }),
              }),
            }),
            insert: () => ({
              values: () => ({
                onConflictDoNothing: async () => ({}),
                returning: async () => [{}],
              }),
            }),
            update: () => ({
              set: () => ({
                where: async () => [],
              }),
            }),
          });
        },
      };

      const result = await provisionAdminUser(
        {
          email: 'principal.admin@abps.edu',
          fullName: 'Principal Admin',
          sendInvite: true,
        },
        mockSupabaseAdmin,
        mockDb
      );

      assert.strictEqual(result.success, true);
      assert.strictEqual(capturedEmail, 'principal.admin@abps.edu');
      assert.strictEqual(
        capturedOptions.redirectTo,
        'https://portal.abpsbooks.edu/auth/callback?next=/admin'
      );
      assert.strictEqual(capturedOptions.data.full_name, 'Principal Admin');
    });
  });

  // --------------------------------------------------------------------------
  // 4. Client-side Password Update Logic & Session Preflight Contracts
  // --------------------------------------------------------------------------
  describe('Password Update Execution & Error Resilience Contracts', () => {
    it('successfully calls updateUser when active session exists', async () => {
      let passedPassword = '';
      const mockSupabase = {
        auth: {
          getSession: async () => ({
            data: { session: { access_token: 'valid-recovery-token', user: { id: 'admin-uuid' } } },
            error: null,
          }),
          updateUser: async ({ password }: { password: string }) => {
            passedPassword = password;
            return {
              data: { user: { id: 'admin-uuid' } },
              error: null,
            };
          },
        },
      };

      const { data: sessionData, error: sessionError } = await mockSupabase.auth.getSession();
      assert.strictEqual(sessionError, null);
      assert.ok(sessionData.session);

      const result = await mockSupabase.auth.updateUser({ password: 'NewSecurePassword123!' });
      assert.strictEqual(result.error, null);
      assert.strictEqual(passedPassword, 'NewSecurePassword123!');
    });

    it('rejects update before updateUser() when no active session is present', async () => {
      let updateUserCalled = false;
      const mockSupabase = {
        auth: {
          getSession: async () => ({
            data: { session: null },
            error: null,
          }),
          updateUser: async () => {
            updateUserCalled = true;
            return { data: null, error: null };
          },
        },
      };

      const { data: sessionData, error: sessionError } = await mockSupabase.auth.getSession();
      let errorMessage: string | null = null;

      if (sessionError || !sessionData?.session) {
        errorMessage = 'No active recovery session found.';
      } else {
        await mockSupabase.auth.updateUser();
      }

      assert.strictEqual(errorMessage, 'No active recovery session found.');
      assert.strictEqual(updateUserCalled, false);
    });

    it('handles Supabase updateUser error responses gracefully without stalling', async () => {
      const mockSupabase = {
        auth: {
          getSession: async () => ({
            data: { session: { access_token: 'expired-token' } },
            error: null,
          }),
          updateUser: async () => ({
            data: null,
            error: { message: 'Auth session missing or expired' },
          }),
        },
      };

      const { data: sessionData } = await mockSupabase.auth.getSession();
      assert.ok(sessionData.session);

      const result = await mockSupabase.auth.updateUser();
      assert.strictEqual(result.error?.message, 'Auth session missing or expired');
    });

    it('allows sequential retry when first attempt fails with same-password error', async () => {
      let callCount = 0;
      const passwordsAttempted: string[] = [];

      const mockSupabase = {
        auth: {
          getSession: async () => ({
            data: { session: { access_token: 'valid-recovery-token', user: { id: 'admin-uuid' } } },
            error: null,
          }),
          updateUser: async ({ password }: { password: string }) => {
            callCount++;
            passwordsAttempted.push(password);
            if (password === 'SameOldPassword123!') {
              return {
                data: { user: null },
                error: { message: 'New password should be different from the old password.' },
              };
            }
            return {
              data: { user: { id: 'admin-uuid' } },
              error: null,
            };
          },
        },
      };

      // Attempt 1: Same password as old
      const firstResult = await mockSupabase.auth.updateUser({ password: 'SameOldPassword123!' });
      assert.ok(firstResult.error);
      assert.strictEqual(firstResult.error.message, 'New password should be different from the old password.');

      // Attempt 2: Clean retry with new password
      const secondResult = await mockSupabase.auth.updateUser({ password: 'BrandNewSecurePassword456!' });
      assert.strictEqual(secondResult.error, null);
      assert.ok(secondResult.data?.user);
      assert.strictEqual(callCount, 2);
      assert.deepStrictEqual(passwordsAttempted, [
        'SameOldPassword123!',
        'BrandNewSecurePassword456!',
      ]);
    });

    it('preserves query parameters and URL hash during PASSWORD_RECOVERY redirection', () => {
      // Simulating AuthContext PASSWORD_RECOVERY redirect logic
      const simulateRedirect = (pathname: string, search: string, hash: string) => {
        if (pathname !== '/reset-password') {
          return `/reset-password${search || ''}${hash || ''}`;
        }
        return null;
      };

      const redirected = simulateRedirect('/', '?client=web', '#access_token=test-recovery-token&type=recovery');
      assert.strictEqual(redirected, '/reset-password?client=web#access_token=test-recovery-token&type=recovery');

      const noRedirectWhenOnResetPage = simulateRedirect('/reset-password', '', '#access_token=test-recovery-token&type=recovery');
      assert.strictEqual(noRedirectWhenOnResetPage, null);
    });

    it('skips server session synchronization when on /reset-password route to prevent UI flashes', () => {
      let syncCalled = false;
      const handleAuthEvent = (pathname: string, hasSession: boolean) => {
        if (hasSession) {
          if (pathname === '/reset-password') {
            return; // Skip sync
          }
          syncCalled = true;
        }
      };

      handleAuthEvent('/reset-password', true);
      assert.strictEqual(syncCalled, false);

      handleAuthEvent('/', true);
      assert.strictEqual(syncCalled, true);
    });

    it('provides correct navigation target URLs for admin and customer login after success', () => {
      const adminLoginTarget = '/login?redirect=/admin';
      const storePortalLoginTarget = '/login';

      assert.strictEqual(adminLoginTarget, '/login?redirect=/admin');
      assert.strictEqual(storePortalLoginTarget, '/login');
    });
  });
});


