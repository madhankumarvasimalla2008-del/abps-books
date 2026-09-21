import { NextRequest } from 'next/server';
import { extractAuthContext } from '@/server/auth/guard';
import { handleApiError, successResponse } from '@/server/utils/api-response';

export async function GET(req: NextRequest) {
  try {
    const ctx = await extractAuthContext(req);
    if (!ctx) {
      return successResponse({ authenticated: false, user: null });
    }
    return successResponse({ authenticated: true, user: ctx });
  } catch (error) {
    return handleApiError(error);
  }
}
