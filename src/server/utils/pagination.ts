export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export function parsePagination(pageParam?: string | null, pageSizeParam?: string | null): PaginationParams {
  const page = Math.max(1, parseInt(pageParam || '1', 10) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(pageSizeParam || '20', 10) || 20));
  return { page, pageSize };
}

export function buildPaginatedResult<T>(
  data: T[],
  total: number,
  params: PaginationParams
): PaginatedResult<T> {
  return {
    data,
    pagination: {
      page: params.page,
      pageSize: params.pageSize,
      total,
      totalPages: Math.ceil(total / params.pageSize) || 1,
    },
  };
}
