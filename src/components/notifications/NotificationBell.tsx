"use client";

import * as React from "react";
import { Bell } from "lucide-react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabaseClient } from "@/lib/supabase/client";
import {
  getMyNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
} from "@/lib/actions/notifications";
import { cn } from "@/lib/utils";

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body: string;
  data: Record<string, unknown> | null;
  read: boolean;
  createdAt: string | Date;
}

export function NotificationBell() {
  const { userId, isSignedIn } = useAuth();
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [notifications, setNotifications] = React.useState<
    NotificationItem[]
  >([]);
  const [unreadCount, setUnreadCount] = React.useState(0);
  const ref = React.useRef<HTMLDivElement>(null);

  const refresh = React.useCallback(async () => {
    const [items, count] = await Promise.all([
      getMyNotifications(),
      getUnreadCount(),
    ]);
    setNotifications(items as NotificationItem[]);
    setUnreadCount(count);
  }, []);

  // Initial load + Realtime
  React.useEffect(() => {
    if (!isSignedIn || !userId) return;
    refresh();

    const channel = supabaseClient
      .channel(`notif-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "Notification",
          filter: `userId=eq.${userId}`,
        },
        (payload) => {
          const newNotif = payload.new as NotificationItem;
          setNotifications((prev) => [newNotif, ...prev]);
          setUnreadCount((c) => c + 1);
        },
      )
      .subscribe();

    return () => {
      supabaseClient.removeChannel(channel);
    };
  }, [userId, isSignedIn, refresh]);

  // Click outside to close
  React.useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  async function handleClick(notif: NotificationItem) {
    if (!notif.read) {
      await markAsRead(notif.id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n)),
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    }
    setOpen(false);
    const url = (notif.data as { url?: string } | null)?.url;
    if (url && typeof url === "string") router.push(url);
  }

  async function handleMarkAll() {
    await markAllAsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  }

  if (!isSignedIn) return null;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="relative w-10 h-10 rounded-full flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-bg-hover transition-colors"
        aria-label="Notificações"
        aria-expanded={open}
      >
        <Bell size={20} strokeWidth={1.75} aria-hidden />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 bg-accent text-text-on-accent text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 leading-none">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className={[
            // Mobile: full-width drawer pinned below the header with margins;
            // legible solid background, never transparent.
            "fixed left-3 right-3 top-[calc(56px+env(safe-area-inset-top)+6px)] z-50",
            // Desktop: anchored to the bell button at top-right.
            "sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-2 sm:w-[380px]",
            "bg-bg-elevated border border-border-subtle rounded-lg shadow-xl overflow-hidden animate-fade-in",
          ].join(" ")}
        >
          <div className="flex items-center justify-between p-4 border-b border-border-subtle">
            <h3 className="text-body-lg font-bold text-text-primary">
              Notificações
            </h3>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAll}
                className="text-caption text-accent hover:text-accent-hover"
              >
                Marcar todas
              </button>
            )}
          </div>

          <div className="max-h-[420px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-text-muted text-body">
                Nenhuma notificação ainda
              </div>
            ) : (
              notifications.map((notif) => (
                <button
                  key={notif.id}
                  type="button"
                  onClick={() => handleClick(notif)}
                  className={cn(
                    "w-full text-left p-4 border-b border-border-subtle hover:bg-bg-hover transition-colors",
                    !notif.read && "bg-accent-glow/40",
                  )}
                >
                  <div className="flex items-start gap-2">
                    {!notif.read && (
                      <div className="w-2 h-2 rounded-full bg-accent mt-2 shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-body text-text-primary">
                        {notif.title}
                      </div>
                      <div className="text-body text-text-secondary mt-0.5">
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
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
