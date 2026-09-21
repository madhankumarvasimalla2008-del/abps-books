import { and, desc, eq, sql } from 'drizzle-orm';
import { db } from '@/db';
import { notifications, authUsers } from '@/db/schema';
import {
  CreateNotificationInput,
  NotificationFilterInput,
  UpdateNotificationInput,
} from '../validation/notifications';

export class NotificationsRepository {
  async findMany(filters: NotificationFilterInput) {
    const conditions = [];

    if (filters.userId) {
      conditions.push(eq(notifications.userId, filters.userId));
    }
    if (filters.type) {
      conditions.push(eq(notifications.type, filters.type));
    }
    if (filters.severity) {
      conditions.push(eq(notifications.severity, filters.severity));
    }
    if (filters.isRead !== undefined) {
      conditions.push(eq(notifications.isRead, filters.isRead));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [totalRes] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(notifications)
      .where(whereClause);

    const total = totalRes?.count || 0;
    const page = filters.page || 1;
    const pageSize = filters.pageSize || 20;
    const offset = (page - 1) * pageSize;

    const data = await db
      .select({
        id: notifications.id,
        userId: notifications.userId,
        userEmail: authUsers.email,
        title: notifications.title,
        message: notifications.message,
        type: notifications.type,
        severity: notifications.severity,
        actionUrl: notifications.actionUrl,
        isRead: notifications.isRead,
        readAt: notifications.readAt,
        createdAt: notifications.createdAt,
      })
      .from(notifications)
      .leftJoin(authUsers, eq(notifications.userId, authUsers.id))
      .where(whereClause)
      .orderBy(desc(notifications.createdAt))
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

  async findById(id: string) {
    const [result] = await db
      .select({
        id: notifications.id,
        userId: notifications.userId,
        userEmail: authUsers.email,
        title: notifications.title,
        message: notifications.message,
        type: notifications.type,
        severity: notifications.severity,
        actionUrl: notifications.actionUrl,
        isRead: notifications.isRead,
        readAt: notifications.readAt,
        createdAt: notifications.createdAt,
      })
      .from(notifications)
      .leftJoin(authUsers, eq(notifications.userId, authUsers.id))
      .where(eq(notifications.id, id))
      .limit(1);

    return result || null;
  }

  async countUnread(userId: string): Promise<number> {
    const [res] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(notifications)
      .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));

    return res?.count || 0;
  }

  async create(data: CreateNotificationInput) {
    const [created] = await db
      .insert(notifications)
      .values({
        userId: data.userId,
        title: data.title,
        message: data.message,
        type: data.type,
        severity: data.severity,
        actionUrl: data.actionUrl || null,
        isRead: false,
      })
      .returning();

    return created;
  }

  async update(id: string, data: UpdateNotificationInput) {
    const values: any = {};
    if (data.isRead !== undefined) {
      values.isRead = data.isRead;
      values.readAt = data.isRead ? new Date().toISOString() : null;
    }

    const [updated] = await db
      .update(notifications)
      .set(values)
      .where(eq(notifications.id, id))
      .returning();

    return updated || null;
  }

  async markAllAsRead(userId: string) {
    const nowStr = new Date().toISOString();
    const updated = await db
      .update(notifications)
      .set({
        isRead: true,
        readAt: nowStr,
      })
      .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)))
      .returning();

    return {
      success: true,
      count: updated.length,
    };
  }

  async delete(id: string) {
    const [deleted] = await db
      .delete(notifications)
      .where(eq(notifications.id, id))
      .returning();

    return deleted || null;
  }
}

export const notificationsRepository = new NotificationsRepository();
