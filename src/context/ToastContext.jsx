import { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);
let nextId = 1;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const push = useCallback((type, message, opts = {}) => {
    const id = nextId++;
    const duration = opts.duration ?? 4000;
    const toast = { id, type, message, ...opts };
    setToasts((prev) => [...prev, toast]);
    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }
    return id;
  }, []);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const api = {
    success: (msg, opts) => push('success', msg, opts),
    error:   (msg, opts) => push('error',   msg, opts),
    info:    (msg, opts) => push('info',    msg, opts),
    warning: (msg, opts) => push('warning', msg, opts),
    dismiss,
  };

  return (
    <ToastContext.Provider value={api}>
      {children}
      <ToastViewport toasts={toasts} dismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}

const COLORS = {
  success: { bg: 'bg-green-50',  border: 'border-green-200',  text: 'text-green-800',  icon: '✅' },
  error:   { bg: 'bg-red-50',    border: 'border-red-200',    text: 'text-red-800',    icon: '⛔' },
  info:    { bg: 'bg-blue-50',   border: 'border-blue-200',   text: 'text-blue-800',   icon: 'ℹ️' },
  warning: { bg: 'bg-amber-50',  border: 'border-amber-200',  text: 'text-amber-800',  icon: '⚠️' },
};

function ToastViewport({ toasts, dismiss }) {
  if (!toasts.length) return null;
  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-[calc(100vw-2rem)] sm:w-auto pointer-events-none">
      {toasts.map((t) => {
        const c = COLORS[t.type] || COLORS.info;
        return (
          <div
            key={t.id}
            className={`${c.bg} ${c.border} ${c.text} border rounded-lg shadow-lg p-3 flex items-start gap-2 pointer-events-auto`}
          >
            <span className="text-lg flex-shrink-0">{c.icon}</span>
            <p className="text-sm flex-1 break-words">{t.message}</p>
            <button
              onClick={() => dismiss(t.id)}
              className="text-current opacity-60 hover:opacity-100 text-lg leading-none flex-shrink-0"
              aria-label="Dismiss"
            >
              ×
            </button>
          </div>
        );
      })}
    </div>
  );
}
