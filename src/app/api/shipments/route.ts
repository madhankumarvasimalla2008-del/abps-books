import { NextRequest } from 'next/server';
import { shipmentsService } from '@/server/services/shipments.service';
import { createShipmentSchema, shipmentFilterSchema } from '@/server/validation/shipments';
import { extractAuthContext, requireAuth, requireRole } from '@/server/auth/guard';
import { handleApiError, paginatedResponse, successResponse } from '@/server/utils/api-response';

export async function GET(req: NextRequest) {
  try {
    const ctx = requireAuth(await extractAuthContext(req));
    requireRole(ctx, ['admin', 'branch_admin', 'warehouse', 'sales']);

    const { searchParams } = new URL(req.url);
    const rawParams = {
      orderId: searchParams.get('orderId') || undefined,
      originBranchId: searchParams.get('originBranchId') || undefined,
      carrier: searchParams.get('carrier') || undefined,
      currentStatus: searchParams.get('currentStatus') || undefined,
      trackingNumber: searchParams.get('trackingNumber') || undefined,
      page: searchParams.get('page') || undefined,
      pageSize: searchParams.get('pageSize') || undefined,
      sortBy: searchParams.get('sortBy') || undefined,
      sortOrder: searchParams.get('sortOrder') || undefined,
    };

    const filters = shipmentFilterSchema.parse(rawParams);
    const result = await shipmentsService.listShipments(filters, ctx);
    return paginatedResponse(result);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = requireAuth(await extractAuthContext(req));
    requireRole(ctx, ['admin', 'branch_admin', 'warehouse']);

    const body = await req.json();
    const validatedData = createShipmentSchema.parse(body);
    const shipment = await shipmentsService.createShipment(validatedData, ctx || undefined);

    return successResponse(shipment, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
