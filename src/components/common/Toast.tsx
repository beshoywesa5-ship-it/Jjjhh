import React from 'react';
import { useApp } from '../../context/AppContext';
import { X, CheckCircle2, RotateCcw } from 'lucide-react';

export const Toast: React.FC = () => {
  const { toast, dismissToast } = useApp();

  if (!toast) return null;

  return (
    <div 
      role="status" 
      aria-live="polite"
      className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm px-4 pointer-events-none animate-in fade-in slide-in-from-bottom-3 duration-200"
    >
      <div className="pointer-events-auto flex items-center justify-between gap-3 p-3 rounded-2xl bg-slate-900/95 dark:bg-slate-800/95 text-white backdrop-blur-md shadow-2xl border border-white/10 text-xs sm:text-sm">
        <div className="flex items-center gap-2 min-w-0">
          <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
          <span className="font-semibold text-slate-100 truncate">
            {toast.message}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {toast.actionLabel && toast.onAction && (
            <button
              type="button"
              onClick={() => {
                toast.onAction?.();
                dismissToast();
              }}
              className="px-2.5 py-1 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1 active:scale-95 shadow-xs"
            >
              <RotateCcw size={12} className="rtl:rotate-180" />
              <span>{toast.actionLabel}</span>
            </button>
          )}

          <button
            type="button"
            onClick={dismissToast}
            className="p-1 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
            aria-label="Dismiss"
          >
            <X size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};
