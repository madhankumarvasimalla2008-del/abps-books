import { and, desc, eq, gte, ilike, lte, or, sql } from 'drizzle-orm';
import { db } from '@/db';
import { auditLogs, authUsers, branches } from '@/db/schema';
import { AuditLogFilterInput, CreateAuditLogInput } from '../validation/audit';

export class AuditRepository {
  /**
   * Append-only insertion of an immutable audit log record.
   */
  async create(data: CreateAuditLogInput) {
    const [created] = await db
      .insert(auditLogs)
      .values({
        actorId: data.actorId || null,
        actorEmail: data.actorEmail || null,
        actorRole: data.actorRole || null,
        action: data.action,
        entityType: data.entityType,
        entityId: data.entityId || null,
        branchId: data.branchId || null,
        details: data.details || null,
        ipAddress: data.ipAddress || null,
        userAgent: data.userAgent || null,
      })
      .returning();

    return created;
  }

  /**
   * Query filtered, paginated audit logs with actor and branch metadata.
   */
  async findMany(filters: AuditLogFilterInput) {
    const conditions = [];

    if (filters.actorId) {
      conditions.push(eq(auditLogs.actorId, filters.actorId));
    }
    if (filters.action) {
      conditions.push(eq(auditLogs.action, filters.action));
    }
    if (filters.entityType) {
      conditions.push(eq(auditLogs.entityType, filters.entityType));
    }
    if (filters.entityId) {
      conditions.push(eq(auditLogs.entityId, filters.entityId));
    }
    if (filters.branchId) {
      conditions.push(eq(auditLogs.branchId, filters.branchId));
    }
    if (filters.startDate) {
      conditions.push(gte(auditLogs.createdAt, filters.startDate));
    }
    if (filters.endDate) {
      conditions.push(lte(auditLogs.createdAt, filters.endDate));
    }
    if (filters.search) {
      const searchPattern = `%${filters.search}%`;
      conditions.push(
        or(
          ilike(auditLogs.action, searchPattern),
          ilike(auditLogs.entityType, searchPattern),
          ilike(auditLogs.entityId, searchPattern),
          ilike(auditLogs.actorEmail, searchPattern)
        )
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [totalRes] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(auditLogs)
      .where(whereClause);

    const total = totalRes?.count || 0;
    const page = filters.page || 1;
    const pageSize = filters.pageSize || 20;
    const offset = (page - 1) * pageSize;

    const data = await db
      .select({
        id: auditLogs.id,
        actorId: auditLogs.actorId,
        actorEmail: auditLogs.actorEmail,
        actorRole: auditLogs.actorRole,
        action: auditLogs.action,
        entityType: auditLogs.entityType,
        entityId: auditLogs.entityId,
        branchId: auditLogs.branchId,
        branchName: branches.name,
        details: auditLogs.details,
        ipAddress: auditLogs.ipAddress,
        userAgent: auditLogs.userAgent,
        createdAt: auditLogs.createdAt,
      })
      .from(auditLogs)
      .leftJoin(authUsers, eq(auditLogs.actorId, authUsers.id))
      .leftJoin(branches, eq(auditLogs.branchId, branches.id))
      .where(whereClause)
      .orderBy(desc(auditLogs.createdAt))
      .limit(pageSize)
      .offset(offset);

    return {
      data,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize) || 1,
      },
    };
  }

  /**
   * Find a specific audit log record by ID.
   */
  async findById(id: string) {
    const [result] = await db
      .select({
        id: auditLogs.id,
        actorId: auditLogs.actorId,
        actorEmail: auditLogs.actorEmail,
        actorRole: auditLogs.actorRole,
        action: auditLogs.action,
        entityType: auditLogs.entityType,
        entityId: auditLogs.entityId,
        branchId: auditLogs.branchId,
        branchName: branches.name,
        details: auditLogs.details,
        ipAddress: auditLogs.ipAddress,
        userAgent: auditLogs.userAgent,
        createdAt: auditLogs.createdAt,
      })
      .from(auditLogs)
      .leftJoin(authUsers, eq(auditLogs.actorId, authUsers.id))
      .leftJoin(branches, eq(auditLogs.branchId, branches.id))
      .where(eq(auditLogs.id, id))
      .limit(1);

    return result || null;
  }
}

export const auditRepository = new AuditRepository();
