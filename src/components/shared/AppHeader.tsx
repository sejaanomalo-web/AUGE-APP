"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { SignOutButton, useUser } from "@clerk/nextjs";
import { LogOut, User as UserIcon, ChevronDown } from "lucide-react";
import { Logo } from "./Logo";
import { Avatar } from "@/components/ui/Avatar";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { cn } from "@/lib/utils";

export function AppHeader({
  rightSlot,
  mobileLeftSlot,
  perfilHref,
  homeHref = "/",
  className,
}: {
  rightSlot?: React.ReactNode;
  mobileLeftSlot?: React.ReactNode;
  perfilHref: string;
  homeHref?: string;
  className?: string;
}) {
  const { user } = useUser();
  const [open, setOpen] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);
  const triggerRef = React.useRef<HTMLButtonElement | null>(null);
  const menuRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => setMounted(true), []);

  // Outside click handler — both trigger and (portaled) menu count as "inside".
  React.useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      const t = e.target as Node;
      if (triggerRef.current?.contains(t)) return;
      if (menuRef.current?.contains(t)) return;
      setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

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
      <div className="flex items-center gap-2 lg:hidden">
        {mobileLeftSlot}
        <Link href={homeHref}>
          <Logo size="sm" />
        </Link>
      </div>

      <div className="hidden lg:flex items-center gap-2 flex-1">
        {rightSlot && <div className="ml-auto">{rightSlot}</div>}
      </div>

      <div className="flex items-center gap-1">
        <NotificationBell />
        <button
          ref={triggerRef}
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2 rounded-pill pl-1 pr-2 py-1 border border-transparent hover:bg-bg-elevated hover:border-border-subtle transition-colors"
          aria-haspopup="menu"
          aria-expanded={open}
        >
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
       * ancestor doesn't trap it as a containing block (which was clipping
       * it off-screen). Position uses fixed viewport coordinates so the
       * header itself never shifts when the menu opens. */}
      {mounted &&
        open &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            className={[
              "fixed z-[70]",
              // Mobile: under the header, 12px from each edge — always inside the screen.
              "left-3 right-3 top-[calc(env(safe-area-inset-top)+62px)]",
              // Desktop: anchored to the right gutter, fixed 240px width.
              "sm:left-auto sm:right-4 sm:top-[calc(env(safe-area-inset-top)+62px)] sm:w-60",
              "bg-bg-elevated border border-border-subtle rounded-xl shadow-xl p-2 animate-fade-in pulse-line",
            ].join(" ")}
          >
            <div className="px-3 py-2 mb-1">
              <p className="text-body font-semibold text-text-primary truncate">
                {name}
              </p>
              <p className="text-caption text-text-muted truncate">{email}</p>
            </div>
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
          </div>,
          document.body,
        )}
    </header>
  );
}
