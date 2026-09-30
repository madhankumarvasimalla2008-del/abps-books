import { eq, and, isNull } from 'drizzle-orm';
import { db } from '@/db';
import { authUsers, userRoles, staffProfiles } from '@/db/schema';
import { createSupabaseAdminClient } from '@/lib/supabase/server';
import { getSiteOrigin } from '@/lib/site-url';
import type { SupabaseClient } from '@supabase/supabase-js';

export interface ProvisionAdminInput {
  email: string;
  fullName: string;
  phone?: string | null;
  sendInvite?: boolean;
}

export interface ProvisionAdminResult {
  success: boolean;
  userId: string;
  email: string;
  fullName: string;
  role: 'admin';
  isNewUser: boolean;
  invitationSent: boolean;
  message: string;
}

/**
 * Validates email format using standard regex.
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Server-side provisioning for the central staging administrator.
 *
 * SAFETY INVARIANTS:
 * 1. Supabase Auth is the ONLY authority for credentials/passwords.
 * 2. Zero passwords or password hashes are accepted or stored in PostgreSQL.
 * 3. Guaranteed 1:1 mapping: Supabase Auth UUID === auth_users.id === user_roles.user_id.
 * 4. Assigns strictly the 'admin' role in user_roles.
 * 5. Idempotent: safe to run multiple times without duplicating or corrupting state.
 * 6. Service-role key remains server-only.
 *
 * @param input Admin user details (email, full name, phone, sendInvite flag)
 * @param supabaseAdmin Optional injected Supabase client (used for unit testing/mocking)
 */
export async function provisionAdminUser(
  input: ProvisionAdminInput,
  supabaseAdmin?: SupabaseClient,
  dbInstance: any = db
): Promise<ProvisionAdminResult> {
  const email = input.email?.trim().toLowerCase();
  const fullName = input.fullName?.trim();
  const phone = input.phone?.trim() || null;
  const sendInvite = input.sendInvite !== false; // Default: true

  // 1. Input Validation
  if (!email || !isValidEmail(email)) {
    throw new Error(`Invalid email address provided: "${input.email}". A valid email is required.`);
  }

  if (!fullName || fullName.length < 2) {
    throw new Error('Full name is required and must be at least 2 characters.');
  }

  // 2. Initialize Supabase Admin Client
  const supabase = supabaseAdmin || createSupabaseAdminClient();

  let supabaseUserId: string | null = null;
  let isNewUser = false;
  let invitationSent = false;

  // 3. Supabase Auth User Creation / Invitation
  if (sendInvite) {
    // Standard Supabase flow: sends invitation email with secure password setup link
    const siteOrigin = getSiteOrigin();
    const redirectTo = `${siteOrigin}/auth/callback?next=/admin`;

    const { data: inviteData, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(
      email,
      {
        redirectTo,
        data: {
          full_name: fullName,
          phone: phone || undefined,
        },
      }
    );

    if (!inviteError && inviteData?.user) {
      supabaseUserId = inviteData.user.id;
      isNewUser = true;
      invitationSent = true;
    } else {
      // If invitation fails (e.g. user already registered in Supabase Auth), search existing users
      const { data: listData, error: listError } = await supabase.auth.admin.listUsers();
      if (listError) {
        throw new Error(`Failed to query Supabase Auth users: ${listError.message}`);
      }

      const existingUser = listData.users.find(
        (u) => u.email?.toLowerCase() === email
      );

      if (existingUser) {
        supabaseUserId = existingUser.id;
        isNewUser = false;
        invitationSent = false;
      } else {
        throw new Error(
          `Supabase Auth invitation failed and user could not be resolved: ${inviteError?.message || 'Unknown error'}`
        );
      }
    }
  } else {
    // Admin direct creation (pre-confirmed email, user sets password via recovery/reset flow)
    const { data: createData, error: createError } = await supabase.auth.admin.createUser({
      email,
      user_metadata: {
        full_name: fullName,
        phone: phone || undefined,
      },
      email_confirm: true,
    });

    if (!createError && createData?.user) {
      supabaseUserId = createData.user.id;
      isNewUser = true;
      invitationSent = false;
    } else {
      // User might already exist
      const { data: listData, error: listError } = await supabase.auth.admin.listUsers();
      if (listError) {
        throw new Error(`Failed to query Supabase Auth users: ${listError.message}`);
      }

      const existingUser = listData.users.find(
        (u) => u.email?.toLowerCase() === email
      );

      if (existingUser) {
        supabaseUserId = existingUser.id;
        isNewUser = false;
        invitationSent = false;
      } else {
        throw new Error(
          `Supabase Auth user creation failed: ${createError?.message || 'Unknown error'}`
        );
      }
    }
  }

  if (!supabaseUserId) {
    throw new Error('Could not resolve Supabase Auth user ID.');
  }

  // 4. Synchronize with PostgreSQL Schema in a single transaction
  await dbInstance.transaction(async (tx: any) => {
    // 4a. Check if user already exists in auth_users
    const [existingAuthUser] = await tx
      .select({ id: authUsers.id })
      .from(authUsers)
      .where(eq(authUsers.id, supabaseUserId))
      .limit(1);

    if (!existingAuthUser) {
      // Insert new auth_users identity row
      await tx.insert(authUsers).values({
        id: supabaseUserId,
        email,
        fullName,
        phone,
        isActive: true,
        emailVerifiedAt: new Date().toISOString(),
      });
    } else {
      // Ensure user is active and has correct full name
      await tx
        .update(authUsers)
        .set({
          fullName,
          phone: phone || undefined,
          isActive: true,
          deletedAt: null,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(authUsers.id, supabaseUserId));
    }

    // 4b. Assign strictly the 'admin' role in user_roles
    await tx
      .insert(userRoles)
      .values({
        userId: supabaseUserId,
        roleId: 'admin',
      })
      .onConflictDoNothing();

    // 4c. Ensure staff profile exists for central administrator
    await tx
      .insert(staffProfiles)
      .values({
        userId: supabaseUserId,
        assignedBranchId: null, // Central admin has unrestricted cross-branch access
        department: 'Central Administration',
      })
      .onConflictDoNothing();
  });

  return {
    success: true,
    userId: supabaseUserId,
    email,
    fullName,
    role: 'admin',
    isNewUser,
    invitationSent,
    message: isNewUser
      ? invitationSent
        ? 'Staging administrator created in Supabase Auth and invitation email sent. Synchronized with database.'
        : 'Staging administrator created in Supabase Auth and synchronized with database.'
      : 'Staging administrator already exists in Supabase Auth. Synchronized database records and ensured admin role.',
  };
}
