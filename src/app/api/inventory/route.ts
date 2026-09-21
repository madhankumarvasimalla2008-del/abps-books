import { NextRequest } from 'next/server';
import { inventoryService } from '@/server/services/inventory.service';
import { inventoryFilterSchema } from '@/server/validation/inventory';
import { extractAuthContext, requireAuth, requireRole } from '@/server/auth/guard';
import { handleApiError, paginatedResponse } from '@/server/utils/api-response';

export async function GET(req: NextRequest) {
  try {
    const ctx = await extractAuthContext(req);
    if (ctx) {
      requireRole(ctx, ['admin', 'branch_admin', 'warehouse', 'sales']);
    }

    const { searchParams } = new URL(req.url);
    const rawParams = {
      branchId: searchParams.get('branchId') || undefined,
      productId: searchParams.get('productId') || undefined,
      lowStockOnly: searchParams.get('lowStockOnly') === 'true',
      page: searchParams.get('page') || undefined,
      pageSize: searchParams.get('pageSize') || undefined,
      sortBy: searchParams.get('sortBy') || undefined,
      sortOrder: searchParams.get('sortOrder') || undefined,
    };

    const filters = inventoryFilterSchema.parse(rawParams);
    const result = await inventoryService.listInventory(filters, ctx || undefined);
    return paginatedResponse(result);
  } catch (error) {
    return handleApiError(error);
  }
}
