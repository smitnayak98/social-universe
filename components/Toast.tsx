"use client";

import type { ReactNode } from "react";
import React, { createContext, useContext, useEffect, useState } from "react";

type ToastType = "success" | "error" | "warning" | "info";

type Toast = {
  id: number;
  message: string;
  type: ToastType;
};

type ToastContextValue = {
  showToast: (message: string, type?: ToastType) => void;
};

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

const TYPE_STYLES: Record<ToastType, string> = {
  success: "bg-emerald-500/95 text-white border-emerald-300/70",
  error: "bg-rose-500/95 text-white border-rose-300/70",
  warning: "bg-amber-500/95 text-black border-amber-900/30",
  info: "bg-sky-500/95 text-white border-sky-300/70",
};

export function ToastProvider({ children }: { children: ReactNode }): JSX.Element {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (message: string, type: ToastType = "info") => {
    setToasts((prev) => [
      ...prev,
      {
        id: Date.now(),
        message,
        type,
      },
    ]);
  };

  useEffect(() => {
    if (toasts.length === 0) return;

    const timers = toasts.map((toast) =>
      window.setTimeout(() => {
        setToasts((current) => current.filter((t) => t.id !== toast.id));
      }, 4000),
    );

    return () => {
      timers.forEach((id) => window.clearTimeout(id));
    };
  }, [toasts]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto max-w-xs rounded-xl border px-4 py-3 text-sm font-medium shadow-xl shadow-black/40 ${TYPE_STYLES[toast.type]}`}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return ctx;
}

