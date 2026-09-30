import { NextRequest } from 'next/server';
import { paymentsService } from '@/server/services/payments.service';
import { paymentFilterSchema } from '@/server/validation/payments';
import { extractAuthContext, requireAuth, requireRole } from '@/server/auth/guard';
import { handleApiError, paginatedResponse } from '@/server/utils/api-response';

export async function GET(req: NextRequest) {
  try {
    const ctx = requireAuth(await extractAuthContext(req));
    requireRole(ctx, ['admin', 'branch_admin', 'sales']);

    const { searchParams } = new URL(req.url);
    const rawParams = {
      orderId: searchParams.get('orderId') || undefined,
      paymentMethod: searchParams.get('paymentMethod') || undefined,
      status: searchParams.get('status') || undefined,
      transactionId: searchParams.get('transactionId') || undefined,
      fromDate: searchParams.get('fromDate') || undefined,
      toDate: searchParams.get('toDate') || undefined,
      page: searchParams.get('page') || undefined,
      pageSize: searchParams.get('pageSize') || undefined,
      sortBy: searchParams.get('sortBy') || undefined,
      sortOrder: searchParams.get('sortOrder') || undefined,
    };

    const filters = paymentFilterSchema.parse(rawParams);
    const result = await paymentsService.listPayments(filters, ctx || undefined);
    return paginatedResponse(result);
  } catch (error) {
    return handleApiError(error);
  }
}
