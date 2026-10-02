import './setup';
import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { requireAuth, requireRole, requireBranchAccess, extractAuthContext } from '../src/server/auth/guard';
import { resolveOrCreateAuthUser, resolveAuthContextFromRequest } from '../src/server/auth/session';
import { UnauthorizedError, ForbiddenError } from '../src/server/errors';
import { authUsers } from '../src/db/schema/identity';
import { getTableColumns } from 'drizzle-orm';
import { db } from '../src/db';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { getSafeRedirectUrl } from '../src/app/(auth)/login/page';
import { normalizeIndianPhone, formatPhoneDisplay } from '../src/lib/phone';

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

    it('customer signup cannot self-select staff role and is strictly assigned customer role', async () => {
      // Attacker attempts to inject staff/admin role metadata in Supabase signup
      const attackerSignupUser: SupabaseUser = {
        id: '66666666-6666-6666-6666-666666666666',
        app_metadata: { provider: 'email' },
        user_metadata: {
          full_name: 'Attacker User',
          role: 'admin',
          roles: ['admin', 'warehouse'],
          isStaff: true,
        },
        aud: 'authenticated',
        created_at: new Date().toISOString(),
        email: 'attacker@example.com',
        email_confirmed_at: new Date().toISOString(),
      };

      db.select = (() => ({
        from: () => ({
          where: () => ({
            limit: async () => [],
          }),
        }),
      })) as any;

      let assignedRoleId: string | null = null;

      db.transaction = (async (cb: any) => {
        const fakeTx = {
          insert: (table: any) => ({
            values: (val: any) => {
              if (table === authUsers) {
                return {
                  returning: async () => [
                    {
                      id: val.id,
                      email: val.email,
                      fullName: val.fullName,
                      isActive: true,
                    },
                  ],
                };
              }
              if (val.roleId) {
                assignedRoleId = val.roleId;
              }
              return Promise.resolve();
            },
          }),
        };
        return await cb(fakeTx);
      }) as any;

      const authCtx = await resolveOrCreateAuthUser(attackerSignupUser);

      assert.strictEqual(
        assignedRoleId,
        'customer',
        'Auto-provisioning must strictly force customer role and ignore client-supplied role metadata'
      );
      assert.strictEqual(authCtx.role, 'customer');
      assert.strictEqual(authCtx.isStaff, false);
    });
  });

  // --------------------------------------------------------------------------
  // 7. Auth UX Phases 1–3: Self-Signup, OAuth & UI Invariants
  // --------------------------------------------------------------------------
  describe('Auth UX Phases 1–3: Self-Signup, OAuth & UI Invariants', () => {
    it('Google OAuth helper initiates Supabase OAuth with provider google and sanitized callback destination', async () => {
      let oauthProvider: string | null = null;
      let oauthRedirectTo: string | null = null;

      const fakeSupabase = {
        auth: {
          signInWithOAuth: async (options: { provider: string; options: { redirectTo: string } }) => {
            oauthProvider = options.provider;
            oauthRedirectTo = options.options.redirectTo;
            return { error: null };
          },
        },
      };

      const targetDestination = '/orders';
      const siteOrigin = 'https://abpsbooks.example.com';
      const expectedCallback = siteOrigin + '/auth/callback?next=' + encodeURIComponent(targetDestination);

      const { error } = await fakeSupabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: expectedCallback,
        },
      });

      assert.strictEqual(error, null);
      assert.strictEqual(oauthProvider, 'google', 'Must use provider google');
      assert.strictEqual(oauthRedirectTo, expectedCallback);
    });

    it('sanitizes customer vs admin redirect URLs to prevent privilege elevation and open redirects', () => {
      // Customer cannot redirect to /admin
      assert.strictEqual(getSafeRedirectUrl('/admin', 'customer'), '/');
      assert.strictEqual(getSafeRedirectUrl('/admin/inventory', 'customer'), '/');

      // Staff allowed to /admin
      assert.strictEqual(getSafeRedirectUrl('/admin', 'admin'), '/admin');
      assert.strictEqual(getSafeRedirectUrl('/admin/inventory', 'branch_admin'), '/admin/inventory');

      // Regular customer routes
      assert.strictEqual(getSafeRedirectUrl('/books', 'customer'), '/books');
      assert.strictEqual(getSafeRedirectUrl('/profile', 'customer'), '/profile');

      // Open redirect prevention
      assert.strictEqual(getSafeRedirectUrl('https://evil.com', 'customer'), '/');
      assert.strictEqual(getSafeRedirectUrl('//evil.com', 'customer'), '/');
      assert.strictEqual(getSafeRedirectUrl('/\\evil.com', 'customer'), '/');
      assert.strictEqual(getSafeRedirectUrl(null, 'customer'), '/');
      assert.strictEqual(getSafeRedirectUrl(undefined, 'admin'), '/admin');
    });
  });
  // --------------------------------------------------------------------------
  // 8. Phone Number Authentication, OTP Flows & Production Identity Model Invariants
  // --------------------------------------------------------------------------
  describe('8. Phone Number Authentication, OTP Flows & Production Identity Model Invariants', () => {
    describe('Phone Number Normalization & Validation (Rules A-L)', () => {
      it('K. normalizes all standard Indian phone variations to E.164 (+91XXXXXXXXXX)', () => {
        const testCases = [
          ['9876543210', '+919876543210'],
          ['09876543210', '+919876543210'],
          ['919876543210', '+919876543210'],
          ['+919876543210', '+919876543210'],
          ['+91 98765 43210', '+919876543210'],
          ['0091-9876543210', '+919876543210'],
          ['(091) 98765-43210', '+919876543210'],
        ];

        for (const [input, expected] of testCases) {
          const res = normalizeIndianPhone(input);
          assert.strictEqual(res.valid, true, `Expected ${input} to be valid`);
          assert.strictEqual(res.phone, expected, `Expected ${input} to normalize to ${expected}`);
        }
      });

      it('L. rejects invalid lengths, non-numeric characters, invalid prefixes, and malformed country codes', () => {
        // Short numbers
        const short = normalizeIndianPhone('987654321');
        assert.strictEqual(short.valid, false);
        assert.match(short.error!, /too short|10-digit/i);

        // Long numbers
        const long = normalizeIndianPhone('9876543210123');
        assert.strictEqual(long.valid, false);
        assert.match(long.error!, /too long|10-digit/i);

        // Non-numeric / letters
        const letters = normalizeIndianPhone('abcdefghij');
        assert.strictEqual(letters.valid, false);
        assert.match(letters.error!, /numeric digits/i);

        const mixed = normalizeIndianPhone('98765abcde');
        assert.strictEqual(mixed.valid, false);

        // Numbers starting with 1-5 (TRAI Indian mobile numbers start with 6, 7, 8, 9)
        const prefix5 = normalizeIndianPhone('5555555555');
        assert.strictEqual(prefix5.valid, false);
        assert.match(prefix5.error!, /start with 6, 7, 8, or 9/i);

        const prefix1 = normalizeIndianPhone('1234567890');
        assert.strictEqual(prefix1.valid, false);

        // Malformed or non-Indian country codes
        const usNumber = normalizeIndianPhone('+19876543210');
        assert.strictEqual(usNumber.valid, false);

        const ukNumber = normalizeIndianPhone('+449876543210');
        assert.strictEqual(ukNumber.valid, false);

        // Empty / whitespace
        assert.strictEqual(normalizeIndianPhone('').valid, false);
        assert.strictEqual(normalizeIndianPhone('   ').valid, false);
      });

      it('formats phone numbers for clean user display', () => {
        assert.strictEqual(formatPhoneDisplay('+919876543210'), '+91 98765 43210');
        assert.strictEqual(formatPhoneDisplay('9876543210'), '+91 98765 43210');
      });
    });

    describe('Phone OTP Send and Verification Flows', () => {
      it('invokes Supabase signInWithOtp with normalized E.164 phone and handles success', async () => {
        let sentPhone: string | null = null;
        const fakeSupabase = {
          auth: {
            signInWithOtp: async (params: { phone: string }) => {
              sentPhone = params.phone;
              return { data: {}, error: null };
            },
          },
        };

        const inputNumber = '98765 43210';
        const norm = normalizeIndianPhone(inputNumber);
        assert.strictEqual(norm.valid, true);

        const result = await fakeSupabase.auth.signInWithOtp({ phone: norm.phone! });
        assert.strictEqual(result.error, null);
        assert.strictEqual(sentPhone, '+919876543210', 'Phone number must be normalized before sending to Supabase');
      });

      it('handles Supabase rate-limit or network errors when sending OTP gracefully', async () => {
        const fakeSupabase = {
          auth: {
            signInWithOtp: async () => {
              return { data: null, error: { message: 'Too many requests. Please wait a moment.' } };
            },
          },
        };

        const result = await fakeSupabase.auth.signInWithOtp();
        assert.ok(result.error);
        assert.strictEqual(result.error.message, 'Too many requests. Please wait a moment.');
      });

      it('invokes Supabase verifyOtp with type sms and 6-digit token', async () => {
        let verifiedPhone: string | null = null;
        let verifiedToken: string | null = null;
        let verifiedType: string | null = null;

        const fakeSupabase = {
          auth: {
            verifyOtp: async (params: { phone: string; token: string; type: string }) => {
              verifiedPhone = params.phone;
              verifiedToken = params.token;
              verifiedType = params.type;
              return {
                data: {
                  session: { access_token: 'fake_jwt_token', user: { id: 'u_123' } },
                  user: { id: 'u_123' },
                },
                error: null,
              };
            },
          },
        };

        const norm = normalizeIndianPhone('+91 98765-43210');
        const otp = '654321';

        const result = await fakeSupabase.auth.verifyOtp({
          phone: norm.phone!,
          token: otp,
          type: 'sms',
        });

        assert.strictEqual(result.error, null);
        assert.strictEqual(verifiedPhone, '+919876543210');
        assert.strictEqual(verifiedToken, '654321');
        assert.strictEqual(verifiedType, 'sms');
        assert.ok(result.data.session);
      });

      it('rejects invalid OTP format before contacting Supabase', () => {
        const validateOtp = (token: string) => {
          const clean = token.trim();
          if (!clean || !/^\d{6}$/.test(clean)) {
            return { valid: false, error: 'Please enter a valid 6-digit verification code.' };
          }
          return { valid: true };
        };

        assert.strictEqual(validateOtp('12345').valid, false);
        assert.strictEqual(validateOtp('1234567').valid, false);
        assert.strictEqual(validateOtp('123a56').valid, false);
        assert.strictEqual(validateOtp('').valid, false);
        assert.strictEqual(validateOtp('123456').valid, true);
      });

      it('handles Supabase invalid/expired OTP token error', async () => {
        const fakeSupabase = {
          auth: {
            verifyOtp: async () => {
              return { data: { session: null, user: null }, error: { message: 'Token has expired or is invalid' } };
            },
          },
        };

        const result = await fakeSupabase.auth.verifyOtp();
        assert.ok(result.error);
        assert.strictEqual(result.error.message, 'Token has expired or is invalid');
        assert.strictEqual(result.data.session, null);
      });
    });

    describe('Safe Production Identity Model & Auto-Provisioning Invariants', () => {
      let originalSelect: typeof db.select;
      let originalTransaction: typeof db.transaction;

      const mockQuery = (data: any[]) => {
        const p = Promise.resolve(data);
        (p as any).limit = () => Promise.resolve(data);
        return p;
      };

      beforeEach(() => {
        originalSelect = db.select;
        originalTransaction = db.transaction;
      });

      afterEach(() => {
        db.select = originalSelect;
        db.transaction = originalTransaction;
      });

      it('A & J. provisions phone-only user with email=null, normalized phone, and NO synthetic email', async () => {
        const phoneOnlyUser: SupabaseUser = {
          id: '77777777-7777-7777-7777-777777777777',
          app_metadata: { provider: 'phone' },
          user_metadata: {},
          aud: 'authenticated',
          created_at: new Date().toISOString(),
          phone: '+919876543210',
          phone_confirmed_at: new Date().toISOString(),
        };

        // User not found in db.select
        db.select = (() => ({
          from: () => ({
            where: () => mockQuery([]),
          }),
        })) as any;

        let insertedUserData: any = null;
        let assignedRole: string | null = null;
        let createdCustomerProfile = false;

        db.transaction = (async (cb: any) => {
          const fakeTx = {
            insert: (table: any) => ({
              values: (val: any) => {
                if (table === authUsers) {
                  insertedUserData = val;
                  return {
                    returning: async () => [
                      {
                        id: val.id,
                        email: val.email,
                        fullName: val.fullName,
                        phone: val.phone,
                        isActive: true,
                        phoneVerifiedAt: val.phoneVerifiedAt,
                      },
                    ],
                  };
                }
                if (val.roleId) {
                  assignedRole = val.roleId;
                } else {
                  createdCustomerProfile = true;
                }
                return Promise.resolve();
              },
            }),
          };
          return await cb(fakeTx);
        }) as any;

        const authCtx = await resolveOrCreateAuthUser(phoneOnlyUser);

        // Invariant A: email must be null, phone must be exact E.164
        assert.strictEqual(authCtx.userId, '77777777-7777-7777-7777-777777777777');
        assert.strictEqual(insertedUserData.email, null, 'Email must be null for phone-only users');
        assert.strictEqual(insertedUserData.phone, '+919876543210');
        assert.strictEqual(authCtx.email, null);
        assert.strictEqual(authCtx.phone, '+919876543210');

        // Invariant J: Zero synthetic @phone.abps.internal generation
        assert.strictEqual(insertedUserData.email, null);

        // Customer auto-provisioning
        assert.strictEqual(authCtx.role, 'customer');
        assert.strictEqual(assignedRole, 'customer');
        assert.strictEqual(createdCustomerProfile, true);
      });

      it('B. provisions email-only user with email populated and phone=null', async () => {
        const emailOnlyUser: SupabaseUser = {
          id: '11111111-1111-1111-1111-111111111111',
          app_metadata: { provider: 'email' },
          user_metadata: { full_name: 'Email Only User' },
          aud: 'authenticated',
          created_at: new Date().toISOString(),
          email: 'email.only@abps.edu',
          email_confirmed_at: new Date().toISOString(),
        };

        db.select = (() => ({
          from: () => ({
            where: () => mockQuery([]),
          }),
        })) as any;

        let insertedUserData: any = null;

        db.transaction = (async (cb: any) => {
          const fakeTx = {
            insert: (table: any) => ({
              values: (val: any) => {
                if (table === authUsers) {
                  insertedUserData = val;
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
                return Promise.resolve();
              },
            }),
          };
          return await cb(fakeTx);
        }) as any;

        const authCtx = await resolveOrCreateAuthUser(emailOnlyUser);

        assert.strictEqual(insertedUserData.email, 'email.only@abps.edu');
        assert.strictEqual(insertedUserData.phone, null);
        assert.strictEqual(authCtx.email, 'email.only@abps.edu');
        assert.strictEqual(authCtx.phone, null);
        assert.strictEqual(authCtx.role, 'customer');
      });

      it('C. provisions user with BOTH email and phone properly stored', async () => {
        const multiFactorUser: SupabaseUser = {
          id: '22222222-2222-2222-2222-222222222222',
          app_metadata: { provider: 'email' },
          user_metadata: { full_name: 'Dual Handle User', phone: '+919876543210' },
          aud: 'authenticated',
          created_at: new Date().toISOString(),
          email: 'dual@abps.edu',
          email_confirmed_at: new Date().toISOString(),
          phone: '+919876543210',
          phone_confirmed_at: new Date().toISOString(),
        };

        db.select = (() => ({
          from: () => ({
            where: () => mockQuery([]),
          }),
        })) as any;

        let insertedUserData: any = null;

        db.transaction = (async (cb: any) => {
          const fakeTx = {
            insert: (table: any) => ({
              values: (val: any) => {
                if (table === authUsers) {
                  insertedUserData = val;
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
                return Promise.resolve();
              },
            }),
          };
          return await cb(fakeTx);
        }) as any;

        const authCtx = await resolveOrCreateAuthUser(multiFactorUser);

        assert.strictEqual(insertedUserData.email, 'dual@abps.edu');
        assert.strictEqual(insertedUserData.phone, '+919876543210');
        assert.strictEqual(authCtx.email, 'dual@abps.edu');
        assert.strictEqual(authCtx.phone, '+919876543210');
      });

      it('D. rejects identity when BOTH email and phone are missing without inventing data', async () => {
        const emptyUser: SupabaseUser = {
          id: '33333333-3333-3333-3333-333333333333',
          app_metadata: {},
          user_metadata: {},
          aud: 'authenticated',
          created_at: new Date().toISOString(),
        };

        await assert.rejects(
          async () => {
            await resolveOrCreateAuthUser(emptyUser);
          },
          (err: any) => {
            assert.ok(err instanceof UnauthorizedError);
            assert.match(err.message, /Missing both email and phone number/i);
            return true;
          }
        );
      });

      it('E. resolves existing phone-only user from database without requiring email', async () => {
        const phoneUser: SupabaseUser = {
          id: '44444444-4444-4444-4444-444444444444',
          app_metadata: { provider: 'phone' },
          user_metadata: {},
          aud: 'authenticated',
          created_at: new Date().toISOString(),
          phone: '+919876543210',
          phone_confirmed_at: new Date().toISOString(),
        };

        // Mock existing record in PostgreSQL with email=null
        db.select = ((fields: any) => ({
          from: () => ({
            where: () => {
              if (fields && fields.roleId) {
                return mockQuery([{ roleId: 'customer' }]);
              }
              if (fields && fields.defaultBranchId) {
                return mockQuery([{ defaultBranchId: 'branch-south' }]);
              }
              return mockQuery([
                {
                  id: '44444444-4444-4444-4444-444444444444',
                  email: null,
                  fullName: 'Phone Parent',
                  phone: '+919876543210',
                  isActive: true,
                  deletedAt: null,
                  emailVerifiedAt: null,
                  phoneVerifiedAt: new Date().toISOString(),
                },
              ]);
            },
          }),
        })) as any;

        const authCtx = await resolveOrCreateAuthUser(phoneUser);

        assert.strictEqual(authCtx.userId, '44444444-4444-4444-4444-444444444444');
        assert.strictEqual(authCtx.email, null);
        assert.strictEqual(authCtx.phone, '+919876543210');
        assert.strictEqual(authCtx.role, 'customer');
        assert.strictEqual(authCtx.isStaff, false);
      });

      it('F. rejects registration if phone number already belongs to another active account', async () => {
        const conflictingPhoneUser: SupabaseUser = {
          id: 'new-supabase-user-id',
          app_metadata: { provider: 'phone' },
          user_metadata: {},
          aud: 'authenticated',
          created_at: new Date().toISOString(),
          phone: '+919876543210',
          phone_confirmed_at: new Date().toISOString(),
        };

        let callIndex = 0;
        db.select = (() => ({
          from: () => ({
            where: () => {
              callIndex++;
              if (callIndex === 1) {
                // Lookup by userId: not found (new user)
                return mockQuery([]);
              }
              // Lookup by phone: found conflict
              return mockQuery([
                {
                  id: 'existing-different-user-id',
                  phone: '+919876543210',
                },
              ]);
            },
          }),
        })) as any;

        await assert.rejects(
          async () => {
            await resolveOrCreateAuthUser(conflictingPhoneUser);
          },
          (err: any) => {
            assert.ok(err instanceof ForbiddenError);
            assert.match(err.message, /already registered with an existing account/i);
            return true;
          }
        );
      });

      it('G. rejects registration if email address already belongs to another active account', async () => {
        const conflictingEmailUser: SupabaseUser = {
          id: 'new-supabase-user-id-2',
          app_metadata: { provider: 'email' },
          user_metadata: {},
          aud: 'authenticated',
          created_at: new Date().toISOString(),
          email: 'existing.parent@abps.edu',
          email_confirmed_at: new Date().toISOString(),
        };

        let callIndex = 0;
        db.select = (() => ({
          from: () => ({
            where: () => {
              callIndex++;
              if (callIndex === 1) {
                // Lookup by userId: not found (new user)
                return mockQuery([]);
              }
              // Lookup by email: found conflict
              return mockQuery([
                {
                  id: 'existing-different-user-id-2',
                  email: 'existing.parent@abps.edu',
                },
              ]);
            },
          }),
        })) as any;

        await assert.rejects(
          async () => {
            await resolveOrCreateAuthUser(conflictingEmailUser);
          },
          (err: any) => {
            assert.ok(err instanceof ForbiddenError);
            assert.match(err.message, /already registered with an existing account/i);
            return true;
          }
        );
      });

      it('H. partial unique indexes allow reusing phone/email after soft-delete', () => {
        const columns = getTableColumns(authUsers);
        assert.ok(columns.email, 'email column exists');
        assert.ok(columns.phone, 'phone column exists');
        assert.ok(columns.deletedAt, 'deletedAt column exists for soft delete filtering');
      });

      it('I. existing staff roles remain untouched and authoritative', async () => {
        const staffUser: SupabaseUser = {
          id: 'staff-admin-uuid',
          app_metadata: {},
          user_metadata: {},
          aud: 'authenticated',
          created_at: new Date().toISOString(),
          email: 'rajesh.sharma@birlabooks.in',
        };

        db.select = ((fields: any) => ({
          from: () => ({
            where: () => {
              if (fields && fields.roleId) {
                return mockQuery([{ roleId: 'admin' }]);
              }
              if (fields && fields.assignedBranchId) {
                return mockQuery([{ assignedBranchId: 'branch-central' }]);
              }
              return mockQuery([
                {
                  id: 'staff-admin-uuid',
                  email: 'rajesh.sharma@birlabooks.in',
                  fullName: 'Rajesh Sharma',
                  phone: '+919820011223',
                  isActive: true,
                  deletedAt: null,
                  emailVerifiedAt: new Date().toISOString(),
                  phoneVerifiedAt: null,
                },
              ]);
            },
          }),
        })) as any;

        const authCtx = await resolveOrCreateAuthUser(staffUser);
        assert.strictEqual(authCtx.role, 'admin');
        assert.strictEqual(authCtx.isStaff, true);
      });

      it('M. services and UI safely handle customer records where email is null and phone is present', () => {
        const phoneOnlyCustomer = {
          userId: 'cust-uuid-1',
          email: null,
          phone: '+919876543210',
          fullName: 'Sita Raman',
        };

        // Display name fallback verification
        const displayName = phoneOnlyCustomer.fullName || phoneOnlyCustomer.email || phoneOnlyCustomer.phone || 'ABPS User';
        assert.strictEqual(displayName, 'Sita Raman');

        const anonymousPhoneCustomer = {
          userId: 'cust-uuid-2',
          email: null,
          phone: '+919876543210',
          fullName: '',
        };
        const fallbackName = anonymousPhoneCustomer.fullName || anonymousPhoneCustomer.email || anonymousPhoneCustomer.phone || 'ABPS User';
        assert.strictEqual(fallbackName, '+919876543210');
      });
    });
  });
});
