/**
 * NotificationBell Component
 * Shows unread notification count and opens notification panel
 */

import React, { useState } from 'react';
import { useNotifications } from '@/hooks/useNotifications';
import './NotificationBell.css';

interface NotificationBellProps {
  onNotificationClick?: (notificationId: number) => void;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({ onNotificationClick }) => {
  const { notifications, unreadCount, markAsRead } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);

  const handleNotificationClick = (id: number) => {
    markAsRead(id);
    onNotificationClick?.(id);
    setIsOpen(false);
  };

  return (
    <div className="notification-bell">
      <button
        className="notification-bell__button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={`${unreadCount} unread notifications`}
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>

        {unreadCount > 0 && (
          <span className="notification-bell__badge">{unreadCount}</span>
        )}
      </button>

      {isOpen && (
        <div className="notification-bell__panel">
          <div className="notification-bell__header">
            <h3>Notificações</h3>
            <button
              className="notification-bell__close"
              onClick={() => setIsOpen(false)}
              aria-label="Close notifications"
            >
              ×
            </button>
          </div>

          <div className="notification-bell__list">
            {notifications.length === 0 ? (
              <p className="notification-bell__empty">Nenhuma notificação</p>
            ) : (
              notifications.map((notification) => (
                <button
                  key={notification.id}
                  className={`notification-bell__item ${
                    notification.is_read ? 'notification-bell__item--read' : ''
                  }`}
                  onClick={() => handleNotificationClick(notification.id)}
                >
                  <div className="notification-bell__item-content">
                    <p className="notification-bell__item-title">{notification.title}</p>
                    <p className="notification-bell__item-message">{notification.message}</p>
                    <p className="notification-bell__item-time">
                      {new Date(notification.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
