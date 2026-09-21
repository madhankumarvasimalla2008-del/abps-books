import { AuthContext, UserRole } from './types';
import { UnauthorizedError, ForbiddenError } from '../errors';
import { resolveAuthContextFromRequest } from './session';

/**
 * Ensures that an active user session context exists.
 */
export function requireAuth(ctx?: AuthContext | null): AuthContext {
  if (!ctx || !ctx.userId) {
    throw new UnauthorizedError('Authentication required to access this resource');
  }
  return ctx;
}

/**
 * Ensures the authenticated user possesses one of the allowed roles.
 */
export function requireRole(ctx: AuthContext, allowedRoles: UserRole[]): void {
  if (!allowedRoles.includes(ctx.role)) {
    throw new ForbiddenError(
      `Access denied. Required role: [${allowedRoles.join(', ')}], current role: '${ctx.role}'`
    );
  }
}

/**
 * Validates branch-level access control. Central admins can access any branch;
 * branch_admins can only access their assigned branch.
 */
export function requireBranchAccess(ctx: AuthContext, branchId: string): void {
  if (ctx.role === 'admin') {
    return;
  }
  if (ctx.role === 'branch_admin' && ctx.branchId === branchId) {
    return;
  }
  throw new ForbiddenError(`Access denied to branch resource '${branchId}'`);
}

/**
 * Extracts identity and authorization context from an incoming Request.
 * Resolves Supabase JWT/cookie sessions and safely queries PostgreSQL for business roles.
 *
 * SAFETY CONSTRAINT: Development identity headers (x-user-id, x-user-role, etc.)
 * are ONLY permitted in development/test environments.
 * In production (NODE_ENV === 'production'), dev header fallback is strictly disabled
 * and never trusted, returning null if no genuine Supabase auth session exists.
 */
export async function extractAuthContext(req: Request): Promise<AuthContext | null> {
  return await resolveAuthContextFromRequest(req);
}

