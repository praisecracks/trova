import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, CheckCircle2, AlertTriangle, XCircle, Info, ExternalLink } from 'lucide-react';

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  description?: string;
}

interface ToastContextType {
  toast: (message: string, type?: Toast['type'], description?: string, duration?: number) => void;
  success: (message: string, description?: string, duration?: number) => void;
  error: (message: string, description?: string, duration?: number) => void;
  warn: (message: string, description?: string, duration?: number) => void;
  info: (message: string, description?: string, duration?: number) => void;
  toasts: Toast[];
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (message: string, type: Toast['type'] = 'info', description?: string, duration = 4000) => {
      const id = `${Date.now()}-${Math.random()}`;
      // Replace existing toast instead of stacking
      setToasts([{ id, message, type, description, duration }]);
      
      setTimeout(() => {
        removeToast(id);
      }, duration);
    },
    [removeToast]
  );

  const success = useCallback((message: string, description?: string, duration?: number) => {
    toast(message, 'success', description, duration);
  }, [toast]);

  const error = useCallback((message: string, description?: string, duration?: number) => {
    toast(message, 'error', description, duration);
  }, [toast]);

  const warn = useCallback((message: string, description?: string, duration?: number) => {
    toast(message, 'warning', description, duration);
  }, [toast]);

  const info = useCallback((message: string, description?: string, duration?: number) => {
    toast(message, 'info', description, duration);
  }, [toast]);

  return (
    <ToastContext.Provider value={{ toast, success, error, warn, info, toasts, removeToast }}>
      {children}
      
      {/* Floating notification deck */}
      <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-3 w-full max-w-[380px] pointer-events-none px-4 sm:px-0">
        <AnimatePresence mode="popLayout">
          {toasts.map((t) => {
            // Pick nice theme-appropriate colors and match the product layout
            const config = {
              success: {
                icon: CheckCircle2,
                colorClass: 'text-emerald-500',
                borderClass: 'border-emerald-500/20 [.light-theme_&]:border-emerald-500/30',
                bgClass: 'bg-zinc-950/95 [.light-theme_&]:bg-white/95',
                lightIndicator: 'bg-emerald-500',
                glow: 'shadow-[0_8px_30px_rgb(16,185,129,0.06)]'
              },
              error: {
                icon: XCircle,
                colorClass: 'text-rose-500',
                borderClass: 'border-rose-500/20 [.light-theme_&]:border-rose-500/30',
                bgClass: 'bg-zinc-950/95 [.light-theme_&]:bg-white/95',
                lightIndicator: 'bg-rose-500',
                glow: 'shadow-[0_8px_30px_rgb(244,63,94,0.06)]'
              },
              warning: {
                icon: AlertTriangle,
                colorClass: 'text-amber-500',
                borderClass: 'border-amber-500/20 [.light-theme_&]:border-amber-500/30',
                bgClass: 'bg-zinc-950/95 [.light-theme_&]:bg-white/95',
                lightIndicator: 'bg-amber-500',
                glow: 'shadow-[0_8px_30px_rgb(245,158,11,0.06)]'
              },
              info: {
                icon: Info,
                colorClass: 'text-blue-500',
                borderClass: 'border-blue-500/20 [.light-theme_&]:border-blue-500/30',
                bgClass: 'bg-zinc-950/95 [.light-theme_&]:bg-white/95',
                lightIndicator: 'bg-blue-500',
                glow: 'shadow-[0_8px_30px_rgb(59,130,246,0.06)]'
              }
            }[t.type];

            const Icon = config.icon;

            return (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9, y: -10, transition: { duration: 0.2 } }}
                className={`pointer-events-auto relative w-full border ${config.borderClass} ${config.bgClass} ${config.glow} backdrop-blur-md rounded-xl p-4 flex gap-3 text-left overflow-hidden`}
                style={{
                  boxShadow: '0 12px 40px -12px rgba(0, 0, 0, 0.25)',
                }}
              >
                {/* Visual Accent Bar */}
                <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${config.lightIndicator}`} />

                {/* Main Content Pane */}
                <div className="flex-1 flex gap-3 pl-1.5">
                  <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${config.colorClass}`} />
                  <div className="flex flex-col gap-0.5 pr-2">
                    <span 
                      style={{ color: 'var(--text-primary)' }} 
                      className="text-xs font-bold font-sans tracking-tight leading-normal"
                    >
                      {t.message}
                    </span>
                    {t.description && (
                      <span 
                        style={{ color: 'var(--text-muted)' }} 
                        className="text-[11px] leading-relaxed font-medium font-sans"
                      >
                        {t.description}
                      </span>
                    )}
                  </div>
                </div>

                {/* Manual Dismiss Trigger */}
                <button
                  type="button"
                  onClick={() => removeToast(t.id)}
                  style={{ color: 'var(--text-muted)' }}
                  className="absolute top-3.5 right-3.5 hover:opacity-100 opacity-60 hover:scale-105 active:scale-95 p-1 transition-all rounded-md cursor-pointer hover:bg-zinc-100 [.dark-theme_&]:hover:bg-zinc-900"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};
