import { NextRequest } from 'next/server';
import { categoriesService } from '@/server/services/categories.service';
import { categoryFilterSchema, createCategorySchema } from '@/server/validation/categories';
import { extractAuthContext, requireAuth, requireRole } from '@/server/auth/guard';
import { handleApiError, paginatedResponse, successResponse } from '@/server/utils/api-response';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const rawParams = {
      search: searchParams.get('search') || undefined,
      gradeLevel: searchParams.get('gradeLevel') || undefined,
      isActive: searchParams.get('isActive') === null ? undefined : searchParams.get('isActive') === 'true',
      page: searchParams.get('page') || undefined,
      pageSize: searchParams.get('pageSize') || undefined,
      sortBy: searchParams.get('sortBy') || undefined,
      sortOrder: searchParams.get('sortOrder') || undefined,
    };

    const filters = categoryFilterSchema.parse(rawParams);
    const result = await categoriesService.listCategories(filters);
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
    const validatedData = createCategorySchema.parse(body);
    const category = await categoriesService.createCategory(validatedData);

    return successResponse(category, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
