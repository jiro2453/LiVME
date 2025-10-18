import { useState, useCallback } from 'react';
import { toast } from 'sonner@2.0.3';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastOptions {
  title?: string;
  description?: string;
  duration?: number;
}

export function useToast() {
  const showToast = useCallback((type: ToastType, message: string, options?: ToastOptions) => {
    const { title, description, duration = 3000 } = options || {};
    
    switch (type) {
      case 'success':
        toast.success(title || message, {
          description,
          duration,
        });
        break;
      case 'error':
        toast.error(title || message, {
          description,
          duration,
        });
        break;
      case 'info':
        toast.info(title || message, {
          description,
          duration,
        });
        break;
      case 'warning':
        toast.warning(title || message, {
          description,
          duration,
        });
        break;
    }
  }, []);

  return { showToast };
}

// 便利なラッパー関数
export const useNotification = () => {
  const { showToast } = useToast();

  return {
    success: (message: string, options?: ToastOptions) => showToast('success', message, options),
    error: (message: string, options?: ToastOptions) => showToast('error', message, options),
    info: (message: string, options?: ToastOptions) => showToast('info', message, options),
    warning: (message: string, options?: ToastOptions) => showToast('warning', message, options),
  };
};