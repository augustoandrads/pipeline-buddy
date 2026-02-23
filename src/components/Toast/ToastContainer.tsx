/**
 * ToastContainer Component
 * Manages multiple toast notifications
 */

import React, { useCallback, useState } from 'react';
import Toast, { ToastProps, ToastType } from './Toast';
import './ToastContainer.css';

export interface ToastMessage {
  message: string;
  type?: ToastType;
  duration?: number;
  action?: ToastProps['action'];
}

interface ContainerState {
  [key: string]: ToastMessage;
}

export const ToastContext = React.createContext<{
  show: (message: ToastMessage) => void;
} | null>(null);

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}

export const ToastContainer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ContainerState>({});

  const show = useCallback((message: ToastMessage) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts((prev) => ({ ...prev, [id]: message }));
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => {
      const { [id]: _, ...rest } = prev;
      return rest;
    });
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div className="toast-container" role="region" aria-label="Notifications">
        {Object.entries(toasts).map(([id, toast]) => (
          <Toast
            key={id}
            id={id}
            message={toast.message}
            type={toast.type}
            duration={toast.duration}
            onDismiss={dismiss}
            action={toast.action}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export default ToastContainer;
