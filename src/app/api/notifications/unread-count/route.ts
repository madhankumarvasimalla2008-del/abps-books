import { NextRequest } from 'next/server';
import { notificationsService } from '@/server/services/notifications.service';
import { extractAuthContext } from '@/server/auth/guard';
import { handleApiError, successResponse } from '@/server/utils/api-response';

export async function GET(req: NextRequest) {
  try {
    const ctx = await extractAuthContext(req);
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId') || ctx?.userId;

    if (!userId) {
      return successResponse({ unreadCount: 0 });
    }

    const result = await notificationsService.getUnreadCount(userId, ctx || undefined);
    return successResponse(result);
  } catch (error) {
    return handleApiError(error);
  }
}
