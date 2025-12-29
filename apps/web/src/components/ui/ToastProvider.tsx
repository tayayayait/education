import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { cn } from './utils';

type ToastVariant = 'default' | 'success' | 'danger' | 'warning' | 'info';

export interface ToastOptions {
  title?: string;
  message: string;
  variant?: ToastVariant;
  duration?: number;
}

type ToastItem = ToastOptions & {
  id: string;
};

type ToastContextValue = {
  addToast: (toast: ToastOptions) => string;
  removeToast: (id: string) => void;
  clearToasts: () => void;
};

const ToastContext = React.createContext<ToastContextValue | null>(null);

const variantClasses: Record<ToastVariant, string> = {
  default: 'bg-card text-text-primary border-border',
  success: 'bg-success/10 text-success border-success/20',
  danger: 'bg-danger/10 text-danger border-danger/20',
  warning: 'bg-warning/10 text-warning border-warning/20',
  info: 'bg-info/10 text-info border-info/20'
};

const createId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = useCallback((toast: ToastOptions) => {
    const id = createId();
    const newToast: ToastItem = {
      id,
      title: toast.title,
      message: toast.message,
      variant: toast.variant ?? 'default',
      duration: toast.duration ?? 4000
    };
    setToasts(prev => [...prev, newToast].slice(-3));
    return id;
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(item => item.id !== id));
  }, []);

  const clearToasts = useCallback(() => {
    setToasts([]);
  }, []);

  const value = useMemo(() => ({ addToast, removeToast, clearToasts }), [addToast, removeToast, clearToasts]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {typeof document !== 'undefined'
        ? createPortal(
            <div
              className="fixed right-4 top-4 z-50 flex w-full max-w-[360px] flex-col gap-2"
              role="region"
              aria-live="polite"
              aria-relevant="additions"
              aria-atomic="false"
            >
              {toasts.map((toast) => (
                <ToastItemView key={toast.id} toast={toast} onDismiss={removeToast} />
              ))}
            </div>,
            document.body
          )
        : null}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};

const ToastItemView: React.FC<{ toast: ToastItem; onDismiss: (id: string) => void }> = ({ toast, onDismiss }) => {
  const timerRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const remainingRef = useRef<number>(toast.duration ?? 4000);

  const clearTimer = () => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const startTimer = useCallback(() => {
    if (!toast.duration || toast.duration <= 0) return;
    startTimeRef.current = Date.now();
    timerRef.current = window.setTimeout(() => {
      onDismiss(toast.id);
    }, remainingRef.current);
  }, [onDismiss, toast.duration, toast.id]);

  useEffect(() => {
    startTimer();
    return clearTimer;
  }, [startTimer]);

  const handleMouseEnter = () => {
    if (!toast.duration || toast.duration <= 0) return;
    if (startTimeRef.current) {
      const elapsed = Date.now() - startTimeRef.current;
      remainingRef.current = Math.max(0, remainingRef.current - elapsed);
    }
    clearTimer();
  };

  const handleMouseLeave = () => {
    if (!toast.duration || toast.duration <= 0) return;
    startTimer();
  };

  return (
    <div
      className={cn(
        'rounded-md border px-4 py-3 text-sm shadow-card backdrop-blur',
        variantClasses[toast.variant ?? 'default']
      )}
      role="status"
      aria-atomic="true"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          {toast.title && <div className="text-sm font-semibold">{toast.title}</div>}
          <div className={cn('text-xs', toast.title ? 'mt-1' : undefined)}>{toast.message}</div>
        </div>
        <button
          type="button"
          className="text-xs text-text-secondary hover:text-text-primary"
          onClick={() => onDismiss(toast.id)}
          aria-label="Close"
        >
          x
        </button>
      </div>
    </div>
  );
};
