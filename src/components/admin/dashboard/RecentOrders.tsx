import React from 'react';
import Link from 'next/link';
import { ArrowRight, Eye, Package } from 'lucide-react';
import { Order } from '@/types';
import { StatusBadge } from '@/components/admin/StatusBadge';

export interface RecentOrdersProps {
  orders: Order[];
}

export const RecentOrders: React.FC<RecentOrdersProps> = ({ orders }) => {
  const recentOrders = orders.slice(0, 5);

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden flex flex-col h-full">
      <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-900">Recent Orders</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Latest {recentOrders.length} of {orders.length} customer book orders
          </p>
        </div>
        <Link
          href="/admin/orders"
          className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 inline-flex items-center gap-1 group"
        >
          <span>View All</span>
          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>

      <div className="flex-1 overflow-x-auto">
        {recentOrders.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs flex flex-col items-center justify-center">
            <Package className="w-8 h-8 text-slate-300 mb-2" />
            <p className="font-medium text-slate-700">No recent orders recorded</p>
            <p className="mt-0.5 text-slate-400">New orders placed by customer branches will appear here.</p>
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-100 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-2.5 px-4">Order Ref</th>
                <th className="py-2.5 px-4">Date</th>
                <th className="py-2.5 px-4">Customer / Account</th>
                <th className="py-2.5 px-4 text-center">Copies</th>
                <th className="py-2.5 px-4 text-right">Total</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {recentOrders.map((order) => {
                const totalCopies = order.items.reduce((sum, item) => sum + item.quantity, 0);
                const orderDate = new Date(order.createdAt).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                });
                const customerDisplay = order.customerName?.trim() || 'Customer';
                const accountDisplay = order.branchName?.trim() || (order.branchCode ? `Branch ${order.branchCode}` : null);

                return (
                  <tr key={order.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-semibold text-slate-900">
                      {order.orderNumber}
                    </td>
                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                      {orderDate}
                    </td>
                    <td className="py-3 px-4 max-w-xs truncate">
                      <div className="font-semibold text-slate-900 truncate">
                        {customerDisplay}
                      </div>
                      {accountDisplay && accountDisplay !== customerDisplay && (
                        <div className="text-[11px] text-slate-500 truncate">
                          {accountDisplay}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center text-slate-700">
                      {totalCopies}
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-slate-900 whitespace-nowrap">
                      ₹{order.totalAmount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <StatusBadge status={order.status} type="order" />
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <Link
                        href={`/admin/orders`}
                        className="inline-flex items-center gap-1 text-slate-600 hover:text-emerald-700 font-medium p-1 hover:bg-emerald-50 rounded transition-colors"
                        title="View order in orders module"
                        aria-label={`View order ${order.orderNumber}`}
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">View</span>
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
