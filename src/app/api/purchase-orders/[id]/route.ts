import { NextRequest } from 'next/server';
import { purchaseOrdersService } from '@/server/services/purchase-orders.service';
import { extractAuthContext, requireAuth, requireRole } from '@/server/auth/guard';
import { handleApiError, successResponse } from '@/server/utils/api-response';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const ctx = requireAuth(await extractAuthContext(req));
    requireRole(ctx, ['admin', 'branch_admin', 'warehouse', 'sales']);

    const po = await purchaseOrdersService.getPurchaseOrderById(id, ctx);
    return successResponse(po);
  } catch (error) {
    return handleApiError(error);
  }
}
