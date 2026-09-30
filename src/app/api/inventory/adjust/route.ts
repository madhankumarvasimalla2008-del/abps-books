import { NextRequest } from 'next/server';
import { inventoryService } from '@/server/services/inventory.service';
import { adjustInventorySchema } from '@/server/validation/inventory';
import { extractAuthContext, requireAuth, requireRole } from '@/server/auth/guard';
import { ForbiddenError } from '@/server/errors';
import { handleApiError, successResponse } from '@/server/utils/api-response';

export async function POST(req: NextRequest) {
  try {
    const ctx = requireAuth(await extractAuthContext(req));
    requireRole(ctx, ['admin', 'branch_admin', 'warehouse']);

    const body = await req.json();
    const validatedData = adjustInventorySchema.parse(body);

    if ((ctx.role === 'branch_admin' || ctx.role === 'warehouse') && ctx.branchId) {
      if (validatedData.branchId !== ctx.branchId) {
        throw new ForbiddenError('Staff cannot adjust inventory for another branch');
      }
    }

    const result = await inventoryService.adjustStock(validatedData, ctx);

    return successResponse(result, 200);
  } catch (error) {
    return handleApiError(error);
  }
}
