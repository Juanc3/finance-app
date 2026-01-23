"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { CheckCircle2, XCircle, AlertCircle, X, Info } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastType = "success" | "error" | "info" | "warning";

interface Toast {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
}

interface ToastContextType {
  toast: (options: { title?: string; message: string; type?: ToastType; duration?: number }) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(({ title, message, type = "success", duration = 3000 }: { title?: string; message: string; type?: ToastType; duration?: number }) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, title, message, type }]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ toast, removeToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-100 flex flex-col gap-2 w-full max-w-sm pointer-events-none">
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto animate-in slide-in-from-right-full fade-in duration-300">
            <GlassCard className={cn(
                "p-4 flex items-start gap-3 border shadow-xl backdrop-blur-xl",
                t.type === "success" && "border-emerald-500/20 bg-emerald-500/5 dark:bg-emerald-950/30",
                t.type === "error" && "border-destructive/20 bg-destructive/5 dark:bg-destructive/20",
                t.type === "warning" && "border-amber-500/20 bg-amber-500/5 dark:bg-amber-950/30",
                t.type === "info" && "border-blue-500/20 bg-blue-500/5 dark:bg-blue-950/30",
            )}>
              <div className={cn(
                  "shrink-0 rounded-full p-1",
                  t.type === "success" && "text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-500/10",
                  t.type === "error" && "text-destructive dark:text-red-400 bg-destructive/10",
                  t.type === "warning" && "text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-500/10",
                  t.type === "info" && "text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-500/10",
              )}>
                {t.type === "success" && <CheckCircle2 className="h-5 w-5" />}
                {t.type === "error" && <XCircle className="h-5 w-5" />}
                {t.type === "warning" && <AlertCircle className="h-5 w-5" />}
                {t.type === "info" && <Info className="h-5 w-5" />}
              </div>
              <div className="flex-1 min-w-0">
                {t.title && <h4 className={cn("text-sm font-bold", 
                    t.type === "success" && "text-emerald-700 dark:text-emerald-100",
                    t.type === "error" && "text-red-700 dark:text-red-100",
                    t.type === "warning" && "text-amber-700 dark:text-amber-100",
                    t.type === "info" && "text-blue-700 dark:text-blue-100",
                )}>{t.title}</h4>}
                <p className={cn("text-sm mt-0.5",
                     t.type === "success" && "text-emerald-600/90 dark:text-emerald-200/80",
                    t.type === "error" && "text-red-600/90 dark:text-red-200/80",
                    t.type === "warning" && "text-amber-600/90 dark:text-amber-200/80",
                    t.type === "info" && "text-blue-600/90 dark:text-blue-200/80",
                )}>{t.message}</p>
              </div>
              <button 
                onClick={() => removeToast(t.id)} 
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </GlassCard>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
