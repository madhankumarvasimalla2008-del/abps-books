export interface DashboardRecentOrder {
  id: string;
  orderNumber: string;
  createdAt: string;
  customerName: string;
  customerEmail: string;
  branchName: string | null;
  branchCode: string | null;
  totalCopies: number;
  totalAmount: number;
  status: string;
  paymentStatus: string;
}

export interface DashboardLowStockItem {
  id: string;
  title: string;
  grade: string | null;
  subject: string | null;
  stockQuantity: number;
  lowStockThreshold: number;
  status: string;
  branchName?: string | null;
  branchCode?: string | null;
}

export interface DashboardActivityItem {
  id: string;
  title: string;
  message: string;
  type: 'order' | 'inventory' | 'shipment' | 'payment' | 'system';
  severity: 'info' | 'warning' | 'success' | 'danger';
  actionUrl?: string | null;
  createdAt: string;
  isRead: boolean;
}

export interface DashboardData {
  kpis: {
    revenue: number;
    totalOrders: number;
    catalogTitles: number;
    lowStockCount: number;
  };
  orderStatusCounts: {
    Pending: number;
    Confirmed: number;
    Processing: number;
    Shipped: number;
    Delivered: number;
    Cancelled: number;
    [key: string]: number;
  };
  inventoryOverview: {
    total: number;
    inStock: number;
    lowStock: number;
    outOfStock: number;
  };
  recentOrders: DashboardRecentOrder[];
  lowStockItems: DashboardLowStockItem[];
  recentActivity: DashboardActivityItem[];
}
