import { NextRequest } from 'next/server';
import { ordersService } from '@/server/services/orders.service';
import { extractAuthContext, requireAuth } from '@/server/auth/guard';
import { handleApiError, successResponse } from '@/server/utils/api-response';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const ctx = requireAuth(await extractAuthContext(req));
    const order = await ordersService.getOrderById(id, ctx);

    return successResponse(order);
  } catch (error) {
    return handleApiError(error);
  }
}
