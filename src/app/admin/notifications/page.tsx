'use client';

import React from 'react';
import {
  Bell,
  AlertTriangle,
  ShoppingBag,
  Truck,
  CreditCard,
  CheckCircle2,
  Trash2,
  CheckCheck,
  Info,
} from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Button } from '@/components/ui/Button';
import { useNotifications } from '@/context/NotificationContext';

export default function AdminNotificationsPage() {
  const {
    notifications,
    markAllAsRead,
    markAsRead,
    deleteNotification,
    clearAll,
    unreadCount,
    isLoading,
  } = useNotifications();

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Breadcrumbs items={[{ label: 'Operations Notifications & Alerts' }]} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
            Operations Activity & System Alerts
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time feed of stock warnings, school indent submissions, and delivery events ({unreadCount} unread)
          </p>
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => markAllAsRead()}
              leftIcon={<CheckCheck className="w-4 h-4" />}
            >
              Mark All as Read
            </Button>
          )}
          {notifications.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => clearAll()}
              leftIcon={<Trash2 className="w-4 h-4" />}
            >
              Clear All
            </Button>
          )}
        </div>
      </div>

      {/* Notification List */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs divide-y divide-slate-100 overflow-hidden">
        {notifications.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
            No new notifications. All systems operational.
          </div>
        ) : (
          notifications.map((n) => {
            const isUnread = !n.isRead;
            const isStock = n.type === 'inventory';
            const isOrder = n.type === 'order';
            const isShipment = n.type === 'shipment';
            const isPayment = n.type === 'payment';

            return (
              <div
                key={n.id}
                className={`p-4.5 flex items-start gap-4 transition-colors ${
                  isUnread ? 'bg-emerald-50/20' : 'hover:bg-slate-50/50'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    n.severity === 'warning'
                      ? 'bg-amber-100 text-amber-700'
                      : n.severity === 'danger'
                      ? 'bg-rose-100 text-rose-700'
                      : isStock
                      ? 'bg-amber-100 text-amber-700'
                      : isOrder
                      ? 'bg-blue-100 text-blue-700'
                      : isShipment
                      ? 'bg-emerald-100 text-emerald-700'
                      : isPayment
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {n.severity === 'warning' || n.severity === 'danger' ? (
                    <AlertTriangle className="w-4 h-4" />
                  ) : isStock ? (
                    <AlertTriangle className="w-4 h-4" />
                  ) : isOrder ? (
                    <ShoppingBag className="w-4 h-4" />
                  ) : isShipment ? (
                    <Truck className="w-4 h-4" />
                  ) : isPayment ? (
                    <CreditCard className="w-4 h-4" />
                  ) : (
                    <Info className="w-4 h-4" />
                  )}
                </div>

                <div className="flex-1 min-w-0 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <p className={`font-bold ${isUnread ? 'text-slate-900' : 'text-slate-700'}`}>
                      {n.title}
                    </p>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-mono text-[11px] text-slate-400">
                        {new Date(n.timestamp).toLocaleDateString()}{' '}
                        {new Date(n.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      {isUnread && (
                        <button
                          type="button"
                          onClick={() => markAsRead(n.id)}
                          className="text-[11px] text-emerald-700 hover:text-emerald-800 font-medium hover:underline"
                        >
                          Mark read
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => deleteNotification(n.id)}
                        className="text-slate-400 hover:text-rose-600 transition-colors p-0.5"
                        title="Delete alert"
                        aria-label="Delete alert"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <p className="text-slate-600 mt-1 leading-relaxed">{n.message}</p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
