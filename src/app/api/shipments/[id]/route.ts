import { NextRequest } from 'next/server';
import { shipmentsService } from '@/server/services/shipments.service';
import { extractAuthContext, requireAuth } from '@/server/auth/guard';
import { handleApiError, successResponse } from '@/server/utils/api-response';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const ctx = requireAuth(await extractAuthContext(req));
    const shipment = await shipmentsService.getShipmentById(id, ctx);

    return successResponse(shipment);
  } catch (error) {
    return handleApiError(error);
  }
}
