import { NextRequest } from 'next/server';
import { notificationsService } from '@/server/services/notifications.service';
import { extractAuthContext } from '@/server/auth/guard';
import { handleApiError, successResponse } from '@/server/utils/api-response';
import { UnauthorizedError } from '@/server/errors';

export async function POST(req: NextRequest) {
  try {
    const ctx = await extractAuthContext(req);
    let userId: string | undefined;

    try {
      const body = await req.json();
      userId = body?.userId;
    } catch {
      // Empty or non-JSON body is acceptable if user context exists
    }

    userId = userId || ctx?.userId;

    if (!userId) {
      throw new UnauthorizedError('User ID is required to mark notifications as read');
    }

    const result = await notificationsService.markAllAsRead(userId, ctx || undefined);
    return successResponse(result);
  } catch (error) {
    return handleApiError(error);
  }
}
