import { NextRequest } from 'next/server';
import { customersService } from '@/server/services/customers.service';
import { updateCustomerSchema } from '@/server/validation/customers';
import { extractAuthContext, requireAuth } from '@/server/auth/guard';
import { handleApiError, successResponse } from '@/server/utils/api-response';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const ctx = requireAuth(await extractAuthContext(req));
    const customer = await customersService.getCustomerById(id, ctx);

    return successResponse(customer);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const ctx = requireAuth(await extractAuthContext(req));
    const body = await req.json();
    const validatedData = updateCustomerSchema.parse(body);
    const updated = await customersService.updateCustomer(id, validatedData, ctx);

    return successResponse(updated);
  } catch (error) {
    return handleApiError(error);
  }
}
