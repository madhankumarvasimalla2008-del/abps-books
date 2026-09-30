import { NextRequest } from 'next/server';
import { categoriesService } from '@/server/services/categories.service';
import { updateCategorySchema } from '@/server/validation/categories';
import { extractAuthContext, requireAuth, requireRole } from '@/server/auth/guard';
import { handleApiError, successResponse } from '@/server/utils/api-response';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const category = await categoriesService.getCategoryById(id);
    return successResponse(category);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const ctx = requireAuth(await extractAuthContext(req));
    requireRole(ctx, ['admin']);

    const body = await req.json();
    const validatedData = updateCategorySchema.parse(body);
    const updated = await categoriesService.updateCategory(id, validatedData);

    return successResponse(updated);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const ctx = requireAuth(await extractAuthContext(req));
    requireRole(ctx, ['admin']);

    const deleted = await categoriesService.deleteCategory(id);
    return successResponse(deleted);
  } catch (error) {
    return handleApiError(error);
  }
}
