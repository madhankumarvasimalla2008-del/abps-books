import { NextRequest } from 'next/server';
import { purchaseOrdersService } from '@/server/services/purchase-orders.service';
import { createPurchaseOrderSchema, poFilterSchema } from '@/server/validation/purchase-orders';
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
      supplierId: searchParams.get('supplierId') || undefined,
      branchId: searchParams.get('branchId') || undefined,
      status: searchParams.get('status') || undefined,
      poNumber: searchParams.get('poNumber') || undefined,
      fromDate: searchParams.get('fromDate') || undefined,
      toDate: searchParams.get('toDate') || undefined,
      page: searchParams.get('page') || undefined,
      pageSize: searchParams.get('pageSize') || undefined,
      sortBy: searchParams.get('sortBy') || undefined,
      sortOrder: searchParams.get('sortOrder') || undefined,
    };

    const filters = poFilterSchema.parse(rawParams);
    const result = await purchaseOrdersService.listPurchaseOrders(filters, ctx || undefined);
    return paginatedResponse(result);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await extractAuthContext(req);
    if (ctx) {
      requireRole(ctx, ['admin', 'branch_admin', 'warehouse']);
    }

    const body = await req.json();
    const validatedData = createPurchaseOrderSchema.parse(body);
    const po = await purchaseOrdersService.createPurchaseOrder(validatedData, ctx || undefined);

    return successResponse(po, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
