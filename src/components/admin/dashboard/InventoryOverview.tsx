import React from 'react';
import Link from 'next/link';
import { ArrowRight, BookOpen, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { Product } from '@/types';

export interface InventoryStats {
  total: number;
  inStock: number;
  lowStock: number;
  outOfStock: number;
}

export interface InventoryOverviewProps {
  stats?: InventoryStats;
  products?: Product[];
}

export const InventoryOverview: React.FC<InventoryOverviewProps> = ({ stats: propStats, products }) => {
  const stats = React.useMemo(() => {
    if (propStats) {
      return propStats;
    }
    let inStock = 0;
    let lowStock = 0;
    let outOfStock = 0;

    if (products && products.length > 0) {
      products.forEach((p) => {
        if (p.status === 'out_of_stock' || p.stockQuantity === 0) {
          outOfStock++;
        } else if (p.status === 'low_stock' || p.stockQuantity <= p.lowStockThreshold) {
          lowStock++;
        } else {
          inStock++;
        }
      });
      return {
        total: products.length,
        inStock,
        lowStock,
        outOfStock,
      };
    }

    return {
      total: 0,
      inStock: 0,
      lowStock: 0,
      outOfStock: 0,
    };
  }, [propStats, products]);

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-900">Inventory Status</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Stock health overview across {stats.total} catalog titles
          </p>
        </div>
        <Link
          href="/admin/inventory"
          className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 inline-flex items-center gap-1 group"
        >
          <span>Inventory Manager</span>
          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 rounded-lg border border-slate-200/80 bg-slate-50 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
              Total Titles
            </span>
            <BookOpen className="w-4 h-4 text-slate-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{stats.total}</div>
        </div>

        <div className="p-3 rounded-lg border border-emerald-200/80 bg-emerald-50/60 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
              In Stock
            </span>
            <CheckCircle className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-950">{stats.inStock}</div>
        </div>

        <div className="p-3 rounded-lg border border-amber-200/80 bg-amber-50/60 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700">
              Low Stock
            </span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-amber-950">{stats.lowStock}</div>
        </div>

        <div className="p-3 rounded-lg border border-rose-200/80 bg-rose-50/60 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700">
              Out of Stock
            </span>
            <XCircle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-bold text-rose-950">{stats.outOfStock}</div>
        </div>
      </div>
    </div>
  );
};
