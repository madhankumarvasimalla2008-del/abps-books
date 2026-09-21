import { NextRequest } from 'next/server';
import { productsService } from '@/server/services/products.service';
import { createProductSchema, productFilterSchema } from '@/server/validation/products';
import { extractAuthContext, requireAuth, requireRole } from '@/server/auth/guard';
import { handleApiError, paginatedResponse, successResponse } from '@/server/utils/api-response';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const rawParams = {
      search: searchParams.get('search') || undefined,
      categoryId: searchParams.get('categoryId') || undefined,
      grade: searchParams.get('grade') || undefined,
      subject: searchParams.get('subject') || undefined,
      board: searchParams.get('board') || undefined,
      status: searchParams.get('status') || undefined,
      minPrice: searchParams.get('minPrice') || undefined,
      maxPrice: searchParams.get('maxPrice') || undefined,
      page: searchParams.get('page') || undefined,
      pageSize: searchParams.get('pageSize') || undefined,
      sortBy: searchParams.get('sortBy') || undefined,
      sortOrder: searchParams.get('sortOrder') || undefined,
    };

    const filters = productFilterSchema.parse(rawParams);
    const result = await productsService.listProducts(filters);
    return paginatedResponse(result);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await extractAuthContext(req);
    if (ctx) {
      requireRole(ctx, ['admin', 'warehouse']);
    }

    const body = await req.json();
    const validatedData = createProductSchema.parse(body);
    const product = await productsService.createProduct(validatedData);

    return successResponse(product, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
