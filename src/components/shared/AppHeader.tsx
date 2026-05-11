"use client";

import * as React from "react";
import Link from "next/link";
import { LogOut, User as UserIcon, ChevronDown } from "lucide-react";
import { Logo } from "./Logo";
import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/lib/utils";

export function AppHeader({
  user,
  rightSlot,
  mobileLeftSlot,
  perfilHref,
  className,
}: {
  user: { name: string; email: string; avatar: string };
  rightSlot?: React.ReactNode;
  mobileLeftSlot?: React.ReactNode;
  perfilHref: string;
  className?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  return (
    <header
      className={cn(
        "sticky top-0 z-20 flex items-center justify-between gap-3 h-14 lg:h-16 px-4 lg:px-8 bg-bg-base/95 backdrop-blur border-b border-border-subtle",
        className,
      )}
    >
      <div className="flex items-center gap-2 lg:hidden">
        {mobileLeftSlot}
        <Link href="/">
          <Logo size="sm" />
        </Link>
      </div>

      <div className="hidden lg:flex items-center gap-2 flex-1">
        {rightSlot && <div className="ml-auto">{rightSlot}</div>}
      </div>

      <div className="flex items-center gap-2 lg:ml-2" ref={ref}>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2 rounded-pill pl-1 pr-2 py-1 hover:bg-bg-elevated transition-colors"
          aria-haspopup="menu"
          aria-expanded={open}
        >
          <Avatar src={user.avatar} name={user.name} size={32} />
          <span className="hidden sm:inline text-body font-semibold text-text-primary max-w-[140px] truncate">
            {user.name.split(" ")[0]}
          </span>
          <ChevronDown
            size={16}
            className="text-text-secondary"
            aria-hidden
          />
        </button>

        {open && (
          <div
            role="menu"
            className="absolute right-4 top-[calc(100%+4px)] w-56 bg-bg-card rounded-md shadow-lg p-2 animate-fade-in"
          >
            <div className="px-3 py-2 mb-1">
              <p className="text-body font-semibold text-text-primary truncate">
                {user.name}
              </p>
              <p className="text-caption text-text-muted truncate">
                {user.email}
              </p>
            </div>
            <Link
              href={perfilHref}
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-3 py-2 rounded-md text-body text-text-primary hover:bg-bg-hover"
            >
              <UserIcon size={16} aria-hidden /> Perfil
            </Link>
            <Link
              href="/"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-3 py-2 rounded-md text-body text-error hover:bg-error/10"
            >
              <LogOut size={16} aria-hidden /> Sair
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
