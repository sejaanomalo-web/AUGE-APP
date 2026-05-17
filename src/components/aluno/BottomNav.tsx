"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClipboardList, MessageCircle, Target, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/hoje", label: "Hoje", icon: Target },
  { href: "/planos", label: "Treinos", icon: ClipboardList },
  { href: "/evolucao", label: "Evolução", icon: TrendingUp },
  { href: "/perfil", label: "Coach", icon: MessageCircle },
];

export function BottomNav({ className }: { className?: string }) {
  const pathname = usePathname();
  return (
    <nav
      className={cn(
        "fixed inset-x-0 bottom-0 z-30 px-3 pb-[calc(env(safe-area-inset-bottom)+10px)] lg:hidden",
        "[transform:translate3d(0,0,0)] [will-change:transform] [contain:layout_paint]",
        className,
      )}
      aria-label="Navegação principal"
    >
      <ul
        className={cn(
          "relative mx-auto max-w-md flex items-stretch justify-between gap-1",
          "rounded-full p-1.5 h-[64px]",
          "bg-bg-surface/92 supports-[backdrop-filter]:bg-bg-surface/80",
          "backdrop-blur-2xl backdrop-saturate-200",
          "border border-border-subtle",
          "shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05),0_18px_50px_-12px_rgba(0,0,0,0.75)]",
        )}
      >
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-8 top-0 h-px rounded-full bg-gradient-to-r from-transparent via-accent/60 to-transparent"
        />
        {items.map((item) => {
          const Icon = item.icon;
          const active =
            pathname === item.href || pathname?.startsWith(`${item.href}/`);
          return (
            <li key={item.href} className="relative flex-1 min-w-0">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative h-full flex flex-col items-center justify-center gap-0.5 rounded-full px-1 transition-colors duration-150",
                  active
                    ? "bg-accent text-text-on-accent shadow-accent"
                    : "text-text-secondary hover:text-text-primary",
                )}
              >
                <Icon
                  size={20}
                  strokeWidth={active ? 2.5 : 1.75}
                  aria-hidden
                />
                <span className="text-[10px] font-semibold leading-none truncate max-w-full">
                  {item.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export const alunoSidebarItems = items.map(({ href, label, icon }) => ({
  href,
  label,
  icon,
}));
