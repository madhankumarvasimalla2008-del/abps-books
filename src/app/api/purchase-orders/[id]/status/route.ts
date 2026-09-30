import { NextRequest } from 'next/server';
import { purchaseOrdersService } from '@/server/services/purchase-orders.service';
import { updatePurchaseOrderStatusSchema } from '@/server/validation/purchase-orders';
import { extractAuthContext, requireAuth, requireRole } from '@/server/auth/guard';
import { handleApiError, successResponse } from '@/server/utils/api-response';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PUT(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const ctx = requireAuth(await extractAuthContext(req));
    requireRole(ctx, ['admin', 'branch_admin', 'warehouse']);

    const body = await req.json();
    const validatedData = updatePurchaseOrderStatusSchema.parse(body);
    const updated = await purchaseOrdersService.updateStatus(id, validatedData, ctx);

    return successResponse(updated);
  } catch (error) {
    return handleApiError(error);
  }
}
