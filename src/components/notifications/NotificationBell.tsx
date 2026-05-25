"use client";

import * as React from "react";
import { Bell } from "lucide-react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useSupabaseClient } from "@/lib/supabase/client";
import {
  deleteAllNotifications,
  deleteNotification,
  getMyNotifications,
  getUnreadCount,
  markAsRead,
} from "@/lib/actions/notifications";
import {
  NotificationSheet,
  type NotificationItem,
} from "./NotificationSheet";

export function NotificationBell() {
  const { userId, isSignedIn } = useAuth();
  const supabase = useSupabaseClient();
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [notifications, setNotifications] = React.useState<
    NotificationItem[]
  >([]);
  const [unreadCount, setUnreadCount] = React.useState(0);

  const refresh = React.useCallback(async () => {
    const [items, count] = await Promise.all([
      getMyNotifications(),
      getUnreadCount(),
    ]);
    setNotifications(items as NotificationItem[]);
    setUnreadCount(count);
  }, []);

  React.useEffect(() => {
    if (!isSignedIn || !userId) return;
    refresh();

    const channel = supabase
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
      supabase.removeChannel(channel);
    };
  }, [userId, isSignedIn, refresh, supabase]);

  async function handleOpenNotification(notif: NotificationItem) {
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

  async function handleDelete(id: string) {
    const wasUnread = notifications.find((n) => n.id === id && !n.read);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    if (wasUnread) setUnreadCount((c) => Math.max(0, c - 1));
    try {
      await deleteNotification(id);
    } catch {
      // Rollback on failure
      refresh();
    }
  }

  async function handleClearAll() {
    const snapshot = notifications;
    setNotifications([]);
    setUnreadCount(0);
    try {
      await deleteAllNotifications();
    } catch {
      setNotifications(snapshot);
      refresh();
    }
  }

  if (!isSignedIn) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="relative w-10 h-10 rounded-full flex items-center justify-center text-text-secondary border border-transparent hover:text-text-primary hover:bg-bg-hover hover:border-border-subtle transition-colors"
        aria-label="Notificações"
      >
        <Bell size={20} strokeWidth={1.75} aria-hidden />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 bg-accent text-text-on-accent text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 leading-none shadow-accent">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      <NotificationSheet
        open={open}
        notifications={notifications}
        onClose={() => setOpen(false)}
        onOpenNotification={handleOpenNotification}
        onDelete={handleDelete}
        onClearAll={handleClearAll}
      />
    </>
  );
}
