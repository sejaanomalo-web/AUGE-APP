"use client";

import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";
import { GlassOverlay } from "./GlassOverlay";
import { cn } from "@/lib/utils";

export type ToastType = "success" | "error" | "info";

export interface GlassToastProps {
  open: boolean;
  type?: ToastType;
  title: string;
  description?: string;
  onClose: () => void;
}

export function GlassToast({
  open,
  type = "info",
  title,
  description,
  onClose,
}: GlassToastProps) {
  const Icon =
    type === "success"
      ? CheckCircle2
      : type === "error"
        ? AlertCircle
        : Info;
  const iconColor =
    type === "success"
      ? "text-success"
      : type === "error"
        ? "text-error"
        : "text-accent";

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="fixed top-[calc(env(safe-area-inset-top)+1rem)] left-4 right-4 md:left-auto md:right-4 md:max-w-md z-[70]"
        >
          <GlassOverlay
            intensity="strong"
            rounded="2xl"
            className="p-4 flex items-start gap-3"
          >
            <Icon
              className={cn("w-5 h-5 flex-shrink-0 mt-0.5", iconColor)}
              aria-hidden
            />
            <div className="flex-1 min-w-0">
              <div className="font-bold text-body text-text-primary">
                {title}
              </div>
              {description && (
                <div className="text-caption text-text-secondary mt-0.5">
                  {description}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="-mt-1 -mr-1 w-8 h-8 rounded-full flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-bg-hover transition-colors"
              aria-label="Fechar"
            >
              <X size={14} aria-hidden />
            </button>
          </GlassOverlay>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
