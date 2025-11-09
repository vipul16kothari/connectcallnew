import React, { createContext, useContext, useState } from 'react';
import Toast, { ToastType } from '@/components/Toast';

interface ToastContextType {
  showToast: (message: string, type?: ToastType, duration?: number) => void;
  showError: (message: string) => void;
  showSuccess: (message: string) => void;
  showInfo: (message: string) => void;
  showWarning: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [type, setType] = useState<ToastType>('info');
  const [duration, setDuration] = useState(3000);

  const showToast = (msg: string, toastType: ToastType = 'info', toastDuration: number = 3000) => {
    setMessage(msg);
    setType(toastType);
    setDuration(toastDuration);
    setVisible(true);
  };

  const showError = (msg: string) => {
    showToast(msg, 'error', 4000);
  };

  const showSuccess = (msg: string) => {
    showToast(msg, 'success', 3000);
  };

  const showInfo = (msg: string) => {
    showToast(msg, 'info', 3000);
  };

  const showWarning = (msg: string) => {
    showToast(msg, 'warning', 3500);
  };

  const hideToast = () => {
    setVisible(false);
  };

  return (
    <ToastContext.Provider
      value={{
        showToast,
        showError,
        showSuccess,
        showInfo,
        showWarning,
      }}
    >
      {children}
      <Toast
        visible={visible}
        message={message}
        type={type}
        duration={duration}
        onHide={hideToast}
      />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
