import { NextRequest } from 'next/server';
import { dashboardService } from '@/server/services/dashboard.service';
import { extractAuthContext, requireAuth, requireRole } from '@/server/auth/guard';
import { handleApiError, successResponse } from '@/server/utils/api-response';

export async function GET(req: NextRequest) {
  try {
    const ctx = requireAuth(await extractAuthContext(req));
    requireRole(ctx, ['admin', 'branch_admin', 'warehouse', 'sales']);

    const data = await dashboardService.getAdminDashboardData(ctx);
    return successResponse(data);
  } catch (error) {
    return handleApiError(error);
  }
}
