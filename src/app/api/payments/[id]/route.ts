import { NextRequest } from 'next/server';
import { paymentsService } from '@/server/services/payments.service';
import { extractAuthContext, requireAuth, requireRole } from '@/server/auth/guard';
import { handleApiError, successResponse } from '@/server/utils/api-response';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const ctx = requireAuth(await extractAuthContext(req));
    requireRole(ctx, ['admin', 'branch_admin', 'sales']);

    const payment = await paymentsService.getPaymentById(id, ctx);
    return successResponse(payment);
  } catch (error) {
    return handleApiError(error);
  }
}
