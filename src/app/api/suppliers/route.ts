import { NextRequest } from 'next/server';
import { suppliersService } from '@/server/services/suppliers.service';
import { createSupplierSchema, supplierFilterSchema } from '@/server/validation/suppliers';
import { extractAuthContext, requireRole } from '@/server/auth/guard';
import { handleApiError, paginatedResponse, successResponse } from '@/server/utils/api-response';

export async function GET(req: NextRequest) {
  try {
    const ctx = await extractAuthContext(req);
    if (ctx) {
      requireRole(ctx, ['admin', 'branch_admin', 'warehouse', 'sales']);
    }

    const { searchParams } = new URL(req.url);
    const rawParams = {
      search: searchParams.get('search') || undefined,
      isActive: searchParams.get('isActive') === null ? undefined : searchParams.get('isActive') === 'true',
      page: searchParams.get('page') || undefined,
      pageSize: searchParams.get('pageSize') || undefined,
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
    const ctx = await extractAuthContext(req);
    if (ctx) {
      requireRole(ctx, ['admin']);
    }

    const body = await req.json();
    const validatedData = createSupplierSchema.parse(body);
    const supplier = await suppliersService.createSupplier(validatedData);

    return successResponse(supplier, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
