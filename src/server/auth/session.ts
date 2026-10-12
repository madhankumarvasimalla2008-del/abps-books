import { eq, and, isNull, ne } from 'drizzle-orm';
import { db } from '@/db';
import { authUsers, userRoles, roles, customerProfiles, staffProfiles } from '@/db/schema';
import { AuthContext, UserRole } from './types';
import { ForbiddenError, UnauthorizedError } from '../errors';
import { createSupabaseClientFromRequest, createSupabaseServerClient } from '@/lib/supabase/server';
import type { User as SupabaseUser, SupabaseClient } from '@supabase/supabase-js';
import { normalizeIndianPhone } from '@/lib/phone';

const ROLE_HIERARCHY: Record<UserRole, number> = {
  admin: 100,
  branch_admin: 80,
  warehouse: 60,
  sales: 40,
  customer: 10,
};

/**
 * Resolves or auto-provisions a business identity record in auth_users from a Supabase Auth user.
 * Strictly guarantees 1:1 mapping between Supabase user.id and auth_users.id.
 * Supports email-only, phone-only, or multi-factor identities without synthetic data invention.
 * Enforces account status gating (rejects inactive users).
 * Resolves authoritative roles from the database rather than trusting client claims.
 */
export async function resolveOrCreateAuthUser(supabaseUser: SupabaseUser): Promise<AuthContext> {
  const userId = supabaseUser.id;
  const rawEmail = supabaseUser.email ? supabaseUser.email.toLowerCase().trim() : null;
  const rawPhone = (supabaseUser.user_metadata?.phone as string) || supabaseUser.phone || null;

  // Normalize phone if present
  let phone: string | null = null;
  if (rawPhone) {
    const norm = normalizeIndianPhone(rawPhone);
    phone = norm.valid && norm.phone ? norm.phone : rawPhone.trim();
  }

  // Reject identity if both email and phone are absent
  if (!userId || (!rawEmail && !phone)) {
    throw new UnauthorizedError('Invalid Supabase user identity: Missing both email and phone number');
  }

  // 1. Check if user already exists in PostgreSQL auth_users by Supabase user.id
  const [existingUser] = await db
    .select({
      id: authUsers.id,
      email: authUsers.email,
      fullName: authUsers.fullName,
      phone: authUsers.phone,
      isActive: authUsers.isActive,
      deletedAt: authUsers.deletedAt,
      emailVerifiedAt: authUsers.emailVerifiedAt,
      phoneVerifiedAt: authUsers.phoneVerifiedAt,
    })
    .from(authUsers)
    .where(and(eq(authUsers.id, userId), isNull(authUsers.deletedAt)))
    .limit(1);

  if (existingUser) {
    // Account Status Gating: Inactive accounts are denied access
    if (!existingUser.isActive) {
      throw new ForbiddenError('Account is deactivated. Please contact your ABPS administrator.');
    }

    // Account Continuity & Handle Updates (without automatic merging)
    const needsPhoneUpdate = Boolean(phone && phone !== existingUser.phone);
    const needsEmailUpdate = Boolean(rawEmail && rawEmail !== existingUser.email);
    const needsPhoneVerify = Boolean(supabaseUser.phone_confirmed_at && !existingUser.phoneVerifiedAt);
    const needsEmailVerify = Boolean(supabaseUser.email_confirmed_at && !existingUser.emailVerifiedAt);

    if (needsPhoneUpdate || needsEmailUpdate || needsPhoneVerify || needsEmailVerify) {
      if (needsPhoneUpdate && phone) {
        // Enforce phone uniqueness across distinct active accounts
        const [phoneConflict] = await db
          .select({ id: authUsers.id })
          .from(authUsers)
          .where(and(eq(authUsers.phone, phone), ne(authUsers.id, userId), isNull(authUsers.deletedAt)))
          .limit(1);
        if (phoneConflict) {
          throw new ForbiddenError('This phone number is already associated with another active ABPS account.');
        }
      }

      if (needsEmailUpdate && rawEmail) {
        // Enforce email uniqueness across distinct active accounts
        const [emailConflict] = await db
          .select({ id: authUsers.id })
          .from(authUsers)
          .where(and(eq(authUsers.email, rawEmail), ne(authUsers.id, userId), isNull(authUsers.deletedAt)))
          .limit(1);
        if (emailConflict) {
          throw new ForbiddenError('This email address is already associated with another active ABPS account.');
        }
      }

      await db
        .update(authUsers)
        .set({
          email: rawEmail || existingUser.email,
          phone: phone || existingUser.phone,
          phoneVerifiedAt: supabaseUser.phone_confirmed_at || existingUser.phoneVerifiedAt,
          emailVerifiedAt: supabaseUser.email_confirmed_at || existingUser.emailVerifiedAt,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(authUsers.id, userId));
    }

    // 2. Fetch authoritative roles from user_roles + roles
    const assignedRoles = await db
      .select({
        roleId: userRoles.roleId,
      })
      .from(userRoles)
      .where(eq(userRoles.userId, userId));

    let effectiveRole: UserRole = 'customer';
    if (assignedRoles.length > 0) {
      // Pick highest privilege role according to hierarchy
      const validAssigned = assignedRoles
        .map((r) => r.roleId as UserRole)
        .filter((r): r is UserRole => r in ROLE_HIERARCHY);

      if (validAssigned.length > 0) {
        validAssigned.sort((a, b) => ROLE_HIERARCHY[b] - ROLE_HIERARCHY[a]);
        effectiveRole = validAssigned[0];
      }
    } else {
      // Assign default customer role if missing
      await db
        .insert(userRoles)
        .values({
          userId,
          roleId: 'customer',
        })
        .onConflictDoNothing();
    }

    const isStaff = ['admin', 'branch_admin', 'warehouse', 'sales'].includes(effectiveRole);
    let branchId: string | null = null;

    if (isStaff) {
      const [staff] = await db
        .select({ assignedBranchId: staffProfiles.assignedBranchId })
        .from(staffProfiles)
        .where(eq(staffProfiles.userId, userId))
        .limit(1);
      branchId = staff?.assignedBranchId || null;
    } else {
      const [customer] = await db
        .select({ defaultBranchId: customerProfiles.defaultBranchId })
        .from(customerProfiles)
        .where(eq(customerProfiles.userId, userId))
        .limit(1);
      branchId = customer?.defaultBranchId || null;
    }

    return {
      userId: existingUser.id,
      email: rawEmail || existingUser.email || null,
      phone: phone || existingUser.phone || null,
      fullName: existingUser.fullName,
      role: effectiveRole,
      branchId,
      isStaff,
    };
  }

  // 3. User does not exist in auth_users -> Pre-provisioning conflict validation
  if (phone) {
    const [existingPhone] = await db
      .select({ id: authUsers.id })
      .from(authUsers)
      .where(and(eq(authUsers.phone, phone), isNull(authUsers.deletedAt)))
      .limit(1);
    if (existingPhone) {
      throw new ForbiddenError('This phone number is already registered with an existing account. Please sign in with your existing account.');
    }
  }

  if (rawEmail) {
    const [existingEmail] = await db
      .select({ id: authUsers.id })
      .from(authUsers)
      .where(and(eq(authUsers.email, rawEmail), isNull(authUsers.deletedAt)))
      .limit(1);
    if (existingEmail) {
      throw new ForbiddenError('This email address is already registered with an existing account. Please sign in with your existing account.');
    }
  }

  // 4. Safe Auto-Provisioning (Public users are strictly assigned customer role)
  const fullName =
    (supabaseUser.user_metadata?.full_name as string) ||
    (supabaseUser.user_metadata?.name as string) ||
    (rawEmail ? rawEmail.split('@')[0] : (phone ? `User ${phone}` : 'ABPS User'));

  return await db.transaction(async (tx) => {
    const [newUser] = await tx
      .insert(authUsers)
      .values({
        id: userId,
        email: rawEmail,
        fullName,
        phone,
        isActive: true,
        emailVerifiedAt: supabaseUser.email_confirmed_at || (rawEmail ? new Date().toISOString() : null),
        phoneVerifiedAt: supabaseUser.phone_confirmed_at || (phone ? new Date().toISOString() : null),
      })
      .returning();

    // Default role: customer strictly
    await tx.insert(userRoles).values({
      userId: newUser.id,
      roleId: 'customer',
    });

    // Create default customer profile
    await tx.insert(customerProfiles).values({
      userId: newUser.id,
    });

    return {
      userId: newUser.id,
      email: newUser.email || null,
      phone: newUser.phone || null,
      fullName: newUser.fullName,
      role: 'customer' as UserRole,
      branchId: null,
      isStaff: false,
    };
  });
}

/**
 * Resolves the authenticated user context from an incoming Request.
 * Supports Supabase JWT (Authorization header), Supabase session cookies,
 * and safe dev headers in development/testing mode only.
 */
export async function resolveAuthContextFromRequest(req: Request): Promise<AuthContext | null> {
  const authHeader = req.headers.get('authorization');
  let token: string | null = null;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  }

  // 1. If Supabase token or cookie is available, verify via Supabase Auth
  try {
    let supabase: SupabaseClient;
    try {
      // In Route Handlers where next/headers cookies() is active, createSupabaseServerClient
      // allows Supabase SSR to persist refreshed session cookies to the response.
      supabase = await createSupabaseServerClient();
    } catch {
      // In test runners or contexts where next/headers is not active, fall back to request client
      supabase = createSupabaseClientFromRequest(req);
    }

    let supabaseUser: SupabaseUser | null = null;

    if (token) {
      const { data, error } = await supabase.auth.getUser(token);
      if (!error && data?.user) {
        supabaseUser = data.user;
      } else if (error && (process.env.NODE_ENV !== 'production' || process.env.AUTH_DEBUG === 'true')) {
        console.warn('[auth] Bearer token verification failed:', error.message);
      }
    } else {
      const { data, error } = await supabase.auth.getUser();
      if (!error && data?.user) {
        supabaseUser = data.user;
      } else if (error && (process.env.NODE_ENV !== 'production' || process.env.AUTH_DEBUG === 'true')) {
        console.warn('[auth] Cookie session verification failed:', error.message);
      }
    }

    if (supabaseUser) {
      return await resolveOrCreateAuthUser(supabaseUser);
    }
  } catch (err: unknown) {
    if (process.env.NODE_ENV !== 'production' || process.env.AUTH_DEBUG === 'true') {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn('[auth] Unexpected error during session resolution:', msg);
    }
  }

  // 2. Production Safety: Dev headers are NEVER accepted in production
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  // 3. Development / Test environment fallback headers
  const devUserId = req.headers.get('x-user-id');
  const devRole = req.headers.get('x-user-role') as UserRole | null;
  const devEmail = req.headers.get('x-user-email');
  const devName = req.headers.get('x-user-name') || undefined;
  const devBranchId = req.headers.get('x-user-branch-id');

  if (!devUserId || !devRole || !devEmail) {
    return null;
  }

  const validRoles: UserRole[] = ['admin', 'branch_admin', 'warehouse', 'sales', 'customer'];
  if (!validRoles.includes(devRole)) {
    return null;
  }

  const isStaff = ['admin', 'branch_admin', 'warehouse', 'sales'].includes(devRole);

  return {
    userId: devUserId,
    email: devEmail,
    fullName: devName,
    role: devRole,
    branchId: devBranchId || null,
    isStaff,
  };
}
