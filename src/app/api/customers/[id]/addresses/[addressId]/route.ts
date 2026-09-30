import { NextRequest } from 'next/server';
import { customersService } from '@/server/services/customers.service';
import { updateCustomerAddressSchema } from '@/server/validation/customers';
import { extractAuthContext, requireAuth } from '@/server/auth/guard';
import { handleApiError, successResponse } from '@/server/utils/api-response';

interface RouteContext {
  params: Promise<{ id: string; addressId: string }>;
}

export async function GET(req: NextRequest, { params }: RouteContext) {
  try {
    const { id, addressId } = await params;
    const ctx = requireAuth(await extractAuthContext(req));
    const address = await customersService.getAddressById(id, addressId, ctx);

    return successResponse(address);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(req: NextRequest, { params }: RouteContext) {
  try {
    const { id, addressId } = await params;
    const ctx = requireAuth(await extractAuthContext(req));
    const body = await req.json();
    const validatedData = updateCustomerAddressSchema.parse(body);
    const updated = await customersService.updateAddress(id, addressId, validatedData, ctx);

    return successResponse(updated);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  try {
    const { id, addressId } = await params;
    const ctx = requireAuth(await extractAuthContext(req));
    const body = await req.json();
    const validatedData = updateCustomerAddressSchema.parse(body);
    const updated = await customersService.updateAddress(id, addressId, validatedData, ctx);

    return successResponse(updated);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(req: NextRequest, { params }: RouteContext) {
  try {
    const { id, addressId } = await params;
    const ctx = requireAuth(await extractAuthContext(req));
    await customersService.deleteAddress(id, addressId, ctx);

    return successResponse({ success: true, deletedId: addressId });
  } catch (error) {
    return handleApiError(error);
  }
}
