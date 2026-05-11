"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "./Logo";
import { IconButton } from "@/components/ui/IconButton";
import type { SidebarItem } from "./Sidebar";

export function MobileDrawer({
  items,
  homeHref = "/",
}: {
  items: SidebarItem[];
  homeHref?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const pathname = usePathname();

  React.useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <>
      <IconButton
        aria-label="Abrir menu"
        onClick={() => setOpen(true)}
        className="lg:hidden"
      >
        <Menu size={20} />
      </IconButton>

      {open && (
        <div className="fixed inset-0 z-40 lg:hidden animate-fade-in">
          <button
            type="button"
            aria-label="Fechar menu"
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div className="absolute left-0 top-0 h-full w-72 bg-bg-base border-r border-border-subtle py-6 px-3 animate-slide-up flex flex-col gap-1">
            <div className="flex items-center justify-between px-3 mb-6">
              <Logo size="md" />
              <IconButton
                aria-label="Fechar menu"
                onClick={() => setOpen(false)}
              >
                <X size={20} />
              </IconButton>
            </div>
            <nav className="flex flex-col gap-1">
              {items.map((item) => {
                const Icon = item.icon;
                const active =
                  pathname === item.href ||
                  pathname?.startsWith(`${item.href}/`);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-md text-body font-medium transition-colors duration-200",
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
          </div>
        </div>
      )}
    </>
  );
}
