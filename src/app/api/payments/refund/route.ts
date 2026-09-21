import { NextRequest } from 'next/server';
import { paymentsService } from '@/server/services/payments.service';
import { refundPaymentSchema } from '@/server/validation/payments';
import { extractAuthContext, requireRole } from '@/server/auth/guard';
import { handleApiError, successResponse } from '@/server/utils/api-response';

export async function POST(req: NextRequest) {
  try {
    const ctx = await extractAuthContext(req);
    if (ctx) {
      requireRole(ctx, ['admin', 'branch_admin']);
    }

    const body = await req.json();
    const validatedData = refundPaymentSchema.parse(body);
    const result = await paymentsService.refundPayment(validatedData, ctx || undefined);

    return successResponse(result, 200);
  } catch (error) {
    return handleApiError(error);
  }
}
