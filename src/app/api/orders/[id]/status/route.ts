import { NextRequest } from 'next/server';
import { ordersService } from '@/server/services/orders.service';
import { updateOrderStatusSchema } from '@/server/validation/orders';
import { extractAuthContext, requireRole } from '@/server/auth/guard';
import { handleApiError, successResponse } from '@/server/utils/api-response';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PUT(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const ctx = await extractAuthContext(req);
    if (ctx) {
      requireRole(ctx, ['admin', 'branch_admin', 'warehouse', 'sales']);
    }

    const body = await req.json();
    const validatedData = updateOrderStatusSchema.parse(body);
    const updated = await ordersService.updateStatus(id, validatedData, ctx || undefined);

    return successResponse(updated);
  } catch (error) {
    return handleApiError(error);
  }
}
