"use client";

import * as React from "react";
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

export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  className,
}: DialogProps) {
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
    >
      <button
        type="button"
        aria-label="Fechar"
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />
      <div
        className={cn(
          "relative w-full max-w-[480px] max-h-[calc(100vh-2rem)] overflow-y-auto bg-bg-surface rounded-xl shadow-lg animate-slide-up",
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
            <p className="text-body text-text-secondary mb-4">{description}</p>
          )}
          <div className="text-body text-text-primary">{children}</div>
          {footer && (
            <div className="mt-6 flex items-center justify-end gap-3">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
