import { NextRequest } from 'next/server';
import { branchesService } from '@/server/services/branches.service';
import { updateBranchSchema } from '@/server/validation/branches';
import { extractAuthContext, requireRole } from '@/server/auth/guard';
import { handleApiError, successResponse } from '@/server/utils/api-response';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const branch = await branchesService.getBranchById(id);
    return successResponse(branch);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const ctx = await extractAuthContext(req);
    if (ctx) {
      requireRole(ctx, ['admin']);
    }

    const body = await req.json();
    const validatedData = updateBranchSchema.parse(body);
    const updated = await branchesService.updateBranch(id, validatedData);

    return successResponse(updated);
  } catch (error) {
    return handleApiError(error);
  }
}
