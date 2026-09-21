import { auditRepository } from '../repositories/audit.repository';
import { AuditLogFilterInput, CreateAuditLogInput } from '../validation/audit';
import { ForbiddenError, NotFoundError, UnauthorizedError } from '../errors';
import { AuthContext } from '../auth/types';

const SENSITIVE_KEY_PATTERNS = [
  /password/i,
  /password_hash/i,
  /cvv/i,
  /pan/i,
  /card_number/i,
  /cardnumber/i,
  /upi_pin/i,
  /upipin/i,
  /\bpin\b/i,
  /banking_password/i,
  /account_number/i,
  /token/i,
  /access_token/i,
  /refresh_token/i,
  /otp/i,
  /auth_token/i,
  /secret/i,
  /api_key/i,
  /apikey/i,
  /private_key/i,
];

/**
 * Recursively sanitize sensitive keys and values from audit details.
 */
export function sanitizeAuditDetails(value: unknown): unknown {
  if (value === null || value === undefined) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeAuditDetails(item));
  }

  if (typeof value === 'object') {
    const sanitizedObj: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      const isSensitive = SENSITIVE_KEY_PATTERNS.some((pattern) => pattern.test(k));
      if (isSensitive) {
        sanitizedObj[k] = '[REDACTED]';
      } else if (typeof v === 'object' && v !== null) {
        sanitizedObj[k] = sanitizeAuditDetails(v);
      } else {
        sanitizedObj[k] = v;
      }
    }
    return sanitizedObj;
  }

  return value;
}

export class AuditService {
  /**
   * Log an auditable event with server-authoritative actor context and sanitized details.
   */
  async log(
    input: {
      action: string;
      entityType: string;
      entityId?: string | null;
      branchId?: string | null;
      details?: Record<string, unknown> | null;
      ipAddress?: string | null;
      userAgent?: string | null;
    },
    ctx?: AuthContext
  ) {
    // Actor identity is server-authoritative from AuthContext
    const actorId = ctx?.userId || null;
    const actorEmail = ctx?.email || null;
    const actorRole = ctx?.role || null;
    const branchId = input.branchId || ctx?.branchId || null;

    const sanitizedDetails = input.details
      ? (sanitizeAuditDetails(input.details) as Record<string, unknown>)
      : null;

    const payload: CreateAuditLogInput = {
      actorId,
      actorEmail,
      actorRole,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId || null,
      branchId,
      details: sanitizedDetails,
      ipAddress: input.ipAddress || null,
      userAgent: input.userAgent || null,
    };

    return await auditRepository.create(payload);
  }

  /**
   * Query audit logs with strict role and branch access scoping.
   */
  async listLogs(filters: AuditLogFilterInput, ctx?: AuthContext) {
    if (!ctx) {
      throw new UnauthorizedError('Authentication required to access audit logs');
    }

    if (ctx.role === 'customer') {
      throw new ForbiddenError('Customers are not permitted to access audit logs');
    }

    // Branch scoping for branch admins and warehouse staff
    if (ctx.role === 'branch_admin' || ctx.role === 'warehouse') {
      if (!ctx.branchId) {
        throw new ForbiddenError('Branch-scoped user has no assigned branch');
      }
      if (filters.branchId && filters.branchId !== ctx.branchId) {
        throw new ForbiddenError('Branch staff cannot view audit logs for other branches');
      }
      filters.branchId = ctx.branchId;
    }

    return await auditRepository.findMany(filters);
  }

  /**
   * Retrieve a single audit log entry by ID with authorization verification.
   */
  async getLogById(id: string, ctx?: AuthContext) {
    if (!ctx) {
      throw new UnauthorizedError('Authentication required to access audit logs');
    }

    if (ctx.role === 'customer') {
      throw new ForbiddenError('Customers are not permitted to access audit logs');
    }

    const log = await auditRepository.findById(id);
    if (!log) {
      throw new NotFoundError('AuditLog', id);
    }

    // Branch staff can only inspect logs belonging to their assigned branch
    if (ctx.role === 'branch_admin' || ctx.role === 'warehouse') {
      if (log.branchId && log.branchId !== ctx.branchId) {
        throw new ForbiddenError('Branch staff cannot access audit logs from other branches');
      }
    }

    return log;
  }
}

export const auditService = new AuditService();
