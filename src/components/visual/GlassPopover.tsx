"use client";

import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { GlassOverlay } from "./GlassOverlay";

export interface GlassPopoverProps {
  open: boolean;
  children: React.ReactNode;
  align?: "left" | "right" | "center";
  className?: string;
}

export function GlassPopover({
  open,
  children,
  align = "right",
  className,
}: GlassPopoverProps) {
  const alignClass = {
    left: "left-0",
    right: "right-0",
    center: "left-1/2 -translate-x-1/2",
  }[align];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: -8, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.96 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          className={cn("absolute top-12 z-50", alignClass, className)}
        >
          <GlassOverlay
            intensity="medium"
            rounded="xl"
            className="p-2 min-w-[200px]"
          >
            {children}
          </GlassOverlay>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
