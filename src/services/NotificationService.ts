/**
 * NotificationService
 * Handles notification creation, queuing, and delivery
 */

import { supabase } from '@/lib/supabase';

export interface Notification {
  id: number;
  user_id: string;
  type: string;
  title: string;
  message: string;
  action_url?: string;
  is_read: boolean;
  read_at?: string;
  created_at: string;
  expires_at: string;
}

export interface NotificationQueue {
  id: number;
  notification_id: number;
  channel: 'toast' | 'email';
  status: 'pending' | 'sent' | 'failed' | 'retry';
  send_attempts: number;
  max_attempts: number;
  next_retry_at?: string;
  error_message?: string;
  sent_at?: string;
  created_at: string;
}

export type NotificationType = 'lead_assigned' | 'mention' | 'assignment_update';

/**
 * Create a notification for a user
 */
export async function createNotification(
  userId: string,
  type: NotificationType,
  title: string,
  message: string,
  actionUrl?: string
): Promise<number> {
  const { data, error } = await supabase.rpc('create_notification', {
    p_user_id: userId,
    p_type: type,
    p_title: title,
    p_message: message,
    p_action_url: actionUrl,
  });

  if (error) throw error;
  return data as number;
}

/**
 * Get user's notifications
 */
export async function getUserNotifications(
  userId: string,
  limit = 50,
  offset = 0
): Promise<Notification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;
  return data || [];
}

/**
 * Get unread notification count
 */
export async function getUnreadCount(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_read', false);

  if (error) throw error;
  return count || 0;
}

/**
 * Mark notification as read
 */
export async function markAsRead(notificationId: number): Promise<void> {
  const { error } = await supabase.rpc('mark_notification_read', {
    p_notification_id: notificationId,
  });

  if (error) throw error;
}

/**
 * Mark all notifications as read for user
 */
export async function markAllAsRead(userId: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('is_read', false);

  if (error) throw error;
}

/**
 * Delete a notification
 */
export async function deleteNotification(notificationId: number): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('id', notificationId);

  if (error) throw error;
}

/**
 * Subscribe to real-time notifications via Supabase Realtime
 */
export function subscribeToNotifications(
  userId: string,
  callback: (notification: Notification) => void
) {
  const subscription = supabase
    .channel(`notifications:${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        callback(payload.new as Notification);
      }
    )
    .subscribe();

  return subscription;
}

/**
 * Get notification templates
 */
export async function getNotificationTemplate(key: NotificationType) {
  const { data, error } = await supabase
    .from('notification_templates')
    .select('*')
    .eq('key', key)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Process pending notifications (background job)
 * This would typically run as a scheduled function on the backend
 */
export async function processPendingNotifications() {
  try {
    // Get pending notifications
    const { data: pending, error } = await supabase
      .from('notification_queue')
      .select('*')
      .eq('status', 'pending')
      .lt('send_attempts', 3);

    if (error) throw error;

    // Process each pending notification
    for (const item of pending || []) {
      try {
        if (item.channel === 'toast') {
          // Toast notifications are handled by frontend via Realtime
          await supabase
            .from('notification_queue')
            .update({ status: 'sent', sent_at: new Date().toISOString() })
            .eq('id', item.id);
        } else if (item.channel === 'email') {
          // Email sending would go here (via Resend, SendGrid, etc.)
          // For now, mark as sent
          await supabase
            .from('notification_queue')
            .update({ status: 'sent', sent_at: new Date().toISOString() })
            .eq('id', item.id);
        }
      } catch (itemError) {
        // On error, mark for retry
        await supabase
          .from('notification_queue')
          .update({
            status: 'retry',
            send_attempts: item.send_attempts + 1,
            error_message: String(itemError),
            next_retry_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 min retry
          })
          .eq('id', item.id);
      }
    }
  } catch (error) {
    console.error('Error processing pending notifications:', error);
  }
}
