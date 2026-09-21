import { NextRequest } from 'next/server';
import { inventoryService } from '@/server/services/inventory.service';
import { adjustInventorySchema } from '@/server/validation/inventory';
import { extractAuthContext, requireRole } from '@/server/auth/guard';
import { handleApiError, successResponse } from '@/server/utils/api-response';

export async function POST(req: NextRequest) {
  try {
    const ctx = await extractAuthContext(req);
    if (ctx) {
      requireRole(ctx, ['admin', 'branch_admin', 'warehouse']);
    }

    const body = await req.json();
    const validatedData = adjustInventorySchema.parse(body);
    const result = await inventoryService.adjustStock(validatedData, ctx || undefined);

    return successResponse(result, 200);
  } catch (error) {
    return handleApiError(error);
  }
}
