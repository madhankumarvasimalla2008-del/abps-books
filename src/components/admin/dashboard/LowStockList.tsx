import React from 'react';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, Eye } from 'lucide-react';
import { Product } from '@/types';
import { StatusBadge } from '@/components/admin/StatusBadge';

export interface LowStockItem {
  id: string;
  title: string;
  grade?: string | null;
  subject?: string | null;
  stockQuantity: number;
  lowStockThreshold: number;
  status: string;
  branchName?: string | null;
  branchCode?: string | null;
}

export interface LowStockListProps {
  items?: LowStockItem[];
  products?: Product[];
}

export const LowStockList: React.FC<LowStockListProps> = ({ items, products }) => {
  const displayItems: LowStockItem[] = React.useMemo(() => {
    if (items !== undefined) {
      return items;
    }
    if (products && products.length > 0) {
      return products
        .filter(
          (p) =>
            p.status === 'low_stock' ||
            p.status === 'out_of_stock' ||
            p.stockQuantity <= p.lowStockThreshold
        )
        .map((p) => ({
          id: p.id,
          title: p.title,
          grade: p.grade,
          subject: p.subject,
          stockQuantity: p.stockQuantity,
          lowStockThreshold: p.lowStockThreshold,
          status: p.status,
        }));
    }
    return [];
  }, [items, products]);

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden flex flex-col h-full">
      <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900">
              Low-Stock Alerts
            </h2>
            {displayItems.length > 0 && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                {displayItems.length}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Titles requiring replenishment to meet customer demand
          </p>
        </div>
        <Link
          href="/admin/inventory"
          className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 inline-flex items-center gap-1 group"
        >
          <span>Manage</span>
          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>

      <div className="flex-1 overflow-x-auto">
        {displayItems.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs flex flex-col items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mb-2" />
            <p className="font-semibold text-slate-900">All inventory levels healthy</p>
            <p className="mt-0.5 text-slate-400">All titles exceed minimum stock thresholds.</p>
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-100 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-2.5 px-4">Title / Grade</th>
                <th className="py-2.5 px-4 text-center">Available Stock</th>
                <th className="py-2.5 px-4 text-center">Threshold</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {displayItems.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 max-w-xs truncate">
                    <div className="font-semibold text-slate-900 truncate">
                      {item.title}
                    </div>
                    <div className="text-[11px] text-slate-500 truncate">
                      {item.grade || item.subject
                        ? `${item.grade || ''}${item.grade && item.subject ? ' • ' : ''}${item.subject || ''}`
                        : item.branchName || 'Catalog Title'}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200/60">
                      {item.stockQuantity} copies
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center text-slate-500">
                    {item.lowStockThreshold}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <StatusBadge status={item.status as any} type="inventory" />
                  </td>
                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    <Link
                      href="/admin/inventory"
                      className="inline-flex items-center gap-1 text-slate-600 hover:text-emerald-700 font-medium p-1 hover:bg-emerald-50 rounded transition-colors"
                      title="Adjust inventory"
                      aria-label={`Manage inventory for ${item.title}`}
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Inspect</span>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
