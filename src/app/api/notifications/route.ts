import { NextRequest } from 'next/server';
import { notificationsService } from '@/server/services/notifications.service';
import { createNotificationSchema, notificationFilterSchema } from '@/server/validation/notifications';
import { extractAuthContext } from '@/server/auth/guard';
import { handleApiError, paginatedResponse, successResponse } from '@/server/utils/api-response';

export async function GET(req: NextRequest) {
  try {
    const ctx = await extractAuthContext(req);
    const { searchParams } = new URL(req.url);
    const rawParams = {
      userId: searchParams.get('userId') || undefined,
      type: searchParams.get('type') || undefined,
      severity: searchParams.get('severity') || undefined,
      isRead: searchParams.get('isRead') || undefined,
      page: searchParams.get('page') || undefined,
      pageSize: searchParams.get('pageSize') || undefined,
      sortBy: searchParams.get('sortBy') || undefined,
      sortOrder: searchParams.get('sortOrder') || undefined,
    };

    const filters = notificationFilterSchema.parse(rawParams);
    const result = await notificationsService.listNotifications(filters, ctx || undefined);
    return paginatedResponse(result);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await extractAuthContext(req);
    const body = await req.json();

    const inputData = {
      ...body,
      userId: body.userId || ctx?.userId,
    };

    const validatedData = createNotificationSchema.parse(inputData);
    const notification = await notificationsService.createNotification(validatedData, ctx || undefined);

    return successResponse(notification, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
