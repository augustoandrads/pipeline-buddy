/**
 * Toast Component
 * Displays temporary notifications at top of screen
 */

import React, { useEffect } from 'react';
import './Toast.css';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastProps {
  id: string;
  message: string;
  type?: ToastType;
  duration?: number;
  onDismiss: (id: string) => void;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const Toast: React.FC<ToastProps> = ({
  id,
  message,
  type = 'info',
  duration = 5000,
  onDismiss,
  action,
}) => {
  useEffect(() => {
    if (duration <= 0) return;

    const timer = setTimeout(() => {
      onDismiss(id);
    }, duration);

    return () => clearTimeout(timer);
  }, [id, duration, onDismiss]);

  return (
    <div className={`toast toast--${type}`} role="alert" data-testid={`toast-${id}`}>
      <div className="toast__content">
        <p className="toast__message">{message}</p>
        {action && (
          <button className="toast__action" onClick={action.onClick}>
            {action.label}
          </button>
        )}
      </div>
      <button
        className="toast__close"
        onClick={() => onDismiss(id)}
        aria-label="Dismiss notification"
      >
        ×
      </button>
    </div>
  );
};

export default Toast;
