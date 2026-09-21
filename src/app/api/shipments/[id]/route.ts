import { NextRequest } from 'next/server';
import { shipmentsService } from '@/server/services/shipments.service';
import { extractAuthContext } from '@/server/auth/guard';
import { handleApiError, successResponse } from '@/server/utils/api-response';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const ctx = await extractAuthContext(req);
    const shipment = await shipmentsService.getShipmentById(id, ctx || undefined);

    return successResponse(shipment);
  } catch (error) {
    return handleApiError(error);
  }
}
