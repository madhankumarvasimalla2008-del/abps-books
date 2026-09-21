import { NextRequest } from 'next/server';
import { inventoryService } from '@/server/services/inventory.service';
import { movementFilterSchema } from '@/server/validation/inventory';
import { extractAuthContext, requireRole } from '@/server/auth/guard';
import { handleApiError, paginatedResponse } from '@/server/utils/api-response';

export async function GET(req: NextRequest) {
  try {
    const ctx = await extractAuthContext(req);
    if (ctx) {
      requireRole(ctx, ['admin', 'branch_admin', 'warehouse']);
    }

    const { searchParams } = new URL(req.url);
    const rawParams = {
      inventoryId: searchParams.get('inventoryId') || undefined,
      branchId: searchParams.get('branchId') || undefined,
      productId: searchParams.get('productId') || undefined,
      movementType: searchParams.get('movementType') || undefined,
      referenceType: searchParams.get('referenceType') || undefined,
      referenceId: searchParams.get('referenceId') || undefined,
      page: searchParams.get('page') || undefined,
      pageSize: searchParams.get('pageSize') || undefined,
    };

    const filters = movementFilterSchema.parse(rawParams);
    const result = await inventoryService.listMovements(filters, ctx || undefined);
    return paginatedResponse(result);
  } catch (error) {
    return handleApiError(error);
  }
}
