import { NextRequest } from 'next/server';
import { notificationsService } from '@/server/services/notifications.service';
import { extractAuthContext, requireAuth } from '@/server/auth/guard';
import { handleApiError, successResponse } from '@/server/utils/api-response';
import { UnauthorizedError } from '@/server/errors';

export async function POST(req: NextRequest) {
  try {
    const ctx = requireAuth(await extractAuthContext(req));
    let userId: string | undefined;

    try {
      const body = await req.json();
      userId = body?.userId;
    } catch {
      // Empty or non-JSON body is acceptable if user context exists
    }

    if (ctx.role === 'customer') {
      userId = ctx.userId;
    } else {
      userId = userId || ctx.userId;
    }

    const result = await notificationsService.markAllAsRead(userId, ctx);
    return successResponse(result);
  } catch (error) {
    return handleApiError(error);
  }
}
