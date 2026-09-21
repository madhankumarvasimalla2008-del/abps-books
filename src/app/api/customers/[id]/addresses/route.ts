import { NextRequest } from 'next/server';
import { customersService } from '@/server/services/customers.service';
import { customerAddressSchema } from '@/server/validation/customers';
import { extractAuthContext } from '@/server/auth/guard';
import { handleApiError, successResponse } from '@/server/utils/api-response';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const ctx = await extractAuthContext(req);
    const addresses = await customersService.listAddresses(id, ctx || undefined);

    return successResponse(addresses);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const ctx = await extractAuthContext(req);
    const body = await req.json();
    const validatedData = customerAddressSchema.parse(body);
    const address = await customersService.createAddress(id, validatedData, ctx || undefined);

    return successResponse(address, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
