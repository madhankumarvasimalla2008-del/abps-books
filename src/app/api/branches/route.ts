import { NextRequest } from 'next/server';
import { branchesService } from '@/server/services/branches.service';
import { branchFilterSchema, createBranchSchema } from '@/server/validation/branches';
import { extractAuthContext, requireRole } from '@/server/auth/guard';
import { handleApiError, paginatedResponse, successResponse } from '@/server/utils/api-response';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const rawParams = {
      search: searchParams.get('search') || undefined,
      city: searchParams.get('city') || undefined,
      state: searchParams.get('state') || undefined,
      isActive: searchParams.get('isActive') === null ? undefined : searchParams.get('isActive') === 'true',
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
    const ctx = await extractAuthContext(req);
    if (ctx) {
      requireRole(ctx, ['admin']);
    }

    const body = await req.json();
    const validatedData = createBranchSchema.parse(body);
    const branch = await branchesService.createBranch(validatedData);

    return successResponse(branch, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
