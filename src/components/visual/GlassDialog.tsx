"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { GlassOverlay } from "./GlassOverlay";

export interface GlassDialogProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children?: React.ReactNode;
  footer?: React.ReactNode;
}

export function GlassDialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
}: GlassDialogProps) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[60] w-[calc(100vw-32px)] max-w-md"
            role="dialog"
            aria-modal
          >
            <GlassOverlay
              intensity="strong"
              rounded="2xl"
              className="p-6"
            >
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="min-w-0">
                  {title && (
                    <h3 className="text-h2 text-text-primary">{title}</h3>
                  )}
                  {description && (
                    <p className="text-body text-text-secondary mt-1">
                      {description}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="-mt-1 -mr-1 w-9 h-9 rounded-full flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-bg-hover transition-colors"
                  aria-label="Fechar"
                >
                  <X size={18} aria-hidden />
                </button>
              </div>
              {children && (
                <div className="text-body text-text-primary">{children}</div>
              )}
              {footer && (
                <div className="mt-6 flex flex-wrap gap-2 justify-end">
                  {footer}
                </div>
              )}
            </GlassOverlay>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
