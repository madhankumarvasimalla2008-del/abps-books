import { NextRequest } from 'next/server';
import { paymentsService } from '@/server/services/payments.service';
import { verifyPaymentSchema } from '@/server/validation/payments';
import { extractAuthContext } from '@/server/auth/guard';
import { handleApiError, successResponse } from '@/server/utils/api-response';

export async function POST(req: NextRequest) {
  try {
    const ctx = await extractAuthContext(req);
    const body = await req.json();
    const validatedData = verifyPaymentSchema.parse(body);
    const result = await paymentsService.verifyPayment(validatedData, ctx || undefined);

    return successResponse(result, 200);
  } catch (error) {
    return handleApiError(error);
  }
}
