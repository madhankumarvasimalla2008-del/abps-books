import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { AppError } from '../errors';
import { PaginatedResult } from './pagination';

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  error?: {
    message: string;
    code: string;
    details?: unknown;
  };
}

export function successResponse<T>(data: T, status: number = 200): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
    },
    { status }
  );
}

export function paginatedResponse<T>(
  result: PaginatedResult<T>,
  status: number = 200
): NextResponse<ApiResponse<T[]>> {
  return NextResponse.json(
    {
      success: true,
      data: result.data,
      pagination: result.pagination,
    },
    { status }
  );
}

export function handleApiError(error: unknown): NextResponse<ApiResponse<never>> {
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        success: false,
        error: {
          message: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: error.issues.map((issue) => ({
            field: issue.path.join('.'),
            message: issue.message,
          })),
        },
      },
      { status: 400 }
    );
  }

  if (error instanceof AppError) {
    return NextResponse.json(
      {
        success: false,
        error: {
          message: error.message,
          code: error.code,
          details: error.details,
        },
      },
      { status: error.statusCode }
    );
  }

  // Safe server logging without exposing credentials or internal SQL traces to client
  console.error('[Unhandled API Error]:', error);

  return NextResponse.json(
    {
      success: false,
      error: {
        message: 'An unexpected internal error occurred. Please contact support.',
        code: 'INTERNAL_SERVER_ERROR',
      },
    },
    { status: 500 }
  );
}
