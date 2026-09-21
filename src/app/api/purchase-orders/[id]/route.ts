import { NextRequest } from 'next/server';
import { purchaseOrdersService } from '@/server/services/purchase-orders.service';
import { extractAuthContext, requireRole } from '@/server/auth/guard';
import { handleApiError, successResponse } from '@/server/utils/api-response';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const ctx = await extractAuthContext(req);
    if (ctx) {
      requireRole(ctx, ['admin', 'branch_admin', 'warehouse', 'sales']);
    }

    const po = await purchaseOrdersService.getPurchaseOrderById(id, ctx || undefined);
    return successResponse(po);
  } catch (error) {
    return handleApiError(error);
  }
}
