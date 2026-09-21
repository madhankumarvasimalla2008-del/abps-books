import { NextRequest } from 'next/server';
import { customersService } from '@/server/services/customers.service';
import { createCustomerSchema, customerFilterSchema } from '@/server/validation/customers';
import { extractAuthContext, requireRole } from '@/server/auth/guard';
import { handleApiError, paginatedResponse, successResponse } from '@/server/utils/api-response';

export async function GET(req: NextRequest) {
  try {
    const ctx = await extractAuthContext(req);
    if (ctx) {
      requireRole(ctx, ['admin', 'branch_admin', 'sales']);
    }

    const { searchParams } = new URL(req.url);
    const rawParams = {
      search: searchParams.get('search') || undefined,
      branchId: searchParams.get('branchId') || undefined,
      page: searchParams.get('page') || undefined,
      pageSize: searchParams.get('pageSize') || undefined,
    };

    const filters = customerFilterSchema.parse(rawParams);
    const result = await customersService.listCustomers(filters, ctx || undefined);
    return paginatedResponse(result);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validatedData = createCustomerSchema.parse(body);
    const customer = await customersService.createCustomer(validatedData);

    return successResponse(customer, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
