import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { T } from '../dashboard/tokens';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastContextType {
  addToast: (message: string, type?: ToastType, action?: Toast['action'], duration?: number) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

// eslint-disable-next-line react-refresh/only-export-components
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within a ToastProvider');
  return context;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const addToast = useCallback((message: string, type: ToastType = 'success', action?: Toast['action'], duration = 4000) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, message, type, action }]);

    if (duration > 0) {
      setTimeout(() => removeToast(id), duration);
    }
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      <div style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        pointerEvents: 'none',
      }}>
        {toasts.map(toast => (
          <ToastItem key={toast.id} toast={toast} onRemove={() => removeToast(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onRemove }: { toast: Toast, onRemove: () => void }) {
  const isSuccess = toast.type === 'success';
  const isError = toast.type === 'error';

  return (
    <div
      className="toast-container"
      style={{
        pointerEvents: 'auto',
        minWidth: 280,
        maxWidth: 420,
        background: 'rgba(15, 25, 41, 0.9)',
        backdropFilter: 'blur(12px)',
        border: `1px solid ${isSuccess ? 'rgba(34, 211, 165, 0.3)' : isError ? 'rgba(248, 113, 113, 0.3)' : T.border2}`,
        borderRadius: 12,
        padding: '12px 16px',
        boxShadow: '0 12px 32px rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        animation: 'toast-in 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      <div style={{
        width: 24, height: 24, borderRadius: '50%',
        background: isSuccess ? 'rgba(34, 211, 165, 0.15)' : isError ? 'rgba(248, 113, 113, 0.15)' : 'rgba(0, 229, 255, 0.15)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: isSuccess ? T.green : isError ? T.red : T.accent,
        fontSize: '0.8rem', flexShrink: 0,
      }}>
        {isSuccess ? '✓' : isError ? '✕' : 'ℹ'}
      </div>

      <div style={{ flex: 1 }}>
        <div style={{ color: T.text, fontSize: '0.84rem', fontWeight: 500, lineHeight: 1.4 }}>
          {toast.message}
        </div>
      </div>

      {toast.action && (
        <button
          onClick={() => { toast.action?.onClick(); onRemove(); }}
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: `1px solid ${T.border}`,
            borderRadius: 6,
            padding: '4px 10px',
            color: T.accent,
            fontSize: '0.72rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
        >
          {toast.action.label}
        </button>
      )}

      <button
        onClick={onRemove}
        style={{
          background: 'none', border: 'none', color: T.text3,
          cursor: 'pointer', fontSize: '0.9rem', padding: 4,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        ✕
      </button>
    </div>
  );
}
