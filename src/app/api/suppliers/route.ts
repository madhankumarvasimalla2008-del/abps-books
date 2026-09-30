import { NextRequest } from 'next/server';
import { suppliersService } from '@/server/services/suppliers.service';
import { createSupplierSchema, supplierFilterSchema } from '@/server/validation/suppliers';
import { extractAuthContext, requireAuth, requireRole } from '@/server/auth/guard';
import { handleApiError, paginatedResponse, successResponse } from '@/server/utils/api-response';

export async function GET(req: NextRequest) {
  try {
    const ctx = requireAuth(await extractAuthContext(req));
    requireRole(ctx, ['admin', 'branch_admin', 'warehouse', 'sales']);

    const { searchParams } = new URL(req.url);
    const rawParams = {
      search: searchParams.get('search') || undefined,
      status: (searchParams.get('status') as any) || (searchParams.get('isActive') === 'false' ? 'inactive' : searchParams.get('isActive') === 'true' ? 'active' : undefined),
      city: searchParams.get('city') || undefined,
      state: searchParams.get('state') || undefined,
      page: searchParams.get('page') || undefined,
      pageSize: searchParams.get('pageSize') || undefined,
      sortBy: searchParams.get('sortBy') || undefined,
      sortOrder: searchParams.get('sortOrder') || undefined,
    };

    const filters = supplierFilterSchema.parse(rawParams);
    const result = await suppliersService.listSuppliers(filters);
    return paginatedResponse(result);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = requireAuth(await extractAuthContext(req));
    requireRole(ctx, ['admin']);

    const body = await req.json();
    const validatedData = createSupplierSchema.parse(body);
    const supplier = await suppliersService.createSupplier(validatedData);

    return successResponse(supplier, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
