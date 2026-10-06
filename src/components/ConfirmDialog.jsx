import { createContext, useContext, useState, useCallback } from 'react';

const ConfirmContext = createContext(null);

export function ConfirmProvider({ children }) {
  const [state, setState] = useState(null);

  const confirm = useCallback((opts) => {
    const options = typeof opts === 'string' ? { message: opts } : opts;
    return new Promise((resolve) => {
      setState({ ...options, resolve });
    });
  }, []);

  const close = (result) => {
    if (state && state.resolve) state.resolve(result);
    setState(null);
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {state && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-[110] p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            {state.title && (
              <h2 className="text-lg font-bold text-gray-800 mb-2">{state.title}</h2>
            )}
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{state.message}</p>

            <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-gray-200">
              <button
                onClick={() => close(false)}
                className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm"
              >
                {state.cancelLabel || 'Cancel'}
              </button>
              <button
                onClick={() => close(true)}
                className={`px-4 py-2 rounded-lg text-white text-sm ${state.danger ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}`}
              >
                {state.confirmLabel || (state.danger ? 'Delete' : 'Confirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm must be used inside <ConfirmProvider>');
  return ctx;
}
