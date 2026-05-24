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

  // Clicking anywhere outside the panel closes the dialog. Bound on the
  // outer wrappers (not the panel) and gated by target === currentTarget
  // so clicks on the panel itself don't bubble back up and close it.
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onOpenChange(false);
  };

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop sits in its own fixed layer so it always covers
           * the viewport even while the user scrolls the dialog content
           * below. Separate from the scroll wrapper so the wrapper can
           * be a plain (non-transformed) element - putting overflow-y
           * on a framer-motion transformed node breaks touch scrolling
           * on iOS Safari, which was the bug on the long evaluation
           * form. */}
          <motion.div
            key="dialog-backdrop"
            aria-hidden
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed inset-0 z-[90] bg-black/72 backdrop-blur-md"
          />
          <div
            role="dialog"
            aria-modal
            onClick={handleBackdropClick}
            className="fixed inset-0 z-[91] overflow-y-auto overscroll-contain"
          >
            {/* Grid place-items-center centres a short dialog and, when
             * the panel is taller than the viewport (e.g. the nova
             * avaliação form on phones), lets the panel push the grid
             * container's height instead of overflowing both edges
             * symmetrically the way flex items-center does. The outer
             * wrapper then scrolls cleanly from the panel's top edge
             * to its bottom. */}
            <div
              onClick={handleBackdropClick}
              className="min-h-full grid place-items-center p-4"
            >
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
                  "relative w-full max-w-[480px] bg-bg-elevated border border-border-subtle rounded-2xl shadow-xl pulse-line my-4",
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
          </div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  );
}
