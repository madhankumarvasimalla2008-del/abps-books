import { NextRequest } from 'next/server';
import { notificationsService } from '@/server/services/notifications.service';
import { extractAuthContext, requireAuth } from '@/server/auth/guard';
import { handleApiError, successResponse } from '@/server/utils/api-response';

export async function GET(req: NextRequest) {
  try {
    const ctx = requireAuth(await extractAuthContext(req));
    const { searchParams } = new URL(req.url);
    const userId = ctx.role === 'customer' ? ctx.userId : (searchParams.get('userId') || ctx.userId);

    const result = await notificationsService.getUnreadCount(userId, ctx);
    return successResponse(result);
  } catch (error) {
    return handleApiError(error);
  }
}
