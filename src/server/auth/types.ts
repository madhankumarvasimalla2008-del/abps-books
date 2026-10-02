export type UserRole = 'admin' | 'branch_admin' | 'warehouse' | 'sales' | 'customer';

export interface AuthContext {
  userId: string;
  email?: string | null;
  phone?: string | null;
  fullName?: string;
  role: UserRole;
  branchId?: string | null;
  isStaff: boolean;
}

export type Permission =
  | 'products:read'
  | 'products:write'
  | 'categories:read'
  | 'categories:write'
  | 'inventory:read'
  | 'inventory:write'
  | 'orders:read_all'
  | 'orders:read_branch'
  | 'orders:read_own'
  | 'orders:create'
  | 'orders:update_status'
  | 'customers:read'
  | 'customers:write'
  | 'branches:read'
  | 'branches:write'
  | 'suppliers:read'
  | 'suppliers:write'
  | 'purchase_orders:read'
  | 'purchase_orders:write'
  | 'purchase_orders:receive'
  | 'shipments:read'
  | 'shipments:write'
  | 'payments:read'
  | 'payments:write';
