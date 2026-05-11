"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "./Logo";

export interface SidebarItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export function Sidebar({
  items,
  homeHref = "/",
  footer,
  className,
}: {
  items: SidebarItem[];
  homeHref?: string;
  footer?: React.ReactNode;
  className?: string;
}) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-30 h-screen w-60 bg-bg-base border-r border-border-subtle py-6 px-3 flex-col gap-1 hidden lg:flex",
        className,
      )}
    >
      <Link href={homeHref} className="px-3 mb-6 inline-block">
        <Logo size="md" />
      </Link>
      <nav className="flex flex-col gap-1 flex-1">
        {items.map((item) => {
          const Icon = item.icon;
          const active =
            pathname === item.href || pathname?.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative flex items-center gap-3 px-4 py-3 rounded-md text-body font-medium transition-colors duration-200",
                active
                  ? "bg-bg-elevated text-accent pl-[13px] border-l-[3px] border-accent"
                  : "text-text-secondary hover:bg-bg-elevated hover:text-text-primary",
              )}
            >
              <Icon size={20} aria-hidden />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      {footer && <div className="px-3 mt-4">{footer}</div>}
    </aside>
  );
}
