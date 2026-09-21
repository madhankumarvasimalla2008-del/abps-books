import { NextRequest } from 'next/server';
import { shipmentsService } from '@/server/services/shipments.service';
import { updateShipmentStatusSchema } from '@/server/validation/shipments';
import { extractAuthContext, requireRole } from '@/server/auth/guard';
import { handleApiError, successResponse } from '@/server/utils/api-response';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const ctx = await extractAuthContext(req);
    if (ctx) {
      requireRole(ctx, ['admin', 'branch_admin', 'warehouse']);
    }

    const body = await req.json();
    const validatedData = updateShipmentStatusSchema.parse(body);
    const result = await shipmentsService.addMilestone(id, validatedData, ctx || undefined);

    return successResponse(result, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
