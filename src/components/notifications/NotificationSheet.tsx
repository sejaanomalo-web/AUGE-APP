"use client";

import * as React from "react";
import { createPortal } from "react-dom";
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
  // SSR-safe portal mount target.
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

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

  if (!mounted) return null;

  // Portal to document.body so the sheet escapes any transformed ancestor
  // (the AppHeader uses transform: translateZ(0) on its glass layer, which
  // would otherwise contain `position: fixed` children to the header's box).
  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          {/* Heavy backdrop blur over the rest of the screen - sells the
           * iOS sheet-over-blur look the user asked for. */}
          <motion.div
            key="notif-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            onClick={onClose}
            aria-hidden
            className="fixed inset-0 z-[80] bg-black/55 backdrop-blur-xl"
            style={{
              WebkitBackdropFilter: "blur(24px) saturate(160%)",
              backdropFilter: "blur(24px) saturate(160%)",
            }}
          />

          <motion.div
            key="notif-sheet"
            role="dialog"
            aria-modal
            aria-label="Notificações"
            initial={{ opacity: 0, y: "100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "100%" }}
            transition={{
              type: "spring",
              damping: 32,
              stiffness: 320,
              mass: 0.9,
            }}
            className="fixed inset-0 z-[81] bg-bg-base flex flex-col"
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
        </>
      )}
    </AnimatePresence>,
    document.body,
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
  // True while the user is actively dragging horizontally - used to swallow
  // the tap that would otherwise fire on pointer-up.
  const draggedRef = React.useRef(false);

  function handleDragEnd(
    _: PointerEvent | MouseEvent | TouchEvent,
    info: { offset: { x: number } },
  ) {
    if (info.offset.x < -SWIPE_THRESHOLD) {
      // Crossing the threshold removes the row from the parent's list;
      // AnimatePresence's exit prop below handles the slide-out.
      onDelete();
    }
    // Brief delay so the click event that follows pointer-up is ignored.
    window.setTimeout(() => {
      draggedRef.current = false;
    }, 50);
  }

  function handleTrashClick(e: React.MouseEvent) {
    e.stopPropagation();
    onDelete();
  }

  function handleTap() {
    if (draggedRef.current) return;
    onTap();
  }

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{
        // Slide all the way off-screen to the right + collapse the slot.
        // Same animation whether the user swiped or tapped the trash icon.
        x: "120%",
        opacity: 0,
        height: 0,
        marginTop: 0,
        marginBottom: 0,
        paddingTop: 0,
        paddingBottom: 0,
        transition: { duration: 0.32, ease: [0.32, 0.72, 0, 1] },
      }}
      transition={{ duration: 0.22, ease: "easeOut" }}
    >
      {/* One single card surface — no underlay. The card itself follows
       * the finger during a horizontal drag (dragSnapToOrigin springs it
       * back if the user doesn't cross the threshold). The trash icon
       * lives in the top-right corner of the card content. */}
      <motion.div
        drag="x"
        dragConstraints={{ left: -MAX_SWIPE, right: 0 }}
        dragElastic={0.12}
        dragMomentum={false}
        dragSnapToOrigin
        onDragStart={() => {
          draggedRef.current = true;
        }}
        onDragEnd={handleDragEnd}
        style={{ touchAction: "pan-y" }}
        className={cn(
          "relative rounded-xl border bg-bg-surface border-border-subtle pulse-line overflow-hidden",
          !notif.read && "bg-accent/[0.04]",
        )}
      >
        {/* Trash — anchored to the top-right corner of the card.
         * z-10 keeps it above the tap surface so clicks land here when
         * they overlap. stopPropagation prevents the parent tap. */}
        <button
          type="button"
          onClick={handleTrashClick}
          aria-label="Excluir notificação"
          className="absolute top-2 right-2 z-10 w-8 h-8 rounded-full flex items-center justify-center text-text-muted hover:text-error hover:bg-error/10 transition-colors"
        >
          <Trash2 size={14} aria-hidden />
        </button>

        {/* Tap surface — opens the notification. pr-10 reserves the
         * top-right corner for the trash button so copy never collides
         * with it on long titles. */}
        <button
          type="button"
          onClick={handleTap}
          className="w-full text-left grid grid-cols-[40px_minmax(0,1fr)] items-start gap-3 p-4 pr-10 hover:bg-bg-elevated/40 transition-colors"
        >
          <span
            className={cn(
              "mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-full border shrink-0",
              notificationTone(notif.type),
            )}
          >
            <Bell size={16} aria-hidden />
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              {!notif.read && (
                <span className="h-2 w-2 rounded-full bg-accent shrink-0" />
              )}
              <div className="font-semibold text-body text-text-primary truncate">
                {notif.title}
              </div>
            </div>
            <div className="text-body text-text-secondary mt-1 line-clamp-2">
              {notif.body}
            </div>
            <div className="text-caption text-text-muted mt-1.5">
              {formatDistanceToNow(new Date(notif.createdAt), {
                addSuffix: true,
                locale: ptBR,
              })}
            </div>
          </div>
        </button>
      </motion.div>
    </motion.li>
  );
}
