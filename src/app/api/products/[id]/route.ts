import { NextRequest } from 'next/server';
import { productsService } from '@/server/services/products.service';
import { updateProductSchema } from '@/server/validation/products';
import { extractAuthContext, requireAuth, requireRole } from '@/server/auth/guard';
import { handleApiError, successResponse } from '@/server/utils/api-response';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const product = await productsService.getProductById(id);
    return successResponse(product);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const ctx = requireAuth(await extractAuthContext(req));
    requireRole(ctx, ['admin', 'warehouse']);

    const body = await req.json();
    const validatedData = updateProductSchema.parse(body);
    const updated = await productsService.updateProduct(id, validatedData);

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

    const deleted = await productsService.deleteProduct(id);
    return successResponse(deleted);
  } catch (error) {
    return handleApiError(error);
  }
}
