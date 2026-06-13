"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { m, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { SignOutButton, useUser } from "@clerk/nextjs";
import { Bell, LogOut, User as UserIcon, ChevronDown } from "lucide-react";
import { Logo } from "./Logo";
import { Avatar } from "@/components/ui/Avatar";
import { NotificationSheet } from "@/components/notifications/NotificationSheet";
import { useNotifications } from "@/lib/notifications/use-notifications";
import { cn } from "@/lib/utils";

export function AppHeader({
  centerSlot,
  perfilHref,
  homeHref = "/",
  className,
}: {
  /** Rendered centered in the header (e.g. the vertical toggle). */
  centerSlot?: React.ReactNode;
  perfilHref: string;
  homeHref?: string;
  className?: string;
}) {
  const { user } = useUser();
  const notif = useNotifications();
  const [open, setOpen] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);
  // Anchor coords are computed from the trigger's bounding rect at open
  // time. Beats CSS env() calcs which can mis-render inside iOS PWAs.
  const [anchor, setAnchor] = React.useState<{
    top: number;
    right: number;
  } | null>(null);
  const triggerRef = React.useRef<HTMLButtonElement | null>(null);
  const menuRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => setMounted(true), []);

  function openMenu() {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (rect) {
      setAnchor({
        top: rect.bottom + 8,
        right: Math.max(12, window.innerWidth - rect.right),
      });
    }
    setOpen(true);
  }

  function toggle() {
    if (open) {
      setOpen(false);
      return;
    }
    openMenu();
  }

  // Re-anchor on resize so the menu doesn't drift if the user rotates
  // the device while it's open.
  React.useEffect(() => {
    if (!open) return;
    function onResize() {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (rect) {
        setAnchor({
          top: rect.bottom + 8,
          right: Math.max(12, window.innerWidth - rect.right),
        });
      }
    }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [open]);

  // Outside-click - both trigger and the (portaled) menu count as inside.
  // Attached on pointerdown so it beats the click on the same tap cycle
  // and we avoid an immediate self-close.
  React.useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      const t = e.target as Node | null;
      if (!t) return;
      if (triggerRef.current?.contains(t)) return;
      if (menuRef.current?.contains(t)) return;
      setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () =>
      document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  // Escape closes.
  React.useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const name =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
    user?.username ||
    user?.primaryEmailAddress?.emailAddress ||
    "Usuário";
  const email = user?.primaryEmailAddress?.emailAddress ?? "";
  const avatar = user?.imageUrl;
  const firstName = name.split(" ")[0];

  return (
    <header
      className={cn(
        "sticky top-0 z-20 flex items-center justify-between gap-3 h-14 lg:h-16 px-4 lg:px-8 glass-nav border-b border-border-subtle pt-[env(safe-area-inset-top)] box-content",
        className,
      )}
    >
      {/* LEFT: logo (mobile only — desktop logo lives in the sidebar) */}
      <div className="flex-1 flex items-center gap-2 min-w-0">
        <Link href={homeHref} className="lg:hidden">
          <Logo size="sm" />
        </Link>
      </div>

      {/* CENTER: vertical toggle, kept dead-centre by the equal flex-1 sides */}
      {centerSlot && (
        <div className="flex items-center justify-center shrink-0">
          {centerSlot}
        </div>
      )}

      {/* RIGHT: account menu (notifications now live inside it) */}
      <div className="flex-1 flex items-center justify-end gap-1">
        <button
          ref={triggerRef}
          type="button"
          onClick={toggle}
          data-tour="account-menu"
          className="relative flex items-center gap-2 rounded-pill pl-1 pr-2 py-1 border border-transparent hover:bg-bg-elevated hover:border-border-subtle transition-colors"
          aria-haspopup="menu"
          aria-expanded={open}
        >
          {notif.unreadCount > 0 && (
            <span
              aria-hidden
              className="absolute -top-0.5 left-5 bg-accent text-text-on-accent text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 leading-none shadow-accent"
            >
              {notif.unreadCount > 99 ? "99+" : notif.unreadCount}
            </span>
          )}
          <Avatar src={avatar} name={name} size={32} />
          <span className="hidden sm:inline text-body font-semibold text-text-primary max-w-[140px] truncate">
            {firstName}
          </span>
          <ChevronDown
            size={16}
            className="text-text-secondary"
            aria-hidden
          />
        </button>
      </div>

      {/* Dropdown portaled to <body> so the header's transformed glass
       * ancestor doesn't trap it. Anchored to the trigger's bounding rect
       * so it always lands directly below the avatar, on the right edge. */}
      {mounted &&
        createPortal(
          <AnimatePresence>
            {open && anchor && (
              <m.div
                ref={menuRef}
                role="menu"
                initial={{ opacity: 0, y: -6, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.97 }}
                transition={{ duration: 0.18, ease: [0.32, 0.72, 0, 1] }}
                style={{
                  position: "fixed",
                  top: `${anchor.top}px`,
                  right: `${anchor.right}px`,
                  zIndex: 90,
                }}
                className="w-[min(calc(100vw-24px),240px)] bg-bg-elevated border border-border-subtle rounded-xl shadow-xl p-2 pulse-line"
              >
                <div className="px-3 py-2 mb-1">
                  <p className="text-body font-semibold text-text-primary truncate">
                    {name}
                  </p>
                  <p className="text-caption text-text-muted truncate">
                    {email}
                  </p>
                </div>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setOpen(false);
                    notif.setOpen(true);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-body text-text-primary hover:bg-bg-hover"
                >
                  <Bell size={16} aria-hidden /> Notificações
                  {notif.unreadCount > 0 && (
                    <span className="ml-auto bg-accent text-text-on-accent text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 leading-none">
                      {notif.unreadCount > 99 ? "99+" : notif.unreadCount}
                    </span>
                  )}
                </button>
                <Link
                  href={perfilHref}
                  role="menuitem"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-body text-text-primary hover:bg-bg-hover"
                >
                  <UserIcon size={16} aria-hidden /> Perfil
                </Link>
                <SignOutButton redirectUrl="/">
                  <button
                    type="button"
                    role="menuitem"
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-body text-error hover:bg-error/10"
                  >
                    <LogOut size={16} aria-hidden /> Sair
                  </button>
                </SignOutButton>
              </m.div>
            )}
          </AnimatePresence>,
          document.body,
        )}

      {/* Notification inbox — mounted at header level (not inside the dropdown,
       * which unmounts on outside-click) so opening it from the menu works. */}
      <NotificationSheet
        open={notif.open}
        notifications={notif.notifications}
        onClose={() => notif.setOpen(false)}
        onOpenNotification={notif.openNotification}
        onDelete={notif.remove}
        onClearAll={notif.clearAll}
      />
    </header>
  );
}
