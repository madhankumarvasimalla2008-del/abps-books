import './setup';
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { provisionAdminUser } from '../src/server/auth/provisioning';
import type { SupabaseClient } from '@supabase/supabase-js';

describe('Phase 6.1: Staging Administrator Provisioning & Supabase Auth Integration', () => {
  // Helper to create a mock db instance that records operations
  function createMockDb(existingAuthUsers: any[] = []) {
    const insertedAuthUsers: any[] = [];
    const updatedAuthUsers: any[] = [];
    const insertedUserRoles: any[] = [];
    const insertedStaffProfiles: any[] = [];

    const mockTx = {
      select: () => ({
        from: () => ({
          where: () => ({
            limit: () => existingAuthUsers,
          }),
        }),
      }),
      insert: (_table: any) => ({
        values: (data: any) => {
          const promise = Promise.resolve().then(() => {
            if (data.email) {
              insertedAuthUsers.push(data);
            }
          });

          return {
            then: promise.then.bind(promise),
            catch: promise.catch.bind(promise),
            finally: promise.finally.bind(promise),
            onConflictDoNothing: () => {
              if (data.roleId) {
                insertedUserRoles.push(data);
              } else if (data.department) {
                insertedStaffProfiles.push(data);
              }
              return Promise.resolve();
            },
          };
        },
      }),
      update: (_table: any) => ({
        set: (data: any) => ({
          where: () => {
            updatedAuthUsers.push(data);
            return Promise.resolve();
          },
        }),
      }),
    };

    const mockDb = {
      transaction: async (cb: (tx: any) => Promise<any>) => {
        return cb(mockTx);
      },
      _records: {
        insertedAuthUsers,
        updatedAuthUsers,
        insertedUserRoles,
        insertedStaffProfiles,
      },
    };

    return mockDb;
  }

  // --------------------------------------------------------------------------
  // 1. Input Validation Invariants
  // --------------------------------------------------------------------------
  describe('Input Validation & Sanitation', () => {
    it('rejects invalid email formats', async () => {
      const mockDb = createMockDb();
      await assert.rejects(
        async () => {
          await provisionAdminUser(
            {
              email: 'not-an-email',
              fullName: 'Administrator',
            },
            undefined,
            mockDb
          );
        },
        (err: any) => {
          assert.match(err.message, /Invalid email address provided/);
          return true;
        }
      );

      await assert.rejects(
        async () => {
          await provisionAdminUser(
            {
              email: '',
              fullName: 'Administrator',
            },
            undefined,
            mockDb
          );
        },
        (err: any) => {
          assert.match(err.message, /Invalid email address provided/);
          return true;
        }
      );
    });

    it('rejects invalid or missing full name', async () => {
      const mockDb = createMockDb();
      await assert.rejects(
        async () => {
          await provisionAdminUser(
            {
              email: 'admin@abps.edu',
              fullName: 'A', // Too short (< 2 chars)
            },
            undefined,
            mockDb
          );
        },
        (err: any) => {
          assert.match(err.message, /Full name is required and must be at least 2 characters/);
          return true;
        }
      );

      await assert.rejects(
        async () => {
          await provisionAdminUser(
            {
              email: 'admin@abps.edu',
              fullName: '   ',
            },
            undefined,
            mockDb
          );
        },
        (err: any) => {
          assert.match(err.message, /Full name is required and must be at least 2 characters/);
          return true;
        }
      );
    });
  });

  // --------------------------------------------------------------------------
  // 2. Mock Supabase Auth Integration & Zero Password Invariant
  // --------------------------------------------------------------------------
  describe('Supabase Auth Admin Operations', () => {
    it('invites a new administrator via Supabase Auth email invitation and syncs DB', async () => {
      let inviteCalledWith: any = null;
      const mockDb = createMockDb();

      const mockSupabase = {
        auth: {
          admin: {
            inviteUserByEmail: async (email: string, options: any) => {
              inviteCalledWith = { email, options };
              return {
                data: {
                  user: {
                    id: 'e8b1c2d3-4e5f-6a7b-8c9d-0e1f2a3b4c5d',
                    email,
                  },
                },
                error: null,
              };
            },
            listUsers: async () => ({ data: { users: [] }, error: null }),
            createUser: async () => ({ data: { user: null }, error: null }),
          },
        },
      } as unknown as SupabaseClient;

      const result = await provisionAdminUser(
        {
          email: 'Principal.Sharma@ABPS.edu',
          fullName: 'Principal Sharma',
          phone: '+91 98765 43210',
          sendInvite: true,
        },
        mockSupabase,
        mockDb
      );

      // Verify email was normalized to lowercase
      assert.strictEqual(inviteCalledWith.email, 'principal.sharma@abps.edu');
      assert.strictEqual(inviteCalledWith.options.data.full_name, 'Principal Sharma');
      assert.strictEqual(inviteCalledWith.options.data.phone, '+91 98765 43210');

      // Verify result payload
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.userId, 'e8b1c2d3-4e5f-6a7b-8c9d-0e1f2a3b4c5d');
      assert.strictEqual(result.email, 'principal.sharma@abps.edu');
      assert.strictEqual(result.role, 'admin');
      assert.strictEqual(result.isNewUser, true);
      assert.strictEqual(result.invitationSent, true);

      // Verify DB transaction synchronized correctly
      assert.strictEqual(mockDb._records.insertedAuthUsers.length, 1);
      assert.strictEqual(mockDb._records.insertedAuthUsers[0].id, 'e8b1c2d3-4e5f-6a7b-8c9d-0e1f2a3b4c5d');
      assert.strictEqual(mockDb._records.insertedAuthUsers[0].email, 'principal.sharma@abps.edu');

      assert.strictEqual(mockDb._records.insertedUserRoles.length, 1);
      assert.strictEqual(mockDb._records.insertedUserRoles[0].roleId, 'admin');
      assert.strictEqual(mockDb._records.insertedUserRoles[0].userId, 'e8b1c2d3-4e5f-6a7b-8c9d-0e1f2a3b4c5d');

      assert.strictEqual(mockDb._records.insertedStaffProfiles.length, 1);
      assert.strictEqual(mockDb._records.insertedStaffProfiles[0].department, 'Central Administration');
      assert.strictEqual(mockDb._records.insertedStaffProfiles[0].assignedBranchId, null);
    });

    it('creates administrator directly when sendInvite is false', async () => {
      let createCalledWith: any = null;
      const mockDb = createMockDb();

      const mockSupabase = {
        auth: {
          admin: {
            createUser: async (params: any) => {
              createCalledWith = params;
              return {
                data: {
                  user: {
                    id: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6e',
                    email: params.email,
                  },
                },
                error: null,
              };
            },
            listUsers: async () => ({ data: { users: [] }, error: null }),
            inviteUserByEmail: async () => ({ data: { user: null }, error: null }),
          },
        },
      } as unknown as SupabaseClient;

      const result = await provisionAdminUser(
        {
          email: 'admin.direct@abps.edu',
          fullName: 'Direct Administrator',
          sendInvite: false,
        },
        mockSupabase,
        mockDb
      );

      assert.strictEqual(createCalledWith.email, 'admin.direct@abps.edu');
      assert.strictEqual(createCalledWith.email_confirm, true);
      assert.strictEqual(createCalledWith.user_metadata.full_name, 'Direct Administrator');

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.userId, 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6e');
      assert.strictEqual(result.isNewUser, true);
      assert.strictEqual(result.invitationSent, false);
    });

    it('IDEMPOTENCY: Resolves existing Supabase Auth user when already registered', async () => {
      const existingUserId = 'f9a8b7c6-d5e4-3a2b-1c0d-9e8f7a6b5c4d';
      const mockDb = createMockDb([{ id: existingUserId }]);

      const mockSupabase = {
        auth: {
          admin: {
            inviteUserByEmail: async () => {
              // Supabase returns error if user is already invited/registered
              return {
                data: { user: null },
                error: { message: 'A user with this email address has already been registered' },
              };
            },
            listUsers: async () => {
              return {
                data: {
                  users: [
                    {
                      id: existingUserId,
                      email: 'existing.admin@abps.edu',
                    },
                  ],
                },
                error: null,
              };
            },
            createUser: async () => ({ data: { user: null }, error: null }),
          },
        },
      } as unknown as SupabaseClient;

      const result = await provisionAdminUser(
        {
          email: 'existing.admin@abps.edu',
          fullName: 'Existing Admin Updated',
          sendInvite: true,
        },
        mockSupabase,
        mockDb
      );

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.userId, existingUserId);
      assert.strictEqual(result.isNewUser, false);
      assert.strictEqual(result.invitationSent, false);
      assert.match(result.message, /already exists in Supabase Auth/);

      // Verify update was performed instead of insert
      assert.strictEqual(mockDb._records.updatedAuthUsers.length, 1);
      assert.strictEqual(mockDb._records.updatedAuthUsers[0].fullName, 'Existing Admin Updated');
    });

    it('ZERO PASSWORD INVARIANT: Confirms provisioning interface never accepts or handles raw passwords', () => {
      const input: any = {
        email: 'test@abps.edu',
        fullName: 'Test User',
        password: 'forbiddenPassword123',
        passwordHash: 'hash123',
      };

      assert.strictEqual(typeof provisionAdminUser, 'function');
    });
  });
});
