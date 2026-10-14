import { NextRequest } from 'next/server';
import { branchesService } from '@/server/services/branches.service';
import { branchFilterSchema, createBranchSchema } from '@/server/validation/branches';
import { extractAuthContext, requireAuth, requireRole } from '@/server/auth/guard';
import { handleApiError, paginatedResponse, successResponse } from '@/server/utils/api-response';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const statusParam = searchParams.get('status');
    const isActiveParam = searchParams.get('isActive');
    const resolvedStatus = statusParam || (isActiveParam === 'true' ? 'active' : isActiveParam === 'false' ? 'inactive' : undefined);

    const rawParams = {
      search: searchParams.get('search') || undefined,
      city: searchParams.get('city') || undefined,
      state: searchParams.get('state') || undefined,
      zone: searchParams.get('zone') || undefined,
      status: resolvedStatus || undefined,
      page: searchParams.get('page') || undefined,
      pageSize: searchParams.get('pageSize') || undefined,
    };

    const filters = branchFilterSchema.parse(rawParams);
    const result = await branchesService.listBranches(filters);
    return paginatedResponse(result);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = requireAuth(await extractAuthContext(req));
    requireRole(ctx, ['admin']);

    const body = await req.json();
    const validatedData = createBranchSchema.parse(body);
    const branch = await branchesService.createBranch(validatedData);

    return successResponse(branch, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
