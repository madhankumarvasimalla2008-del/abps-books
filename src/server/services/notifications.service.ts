import { notificationsRepository } from '../repositories/notifications.repository';
import {
  CreateNotificationInput,
  NotificationFilterInput,
  UpdateNotificationInput,
} from '../validation/notifications';
import { BusinessRuleError, ForbiddenError, NotFoundError } from '../errors';
import { AuthContext } from '../auth/types';

export class NotificationsService {
  async listNotifications(filters: NotificationFilterInput, ctx?: AuthContext) {
    if (ctx) {
      if (ctx.role === 'customer') {
        filters.userId = ctx.userId;
      } else if (!filters.userId && !ctx.isStaff) {
        filters.userId = ctx.userId;
      }
    }
    return await notificationsRepository.findMany(filters);
  }

  async getUnreadCount(userId: string, ctx?: AuthContext) {
    if (ctx && ctx.role === 'customer' && ctx.userId !== userId) {
      throw new ForbiddenError('You do not have permission to view notifications for this user');
    }
    const count = await notificationsRepository.countUnread(userId);
    return { unreadCount: count };
  }

  async getNotificationById(id: string, ctx?: AuthContext) {
    const notification = await notificationsRepository.findById(id);
    if (!notification) {
      throw new NotFoundError('Notification', id);
    }

    if (ctx && ctx.role === 'customer' && notification.userId !== ctx.userId) {
      throw new ForbiddenError('You do not have permission to view this notification');
    }

    return notification;
  }

  async createNotification(input: CreateNotificationInput, ctx?: AuthContext) {
    if (ctx && ctx.role === 'customer' && input.userId !== ctx.userId) {
      throw new ForbiddenError('Customers cannot broadcast notifications to other users');
    }

    return await notificationsRepository.create(input);
  }

  async updateNotification(id: string, input: UpdateNotificationInput, ctx?: AuthContext) {
    const existing = await notificationsRepository.findById(id);
    if (!existing) {
      throw new NotFoundError('Notification', id);
    }

    if (ctx && ctx.role === 'customer' && existing.userId !== ctx.userId) {
      throw new ForbiddenError('You do not have permission to modify this notification');
    }

    const updated = await notificationsRepository.update(id, input);
    if (!updated) {
      throw new NotFoundError('Notification', id);
    }

    return updated;
  }

  async markAsRead(id: string, ctx?: AuthContext) {
    return await this.updateNotification(id, { isRead: true }, ctx);
  }

  async markAllAsRead(userId: string, ctx?: AuthContext) {
    if (ctx && ctx.role === 'customer' && ctx.userId !== userId) {
      throw new ForbiddenError('You do not have permission to update notifications for this user');
    }

    return await notificationsRepository.markAllAsRead(userId);
  }

  async deleteNotification(id: string, ctx?: AuthContext) {
    const existing = await notificationsRepository.findById(id);
    if (!existing) {
      throw new NotFoundError('Notification', id);
    }

    if (ctx && ctx.role === 'customer' && existing.userId !== ctx.userId) {
      throw new ForbiddenError('You do not have permission to delete this notification');
    }

    const deleted = await notificationsRepository.delete(id);
    if (!deleted) {
      throw new NotFoundError('Notification', id);
    }

    return deleted;
  }
}

export const notificationsService = new NotificationsService();
