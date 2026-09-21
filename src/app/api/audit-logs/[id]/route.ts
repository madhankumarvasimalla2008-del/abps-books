import { NextRequest } from 'next/server';
import { auditService } from '@/server/services/audit.service';
import { extractAuthContext } from '@/server/auth/guard';
import { handleApiError, successResponse } from '@/server/utils/api-response';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const ctx = await extractAuthContext(req);
    const logEntry = await auditService.getLogById(id, ctx || undefined);

    return successResponse(logEntry);
  } catch (error) {
    return handleApiError(error);
  }
}
