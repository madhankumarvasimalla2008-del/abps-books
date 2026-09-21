'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Menu, Bell, Search, ExternalLink, CheckCircle2, AlertTriangle, X } from 'lucide-react';
import { useNotifications } from '@/context/NotificationContext';
import { AdminAccountMenu } from '@/components/admin/AdminAccountMenu';

export interface AdminHeaderProps {
  onMenuClick: () => void;
  isSidebarOpen?: boolean;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({ onMenuClick, isSidebarOpen = false }) => {
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const { notifications, unreadCount, markAsRead } = useNotifications();

  // Handle click outside and Escape key for notifications dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && notificationsOpen) {
        setNotificationsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [notificationsOpen]);

  return (
    <header className="sticky top-0 z-30 h-16 bg-white border-b border-slate-200/90 px-4 sm:px-6 flex items-center justify-between gap-4 shadow-2xs">
      {/* Left: Mobile menu toggle + Context indicator */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="p-2 text-slate-600 hover:text-slate-900 lg:hidden rounded-lg hover:bg-slate-100 transition-colors focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none"
          aria-label="Toggle Sidebar Menu"
          aria-expanded={isSidebarOpen}
          aria-controls="admin-sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="hidden sm:flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500">
            Admin Portal
          </span>
          <span className="text-slate-300" aria-hidden="true">/</span>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200/70">
            Management &amp; Operations
          </span>
        </div>
      </div>

      {/* Center: Search input */}
      <div className="hidden md:flex items-center flex-1 max-w-xs lg:max-w-sm mx-4">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" aria-hidden="true" />
          <input
            type="search"
            placeholder="Search orders, books, suppliers..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none transition-colors"
            aria-label="Search admin portal"
          />
        </div>
      </div>

      {/* Right controls: Notifications + Live Store View + Account Menu */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Notifications dropdown */}
        <div className="relative" ref={notifRef}>
          <button
            type="button"
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none"
            aria-label={`Notifications (${unreadCount} unread)`}
            aria-expanded={notificationsOpen}
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-600 rounded-full ring-2 ring-white" />
            )}
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 focus:outline-none">
              <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900">
                  Operations Activity ({unreadCount} unread)
                </span>
                <Link
                  href="/admin/notifications"
                  onClick={() => setNotificationsOpen(false)}
                  className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold"
                >
                  View All
                </Link>
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-500">
                    No new activity alerts.
                  </div>
                ) : (
                  notifications.slice(0, 4).map((notif) => (
                    <Link
                      key={notif.id}
                      href={notif.linkUrl || '/admin/notifications'}
                      onClick={() => {
                        if (!notif.isRead) markAsRead(notif.id);
                        setNotificationsOpen(false);
                      }}
                      className="p-3 block hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-start gap-2.5">
                        <div className="mt-0.5 shrink-0">
                          {notif.severity === 'warning' ? (
                            <AlertTriangle className="w-4 h-4 text-amber-500" />
                          ) : notif.severity === 'danger' ? (
                            <AlertTriangle className="w-4 h-4 text-rose-500" />
                          ) : (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-slate-900 truncate">
                            {notif.title}
                          </p>
                          <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">
                            {notif.message}
                          </p>
                          <span className="text-[10px] text-slate-400 mt-1 block">
                            {new Date(notif.timestamp).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* View Customer Store link */}
        <Link
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden sm:inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 border border-slate-200/90 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none"
          title="Open Customer Store in new tab"
        >
          <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
          <span>Customer Store</span>
        </Link>

        {/* Account Menu */}
        <AdminAccountMenu />
      </div>
    </header>
  );
};
