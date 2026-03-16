import { createContext, useCallback, useContext, useState } from 'react';

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'confirm';
  onConfirm?: () => void;
  onCancel?: () => void;
}

interface ToastContextType {
  success: (msg: string) => void;
  error: (msg: string) => void;
  confirm: (msg: string) => Promise<boolean>;
}

const ToastContext = createContext<ToastContextType>({
  success: () => {},
  error: () => {},
  confirm: () => Promise.resolve(false),
});

export function useToast() {
  return useContext(ToastContext);
}

let toastId = 0;

export default function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const remove = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const success = useCallback((message: string) => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, message, type: 'success' }]);
    setTimeout(() => remove(id), 3000);
  }, [remove]);

  const error = useCallback((message: string) => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, message, type: 'error' }]);
    setTimeout(() => remove(id), 4000);
  }, [remove]);

  const confirm = useCallback((message: string): Promise<boolean> => {
    return new Promise((resolve) => {
      const id = ++toastId;
      setToasts((prev) => [
        ...prev,
        {
          id,
          message,
          type: 'confirm',
          onConfirm: () => { remove(id); resolve(true); },
          onCancel: () => { remove(id); resolve(false); },
        },
      ]);
    });
  }, [remove]);

  return (
    <ToastContext.Provider value={{ success, error, confirm }}>
      {children}
      {/* Toast container */}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 max-w-sm">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`rounded-xl shadow-2xl px-4 py-3 text-sm font-medium backdrop-blur-sm animate-[slideUp_0.2s_ease-out] ${
              t.type === 'success'
                ? 'bg-green-600/90 text-white dark:bg-green-500/90'
                : t.type === 'error'
                ? 'bg-red-600/90 text-white dark:bg-red-500/90'
                : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700'
            }`}
          >
            {t.type === 'confirm' ? (
              <div>
                <p className="mb-3">{t.message}</p>
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={t.onCancel}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={t.onConfirm}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-3">
                <span>{t.message}</span>
                <button onClick={() => remove(t.id)} className="opacity-60 hover:opacity-100 text-lg leading-none">&times;</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
