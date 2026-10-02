import { dashboardRepository, DashboardData } from '../repositories/dashboard.repository';
import { AuthContext } from '../auth/types';
import { requireRole } from '../auth/guard';

export class DashboardService {
  async getAdminDashboardData(ctx: AuthContext): Promise<DashboardData> {
    requireRole(ctx, ['admin', 'branch_admin', 'warehouse', 'sales']);
    return await dashboardRepository.getDashboardData(ctx);
  }
}

export const dashboardService = new DashboardService();
