"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GlassOverlay } from "./GlassOverlay";

export interface GlassBottomSheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export function GlassBottomSheet({
  open,
  onClose,
  title,
  children,
}: GlassBottomSheetProps) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[60] bg-black/40"
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.2}
            onDragEnd={(_, info) => {
              if (info.offset.y > 100) onClose();
            }}
            className="fixed bottom-0 left-0 right-0 z-[60]"
          >
            <GlassOverlay
              intensity="strong"
              rounded="3xl"
              className="p-6 pb-[calc(env(safe-area-inset-bottom)+24px)] max-h-[85vh] overflow-y-auto"
            >
              <div
                className="w-12 h-1.5 rounded-full bg-border-strong mx-auto mb-4"
                aria-hidden
              />
              {title && (
                <h3 className="text-h2 text-text-primary mb-4">{title}</h3>
              )}
              <div>{children}</div>
            </GlassOverlay>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
