'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { NotificationItem } from '@/types';
import { MOCK_NOTIFICATIONS } from '@/data/mockData';

export interface CreateNotificationContextInput {
  userId?: string;
  title: string;
  message: string;
  type?: 'order' | 'inventory' | 'shipment' | 'payment' | 'system';
  severity?: 'info' | 'warning' | 'success' | 'danger';
  linkUrl?: string;
  actionUrl?: string;
}

export interface NotificationMutationResult {
  success: boolean;
  notification?: NotificationItem;
  count?: number;
  error?: string;
}

interface NotificationContextType {
  notifications: NotificationItem[];
  unreadCount: number;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
  getNotification: (id: string) => NotificationItem | undefined;
  markAsRead: (id: string) => Promise<NotificationMutationResult>;
  markAllAsRead: () => Promise<NotificationMutationResult>;
  deleteNotification: (id: string) => Promise<NotificationMutationResult>;
  addNotification: (input: CreateNotificationContextInput) => Promise<NotificationMutationResult>;
  clearAll: () => Promise<NotificationMutationResult>;
  refreshNotifications: () => Promise<void>;
}

export function mapApiNotificationToFrontend(item: any): NotificationItem {
  return {
    id: item.id,
    title: item.title,
    message: item.message,
    type: item.type || 'system',
    severity: item.severity || 'info',
    timestamp: item.createdAt || item.timestamp || new Date().toISOString(),
    isRead: Boolean(item.isRead),
    linkUrl: item.actionUrl || item.linkUrl || undefined,
  };
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const NOTIFICATIONS_STORAGE_KEY = 'abps_admin_notifications_v1';

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [customNotifications, setCustomNotifications] = useState<NotificationItem[]>([]);
  const [apiNotifications, setApiNotifications] = useState<NotificationItem[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Restore custom notifications from localStorage safely after hydration
  useEffect(() => {
    try {
      const saved = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setCustomNotifications(parsed);
        }
      }
    } catch (err) {
      console.warn('Could not restore notification data from storage', err);
    }
  }, []);

  // Persist custom notifications to localStorage
  useEffect(() => {
    if (!isInitialized) return;
    try {
      localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(customNotifications));
    } catch (err) {
      console.warn('Could not save notification data to storage', err);
    }
  }, [customNotifications, isInitialized]);

  // Fetch notifications from backend API
  const refreshNotifications = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/notifications?pageSize=50');
      if (response.ok) {
        const json = await response.json();
        const rawList = json?.data || (Array.isArray(json) ? json : []);
        if (Array.isArray(rawList) && rawList.length > 0) {
          const mapped = rawList.map(mapApiNotificationToFrontend);
          setApiNotifications(mapped);
        } else if (process.env.NODE_ENV === 'production') {
          setApiNotifications([]);
        } else {
          setApiNotifications(MOCK_NOTIFICATIONS);
        }
      } else {
        if (process.env.NODE_ENV !== 'production') {
          setApiNotifications(MOCK_NOTIFICATIONS);
        }
      }
    } catch (err: any) {
      console.warn('Notifications API fetch fallback:', err?.message);
      setError(err?.message || 'Error loading notifications');
      if (process.env.NODE_ENV !== 'production') {
        setApiNotifications(MOCK_NOTIFICATIONS);
      }
    } finally {
      setIsLoading(false);
      setIsInitialized(true);
    }
  }, []);

  useEffect(() => {
    refreshNotifications();
  }, [refreshNotifications]);

  // Combined notification list (custom modifications override API/mock data by ID)
  const allNotifications: NotificationItem[] = useMemo(() => {
    const baseList =
      apiNotifications.length > 0
        ? apiNotifications
        : process.env.NODE_ENV === 'production'
        ? []
        : MOCK_NOTIFICATIONS;

    const customIds = new Set(customNotifications.map((n) => n.id.toLowerCase()));
    const remainingBase = baseList.filter((n) => !customIds.has(n.id.toLowerCase()));
    return [...customNotifications, ...remainingBase];
  }, [apiNotifications, customNotifications]);

  const unreadCount = useMemo(() => {
    return allNotifications.filter((n) => !n.isRead).length;
  }, [allNotifications]);

  const getNotification = useCallback(
    (id: string): NotificationItem | undefined => {
      if (!id) return undefined;
      const clean = id.trim().toLowerCase();
      return allNotifications.find((n) => n.id.toLowerCase() === clean);
    },
    [allNotifications]
  );

  const markAsRead = useCallback(
    async (id: string): Promise<NotificationMutationResult> => {
      const existing = getNotification(id);
      if (!existing) {
        return { success: false, error: 'Notification not found' };
      }

      const updated: NotificationItem = {
        ...existing,
        isRead: true,
      };

      setCustomNotifications((prev) => {
        const filtered = prev.filter((n) => n.id !== existing.id);
        return [updated, ...filtered];
      });

      // Background API sync if UUID
      if (id.includes('-')) {
        try {
          await fetch(`/api/notifications/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isRead: true }),
          });
        } catch (err) {
          console.warn('Notification markAsRead sync error:', err);
        }
      }

      return { success: true, notification: updated };
    },
    [getNotification]
  );

  const markAllAsRead = useCallback(async (): Promise<NotificationMutationResult> => {
    setCustomNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setApiNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));

    try {
      await fetch('/api/notifications/read-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (err) {
      console.warn('Notification markAllAsRead sync error:', err);
    }

    return { success: true };
  }, []);

  const deleteNotification = useCallback(
    async (id: string): Promise<NotificationMutationResult> => {
      const existing = getNotification(id);
      if (!existing) {
        return { success: false, error: 'Notification not found' };
      }

      setCustomNotifications((prev) => prev.filter((n) => n.id !== existing.id));
      setApiNotifications((prev) => prev.filter((n) => n.id !== existing.id));

      if (id.includes('-')) {
        try {
          await fetch(`/api/notifications/${id}`, {
            method: 'DELETE',
          });
        } catch (err) {
          console.warn('Notification delete sync error:', err);
        }
      }

      return { success: true };
    },
    [getNotification]
  );

  const addNotification = useCallback(
    async (input: CreateNotificationContextInput): Promise<NotificationMutationResult> => {
      const newId = `notif-${Date.now()}`;
      const newNotif: NotificationItem = {
        id: newId,
        title: input.title,
        message: input.message,
        type: input.type || 'system',
        severity: input.severity || 'info',
        timestamp: new Date().toISOString(),
        isRead: false,
        linkUrl: input.actionUrl || input.linkUrl || undefined,
      };

      setCustomNotifications((prev) => [newNotif, ...prev]);

      // If valid user ID provided, sync to backend
      if (input.userId && input.userId.includes('-')) {
        try {
          const res = await fetch('/api/notifications', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: input.userId,
              title: input.title,
              message: input.message,
              type: input.type || 'system',
              severity: input.severity || 'info',
              actionUrl: input.actionUrl || input.linkUrl || undefined,
            }),
          });
          if (res.ok) {
            const data = await res.json();
            if (data?.data?.id) {
              const mapped = mapApiNotificationToFrontend(data.data);
              setCustomNotifications((prev) =>
                prev.map((n) => (n.id === newId ? mapped : n))
              );
              return { success: true, notification: mapped };
            }
          }
        } catch (err) {
          console.warn('Notification creation sync error:', err);
        }
      }

      return { success: true, notification: newNotif };
    },
    []
  );

  const clearAll = useCallback(async (): Promise<NotificationMutationResult> => {
    setCustomNotifications([]);
    setApiNotifications([]);
    try {
      localStorage.removeItem(NOTIFICATIONS_STORAGE_KEY);
    } catch (e) {
      console.warn('Failed to clear notification storage key', e);
    }
    return { success: true };
  }, []);

  const value = useMemo(
    () => ({
      notifications: allNotifications,
      unreadCount,
      isLoading,
      isInitialized,
      error,
      getNotification,
      markAsRead,
      markAllAsRead,
      deleteNotification,
      addNotification,
      clearAll,
      refreshNotifications,
    }),
    [
      allNotifications,
      unreadCount,
      isLoading,
      isInitialized,
      error,
      getNotification,
      markAsRead,
      markAllAsRead,
      deleteNotification,
      addNotification,
      clearAll,
      refreshNotifications,
    ]
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
