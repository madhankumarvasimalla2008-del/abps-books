import React from 'react';
import Link from 'next/link';
import { ArrowRight, AlertTriangle, CheckCircle2, Bell, Info } from 'lucide-react';
import { NotificationItem } from '@/types';

export interface RecentActivityProps {
  notifications: NotificationItem[];
}

export const RecentActivity: React.FC<RecentActivityProps> = ({ notifications }) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden flex flex-col h-full">
      <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-900">Recent Operations Activity</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            System notices, inventory triggers, and workflow events
          </p>
        </div>
        <Link
          href="/admin/notifications"
          className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 inline-flex items-center gap-1 group"
        >
          <span>All Activity</span>
          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>

      <div className="p-4 sm:p-5 flex-1">
        {notifications.length === 0 ? (
          <div className="p-6 text-center text-slate-500 text-xs flex flex-col items-center justify-center h-full">
            <Bell className="w-8 h-8 text-slate-300 mb-2" />
            <p className="font-semibold text-slate-900">No operational notices</p>
            <p className="mt-0.5 text-slate-400">All system services operating normally.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((item) => {
              const isWarning = item.severity === 'warning';
              const isDanger = item.severity === 'danger';
              const isSuccess = item.severity === 'success';

              return (
                <div
                  key={item.id}
                  className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100 hover:border-slate-200 transition-colors"
                >
                  <div className="mt-0.5 shrink-0">
                    {isWarning ? (
                      <div className="w-7 h-7 rounded-lg bg-amber-100/80 text-amber-700 flex items-center justify-center">
                        <AlertTriangle className="w-4 h-4" />
                      </div>
                    ) : isDanger ? (
                      <div className="w-7 h-7 rounded-lg bg-rose-100/80 text-rose-700 flex items-center justify-center">
                        <AlertTriangle className="w-4 h-4" />
                      </div>
                    ) : isSuccess ? (
                      <div className="w-7 h-7 rounded-lg bg-emerald-100/80 text-emerald-700 flex items-center justify-center">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                    ) : (
                      <div className="w-7 h-7 rounded-lg bg-blue-100/80 text-blue-700 flex items-center justify-center">
                        <Info className="w-4 h-4" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold text-slate-900 truncate">
                        {item.title}
                      </p>
                      <span className="text-[10px] text-slate-400 whitespace-nowrap">
                        {new Date(item.timestamp || (item as any).createdAt || Date.now()).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5 line-clamp-2">
                      {item.message}
                    </p>
                    {(item.linkUrl || (item as any).actionUrl) && (
                      <div className="mt-2">
                        <Link
                          href={item.linkUrl || (item as any).actionUrl}
                          className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 inline-flex items-center gap-1"
                        >
                          <span>Review Notice</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
