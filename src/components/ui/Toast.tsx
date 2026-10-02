"use client";

import React, { useState, useCallback, createContext, useContext, useEffect } from "react";
import { CheckCircle2, AlertTriangle, Info, X } from "lucide-react";

/* ── Types ────────────────────────────────── */
export type ToastVariant = "success" | "error" | "warning" | "info";

export interface ToastItem {
  id: string;
  variant: ToastVariant;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextValue {
  addToast: (toast: Omit<ToastItem, "id">) => void;
}

/* ── Context ──────────────────────────────── */
const ToastContext = createContext<ToastContextValue>({ addToast: () => {} });

export const useToast = () => useContext(ToastContext);

/* ── Icon + colour map ───────────────────── */
const variantMap: Record<ToastVariant, { icon: React.ElementType; bar: string; bg: string; text: string }> = {
  success: { icon: CheckCircle2, bar: "bg-[#4A7A3A]", bg: "bg-[#EBF4E8]", text: "text-[#3A6B30]" },
  error:   { icon: AlertTriangle, bar: "bg-[#A94A3F]", bg: "bg-[#FAF0EF]", text: "text-[#A94A3F]" },
  warning: { icon: AlertTriangle, bar: "bg-[#B87A3A]", bg: "bg-[#FDF3E3]", text: "text-[#8A5C2A]" },
  info:    { icon: Info,          bar: "bg-[#556B3F]", bg: "bg-[#EEF3E8]", text: "text-[#344438]" },
};

/* ── Single Toast ────────────────────────── */
function ToastCard({ toast, onDismiss }: { toast: ToastItem; onDismiss: (id: string) => void }) {
  const { icon: Icon, bar, bg, text } = variantMap[toast.variant];

  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), toast.duration ?? 4000);
    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onDismiss]);

  return (
    <div
      className={`relative flex items-start gap-3 w-full max-w-sm rounded-xl border border-black/10 shadow-lg overflow-hidden ${bg} pointer-events-auto`}
    >
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${bar}`} />
      <div className={`flex-shrink-0 mt-3.5 ml-4 ${text}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 py-3.5 pr-2 min-w-0">
        <p className={`text-sm font-black tracking-wide ${text}`}>{toast.title}</p>
        {toast.message && (
          <p className="text-xs text-[#687066] font-medium mt-0.5 leading-relaxed">{toast.message}</p>
        )}
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        className="flex-shrink-0 mt-2 mr-2 text-[#687066] hover:text-[#263229] transition-colors p-1 rounded"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

/* ── Provider ────────────────────────────── */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = useCallback((toast: Omit<ToastItem, "id">) => {
    setToasts((prev) => [
      ...prev,
      { ...toast, id: `toast-${Date.now()}-${Math.random()}` },
    ]);
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      {/* Toast stack — bottom-right */}
      <div
        className="fixed bottom-6 right-6 z-[300] flex flex-col gap-3 pointer-events-none"
        aria-live="polite"
      >
        {toasts.map((t) => (
          <ToastCard key={t.id} toast={t} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}
