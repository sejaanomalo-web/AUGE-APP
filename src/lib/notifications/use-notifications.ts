"use client";

import * as React from "react";
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
import type { NotificationItem } from "@/components/notifications/NotificationSheet";

/**
 * Estado + ações das notificações (inbox realtime). Extraído do antigo
 * NotificationBell para que o sino possa viver dentro do menu do AppHeader
 * (o sheet fica montado no header, fora do dropdown que desmonta no
 * clique-fora).
 */
export function useNotifications() {
  const { userId, isSignedIn } = useAuth();
  const supabase = useSupabaseClient();
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [notifications, setNotifications] = React.useState<NotificationItem[]>(
    [],
  );
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

  const openNotification = React.useCallback(
    async (notif: NotificationItem) => {
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
    },
    [router],
  );

  const remove = React.useCallback(
    async (id: string) => {
      const wasUnread = notifications.find((n) => n.id === id && !n.read);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      if (wasUnread) setUnreadCount((c) => Math.max(0, c - 1));
      try {
        await deleteNotification(id);
      } catch {
        refresh();
      }
    },
    [notifications, refresh],
  );

  const clearAll = React.useCallback(async () => {
    const snapshot = notifications;
    setNotifications([]);
    setUnreadCount(0);
    try {
      await deleteAllNotifications();
    } catch {
      setNotifications(snapshot);
      refresh();
    }
  }, [notifications, refresh]);

  return {
    isSignedIn,
    open,
    setOpen,
    notifications,
    unreadCount,
    openNotification,
    remove,
    clearAll,
  };
}
