"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
} from "react";
import { GlassToast, type ToastType } from "@/components/visual/GlassToast";

export interface ToastInput {
  type?: ToastType;
  title: string;
  description?: string;
  durationMs?: number;
}

interface ToastEntry extends Required<Omit<ToastInput, "durationMs">> {
  id: string;
}

interface ToastContextValue {
  toast: (t: ToastInput) => void;
}

const ToastCtx = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastEntry[]>([]);

  const toast = useCallback((t: ToastInput) => {
    const id = Math.random().toString(36).slice(2);
    const entry: ToastEntry = {
      id,
      type: t.type ?? "info",
      title: t.title,
      description: t.description ?? "",
    };
    setToasts((prev) => [...prev, entry]);
    const duration = t.durationMs ?? 4000;
    setTimeout(() => {
      setToasts((prev) => prev.filter((x) => x.id !== id));
    }, duration);
  }, []);

  return (
    <ToastCtx.Provider value={{ toast }}>
      {children}
      {/* Stack toasts vertically by offsetting via translate. */}
      <div className="pointer-events-none">
        {toasts.map((t, i) => (
          <div
            key={t.id}
            style={{ transform: `translateY(${i * 84}px)` }}
            className="pointer-events-auto"
          >
            <GlassToast
              open
              type={t.type}
              title={t.title}
              description={t.description || undefined}
              onClose={() =>
                setToasts((prev) => prev.filter((x) => x.id !== t.id))
              }
            />
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}
