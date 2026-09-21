import { NextRequest } from 'next/server';
import { suppliersService } from '@/server/services/suppliers.service';
import { updateSupplierSchema } from '@/server/validation/suppliers';
import { extractAuthContext, requireRole } from '@/server/auth/guard';
import { handleApiError, successResponse } from '@/server/utils/api-response';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const ctx = await extractAuthContext(req);
    if (ctx) {
      requireRole(ctx, ['admin', 'branch_admin', 'warehouse', 'sales']);
    }

    const supplier = await suppliersService.getSupplierById(id);
    return successResponse(supplier);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const ctx = await extractAuthContext(req);
    if (ctx) {
      requireRole(ctx, ['admin']);
    }

    const body = await req.json();
    const validatedData = updateSupplierSchema.parse(body);
    const updated = await suppliersService.updateSupplier(id, validatedData);

    return successResponse(updated);
  } catch (error) {
    return handleApiError(error);
  }
}
