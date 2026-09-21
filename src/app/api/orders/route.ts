import { NextRequest } from 'next/server';
import { ordersService } from '@/server/services/orders.service';
import { createOrderSchema, orderFilterSchema } from '@/server/validation/orders';
import { extractAuthContext } from '@/server/auth/guard';
import { handleApiError, paginatedResponse, successResponse } from '@/server/utils/api-response';

export async function GET(req: NextRequest) {
  try {
    const ctx = await extractAuthContext(req);
    const { searchParams } = new URL(req.url);
    const rawParams = {
      userId: searchParams.get('userId') || undefined,
      branchId: searchParams.get('branchId') || undefined,
      status: searchParams.get('status') || undefined,
      paymentStatus: searchParams.get('paymentStatus') || undefined,
      orderNumber: searchParams.get('orderNumber') || undefined,
      fromDate: searchParams.get('fromDate') || undefined,
      toDate: searchParams.get('toDate') || undefined,
      page: searchParams.get('page') || undefined,
      pageSize: searchParams.get('pageSize') || undefined,
      sortBy: searchParams.get('sortBy') || undefined,
      sortOrder: searchParams.get('sortOrder') || undefined,
    };

    const filters = orderFilterSchema.parse(rawParams);
    const result = await ordersService.listOrders(filters, ctx || undefined);
    return paginatedResponse(result);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await extractAuthContext(req);
    const body = await req.json();
    const validatedData = createOrderSchema.parse(body);
    const order = await ordersService.createOrder(validatedData, ctx || undefined);

    return successResponse(order, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
