import { NextRequest } from 'next/server';
import { auditService } from '@/server/services/audit.service';
import { auditLogFilterSchema, createAuditLogSchema } from '@/server/validation/audit';
import { extractAuthContext } from '@/server/auth/guard';
import { handleApiError, paginatedResponse, successResponse } from '@/server/utils/api-response';

export async function GET(req: NextRequest) {
  try {
    const ctx = await extractAuthContext(req);
    const { searchParams } = new URL(req.url);
    const rawParams = {
      actorId: searchParams.get('actorId') || undefined,
      action: searchParams.get('action') || undefined,
      entityType: searchParams.get('entityType') || undefined,
      entityId: searchParams.get('entityId') || undefined,
      branchId: searchParams.get('branchId') || undefined,
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
      search: searchParams.get('search') || undefined,
      page: searchParams.get('page') || undefined,
      pageSize: searchParams.get('pageSize') || undefined,
      sortBy: searchParams.get('sortBy') || undefined,
      sortOrder: searchParams.get('sortOrder') || undefined,
    };

    const filters = auditLogFilterSchema.parse(rawParams);
    const result = await auditService.listLogs(filters, ctx || undefined);
    return paginatedResponse(result);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await extractAuthContext(req);
    const body = await req.json();

    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || req.headers.get('x-real-ip') || undefined;
    const userAgent = req.headers.get('user-agent') || undefined;

    const validatedData = createAuditLogSchema.parse(body);

    const logEntry = await auditService.log(
      {
        action: validatedData.action,
        entityType: validatedData.entityType,
        entityId: validatedData.entityId,
        branchId: validatedData.branchId,
        details: validatedData.details,
        ipAddress: clientIp,
        userAgent,
      },
      ctx || undefined
    );

    return successResponse(logEntry, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
