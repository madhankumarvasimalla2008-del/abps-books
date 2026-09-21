'use client';

import React from 'react';
import {
  BarChart3,
  TrendingUp,
  Download,
  Calendar,
  Layers,
  BookOpen,
  Building2,
  PieChart,
} from 'lucide-react';
import { MOCK_ORDERS, MOCK_PRODUCTS, MOCK_BRANCHES } from '@/data/mockData';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { StatCard } from '@/components/ui/StatCard';
import { Button } from '@/components/ui/Button';

export default function AdminReportsPage() {
  const totalSales = MOCK_ORDERS.reduce((s, o) => s + o.totalAmount, 0);
  const totalUnits = MOCK_ORDERS.reduce(
    (s, o) => s + o.items.reduce((sum, i) => sum + i.quantity, 0),
    0
  );

  const gradeBreakdown = [
    { grade: 'Class 10 (Secondary Board)', percentage: 38, units: 1420, revenue: 319500 },
    { grade: 'Class 9 (Secondary Foundation)', percentage: 26, units: 980, revenue: 215600 },
    { grade: 'Class 12 - Science Stream', percentage: 20, units: 750, revenue: 198000 },
    { grade: 'Class 8 (Middle School)', percentage: 16, units: 610, revenue: 122000 },
  ];

  const topBranches = [
    { name: 'ABPS Kharia Khangarh', state: 'Rajasthan', orders: 8, total: 420000 },
    { name: 'ABPS Renukoot', state: 'Uttar Pradesh', orders: 11, total: 680000 },
    { name: 'ABPS Kovaya', state: 'Gujarat', orders: 5, total: 285000 },
    { name: 'ABPS Nagda', state: 'Madhya Pradesh', orders: 6, total: 310000 },
  ];

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: 'Institutional Analytics & Procurement Reports' }]} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
            Curriculum Procurement & Financial Analytics
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Academic year 2026-27 textbook distribution metrics across ABPS school campuses
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" leftIcon={<Calendar className="w-4 h-4" />}>
            AY 2026-27 (Annual)
          </Button>
          <Button variant="primary" size="sm" leftIcon={<Download className="w-4 h-4" />}>
            Download Full MIS Report
          </Button>
        </div>
      </div>

      {/* 4 Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Gross Distribution"
          value={`₹${(totalSales / 100000).toFixed(2)} Lakh`}
          change={{ value: '+18.4% vs previous academic year', positive: true }}
          icon={<TrendingUp className="w-5 h-5 text-emerald-700" />}
        />
        <StatCard
          title="Textbooks Delivered"
          value={totalUnits.toLocaleString('en-IN')}
          change={{ value: 'Across 34 active campus branches', positive: true }}
          icon={<BookOpen className="w-5 h-5 text-blue-700" />}
        />
        <StatCard
          title="Average Indent Value"
          value={`₹${Math.round(totalSales / MOCK_ORDERS.length).toLocaleString('en-IN')}`}
          change={{ value: 'Per school purchase indent', positive: true }}
          icon={<BarChart3 className="w-5 h-5 text-indigo-700" />}
        />
        <StatCard
          title="Fulfillment Turnaround"
          value="3.2 Days"
          change={{ value: 'Order to campus delivery SLA', positive: true }}
          icon={<Layers className="w-5 h-5 text-emerald-800" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Grade Level Demand Distribution */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="font-bold text-slate-900 text-sm">Demand by Educational Grade Level</h2>
            <span className="text-xs text-slate-400 font-mono">AY 2026-27</span>
          </div>

          <div className="space-y-4">
            {gradeBreakdown.map((g) => (
              <div key={g.grade} className="space-y-1.5 text-xs">
                <div className="flex justify-between font-semibold text-slate-800">
                  <span>{g.grade}</span>
                  <span className="font-mono">
                    ₹{g.revenue.toLocaleString('en-IN')} ({g.percentage}%)
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-600 h-full rounded-full"
                    style={{ width: `${g.percentage}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>{g.units.toLocaleString('en-IN')} copies distributed</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Procuring Campus Branches */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="font-bold text-slate-900 text-sm">Top Procuring School Branches</h2>
            <span className="text-xs text-slate-400 font-mono">By Net Indent Value</span>
          </div>

          <div className="space-y-3">
            {topBranches.map((b) => (
              <div
                key={b.name}
                className="p-3 bg-slate-50/70 border border-slate-100 rounded-xl flex items-center justify-between text-xs"
              >
                <div>
                  <p className="font-bold text-slate-900">{b.name}</p>
                  <p className="text-[11px] text-slate-500">
                    {b.state} • {b.orders} Indents
                  </p>
                </div>
                <span className="font-mono font-bold text-slate-900 text-sm">
                  ₹{b.total.toLocaleString('en-IN')}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
