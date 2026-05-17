"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Trash2, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body: string;
  data: Record<string, unknown> | null;
  read: boolean;
  createdAt: string | Date;
}

const SWIPE_THRESHOLD = 80; // px the user must drag to commit the delete
const MAX_SWIPE = 100; // px hard cap on the reveal area

function notificationTone(type: string) {
  const normalized = type.toUpperCase();
  if (normalized.includes("WORKOUT") || normalized.includes("PLAN")) {
    return "text-accent bg-accent/10 border-accent/25";
  }
  if (normalized.includes("STREAK") || normalized.includes("MISSED")) {
    return "text-intensity bg-intensity/10 border-intensity/25";
  }
  if (normalized.includes("TRAINER") || normalized.includes("COACH")) {
    return "text-coach bg-coach/15 border-coach/30";
  }
  return "text-info bg-info/10 border-info/25";
}

export function NotificationSheet({
  open,
  notifications,
  onClose,
  onOpenNotification,
  onDelete,
  onClearAll,
}: {
  open: boolean;
  notifications: NotificationItem[];
  onClose: () => void;
  onOpenNotification: (notif: NotificationItem) => void;
  onDelete: (id: string) => void;
  onClearAll: () => void;
}) {
  // Lock body scroll while open
  React.useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Escape to close
  React.useEffect(() => {
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
        <motion.div
          key="notif-sheet"
          role="dialog"
          aria-modal
          aria-label="Notificações"
          initial={{ opacity: 0, y: "100%" }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: "100%" }}
          transition={{
            // iOS-style spring slide-up
            type: "spring",
            damping: 32,
            stiffness: 320,
            mass: 0.9,
          }}
          className="fixed inset-0 z-[60] bg-bg-base flex flex-col"
        >
          <header className="flex items-center justify-between gap-3 px-4 lg:px-6 h-16 lg:h-18 border-b border-border-subtle pt-[env(safe-area-inset-top)] box-content glass-nav">
            <button
              type="button"
              onClick={onClose}
              aria-label="Fechar"
              className="w-10 h-10 -ml-2 rounded-full flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-bg-elevated transition-colors"
            >
              <X size={22} strokeWidth={2} aria-hidden />
            </button>
            <h2 className="flex-1 text-h3 font-bold text-text-primary text-center">
              Notificações
            </h2>
            {notifications.length > 0 ? (
              <button
                type="button"
                onClick={onClearAll}
                className="text-caption text-accent font-semibold hover:text-accent-hover px-2"
              >
                Limpar todas
              </button>
            ) : (
              <span className="w-10" aria-hidden />
            )}
          </header>

          <div className="flex-1 overflow-y-auto pb-[env(safe-area-inset-bottom)]">
            {notifications.length === 0 ? (
              <div className="h-full min-h-[60vh] flex items-center justify-center px-6">
                <div className="text-center">
                  <div className="mx-auto mb-4 w-14 h-14 rounded-full bg-bg-elevated flex items-center justify-center">
                    <Bell
                      size={24}
                      className="text-text-muted"
                      aria-hidden
                    />
                  </div>
                  <p className="text-body-lg text-text-primary font-semibold">
                    Nenhuma notificação
                  </p>
                  <p className="mt-1 text-body text-text-secondary">
                    Tudo limpo por aqui. Você verá novos alertas neste espaço.
                  </p>
                </div>
              </div>
            ) : (
              <ul className="flex flex-col gap-3 p-4">
                <AnimatePresence initial={false}>
                  {notifications.map((notif) => (
                    <SwipeRow
                      key={notif.id}
                      notif={notif}
                      onTap={() => onOpenNotification(notif)}
                      onDelete={() => onDelete(notif.id)}
                    />
                  ))}
                </AnimatePresence>
              </ul>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function SwipeRow({
  notif,
  onTap,
  onDelete,
}: {
  notif: NotificationItem;
  onTap: () => void;
  onDelete: () => void;
}) {
  const [offset, setOffset] = React.useState(0);
  const [removing, setRemoving] = React.useState(false);
  const startX = React.useRef<number | null>(null);
  const startY = React.useRef<number | null>(null);
  const dragging = React.useRef(false);
  const moved = React.useRef(false);

  function onPointerDown(e: React.PointerEvent) {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    startX.current = e.clientX;
    startY.current = e.clientY;
    dragging.current = true;
    moved.current = false;
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!dragging.current || startX.current === null || startY.current === null)
      return;
    const dx = e.clientX - startX.current;
    const dy = e.clientY - startY.current;
    // Only engage horizontal drag when the gesture is clearly horizontal —
    // otherwise the user is scrolling.
    if (!moved.current) {
      if (Math.abs(dy) > Math.abs(dx)) {
        dragging.current = false;
        return;
      }
      if (Math.abs(dx) > 6) {
        moved.current = true;
        (e.target as Element).setPointerCapture?.(e.pointerId);
      } else {
        return;
      }
    }
    // Left-swipe only. Clamp to [-MAX_SWIPE, 0].
    const next = Math.max(-MAX_SWIPE, Math.min(0, dx));
    setOffset(next);
  }

  function onPointerUp() {
    if (!dragging.current) return;
    dragging.current = false;
    if (offset <= -SWIPE_THRESHOLD) {
      // Pin the row to the fully-swiped position and trigger removal;
      // AnimatePresence on the parent <ul> animates the exit.
      setRemoving(true);
      setOffset(-MAX_SWIPE);
      onDelete();
    } else {
      setOffset(0);
    }
  }

  function handleClick() {
    // Avoid firing tap when the gesture was actually a swipe.
    if (moved.current) {
      moved.current = false;
      return;
    }
    onTap();
  }

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={cn(
        "relative bg-bg-surface border border-border-subtle rounded-xl overflow-hidden pulse-line",
        removing && "pointer-events-none",
      )}
    >
      {/* Underlay revealed by swipe — solid red with trash icon */}
      <div
        aria-hidden
        className="absolute inset-y-0 right-0 flex items-center justify-end bg-error pr-6"
        style={{ width: MAX_SWIPE }}
      >
        <Trash2 size={22} className="text-white" />
      </div>

      <button
        type="button"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onClick={handleClick}
        className={cn(
          "relative w-full text-left p-4 hover:bg-bg-elevated transition-colors",
          !notif.read && "bg-accent/5",
        )}
        style={{
          transform: `translateX(${offset}px)`,
          transition: dragging.current
            ? "none"
            : "transform 200ms cubic-bezier(0.4, 0, 0.2, 1)",
          touchAction: "pan-y",
        }}
      >
        <div className="flex items-start gap-3">
          <span
            className={cn(
              "mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-full border shrink-0",
              notificationTone(notif.type),
            )}
          >
            <Bell size={16} aria-hidden />
          </span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              {!notif.read && (
                <span className="h-2 w-2 rounded-full bg-accent shrink-0" />
              )}
              <div className="font-semibold text-body text-text-primary">
                {notif.title}
              </div>
            </div>
            <div className="text-body text-text-secondary mt-1">
              {notif.body}
            </div>
            <div className="text-caption text-text-muted mt-1.5">
              {formatDistanceToNow(new Date(notif.createdAt), {
                addSuffix: true,
                locale: ptBR,
              })}
            </div>
          </div>
        </div>
      </button>
    </motion.li>
  );
}
