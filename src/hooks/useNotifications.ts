/**
 * useNotifications Hook
 * Manages real-time notifications and unread count
 */

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from './useAuth';
import {
  getUserNotifications,
  getUnreadCount,
  subscribeToNotifications,
  markAsRead,
  deleteNotification,
  Notification,
} from '@/services/NotificationService';

interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  markAsRead: (id: number) => Promise<void>;
  deleteNotification: (id: number) => Promise<void>;
  refreshNotifications: () => Promise<void>;
}

export function useNotifications(): UseNotificationsReturn {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load initial notifications
  const loadNotifications = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      const data = await getUserNotifications(user.id);
      const count = await getUnreadCount(user.id);
      setNotifications(data);
      setUnreadCount(count);
      setError(null);
    } catch (err) {
      setError(String(err));
      console.error('Error loading notifications:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Subscribe to real-time notifications
  useEffect(() => {
    if (!user) return;

    loadNotifications();

    // Subscribe to new notifications
    const subscription = subscribeToNotifications(user.id, (newNotification) => {
      setNotifications((prev) => [newNotification, ...prev]);
      setUnreadCount((prev) => prev + 1);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [user, loadNotifications]);

  // Mark as read
  const handleMarkAsRead = useCallback(
    async (id: number) => {
      try {
        await markAsRead(id);
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch (err) {
        console.error('Error marking as read:', err);
      }
    },
    []
  );

  // Delete notification
  const handleDeleteNotification = useCallback(async (id: number) => {
    try {
      await deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  }, []);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead: handleMarkAsRead,
    deleteNotification: handleDeleteNotification,
    refreshNotifications: loadNotifications,
  };
}
