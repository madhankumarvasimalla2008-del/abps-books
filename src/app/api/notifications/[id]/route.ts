import { NextRequest } from 'next/server';
import { notificationsService } from '@/server/services/notifications.service';
import { updateNotificationSchema } from '@/server/validation/notifications';
import { extractAuthContext } from '@/server/auth/guard';
import { handleApiError, successResponse } from '@/server/utils/api-response';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const ctx = await extractAuthContext(req);
    const notification = await notificationsService.getNotificationById(id, ctx || undefined);

    return successResponse(notification);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const ctx = await extractAuthContext(req);
    const body = await req.json();

    const validatedData = updateNotificationSchema.parse(body);
    const notification = await notificationsService.updateNotification(id, validatedData, ctx || undefined);

    return successResponse(notification);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const ctx = await extractAuthContext(req);
    const notification = await notificationsService.deleteNotification(id, ctx || undefined);

    return successResponse(notification);
  } catch (error) {
    return handleApiError(error);
  }
}
