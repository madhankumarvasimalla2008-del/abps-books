import { NextRequest } from 'next/server';
import { paymentsService } from '@/server/services/payments.service';
import { initiatePaymentSchema } from '@/server/validation/payments';
import { extractAuthContext, requireAuth } from '@/server/auth/guard';
import { handleApiError, successResponse } from '@/server/utils/api-response';

export async function POST(req: NextRequest) {
  try {
    const ctx = requireAuth(await extractAuthContext(req));
    const body = await req.json();
    const validatedData = initiatePaymentSchema.parse(body);
    const result = await paymentsService.initiatePayment(validatedData, ctx);

    return successResponse(result, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
