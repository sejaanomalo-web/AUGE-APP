"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { IconButton } from "./IconButton";

export interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

/**
 * Headless dialog primitive used across the app.
 *
 * - Portaled to <body> so it escapes any transformed ancestor (the
 *   floating CTA wrapper on /treino/[id] would otherwise clip it).
 * - framer-motion AnimatePresence drives a fade-in backdrop + scale-up
 *   panel and reverses on close, so opening/closing feels smooth instead
 *   of snapping.
 * - Escape key closes, body scroll locked while open.
 */
export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  className,
}: DialogProps) {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    const prev = document.body.style.overflow;
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onOpenChange]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <div
          role="dialog"
          aria-modal
          className="fixed inset-0 z-[90] flex items-center justify-center p-4"
        >
          <motion.button
            type="button"
            aria-label="Fechar"
            onClick={() => onOpenChange(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute inset-0 bg-black/72 backdrop-blur-md"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{
              type: "spring",
              damping: 28,
              stiffness: 320,
              mass: 0.85,
            }}
            className={cn(
              // Single scroll container: title + body + footer all live
              // inside the same overflow-y-auto so the action buttons
              // scroll naturally to the bottom of the content instead
              // of sitting on a sticky bar - the user prefers them as
              // the end of the form. max-h capped at 85dvh leaves
              // breathing room above and below on mobile so the modal
              // reads as a centred card, not a near-fullscreen sheet.
              // overscroll-contain stops iOS bounce from leaking out
              // to the (already-locked) body.
              "relative w-full max-w-[480px] max-h-[85dvh] overflow-y-auto overscroll-contain bg-bg-elevated border border-border-subtle rounded-2xl shadow-xl pulse-line",
              className,
            )}
          >
            <div className="p-6">
              {title && (
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h2 className="text-h2 text-text-primary">{title}</h2>
                  <IconButton
                    aria-label="Fechar"
                    onClick={() => onOpenChange(false)}
                    className="-mr-2 -mt-2"
                  >
                    <X size={20} />
                  </IconButton>
                </div>
              )}
              {description && (
                <p className="text-body text-text-secondary mb-4">
                  {description}
                </p>
              )}
              <div className="text-body text-text-primary">{children}</div>
              {footer && (
                <div className="mt-6 flex items-center justify-end gap-3 flex-wrap">
                  {footer}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
