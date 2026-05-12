"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, Dumbbell, History, ListChecks, User } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/hoje", label: "Hoje", icon: Dumbbell },
  { href: "/planos", label: "Planos", icon: ListChecks },
  { href: "/historico", label: "Histórico", icon: History },
  { href: "/medidas", label: "Medidas", icon: Activity },
  { href: "/perfil", label: "Perfil", icon: User },
];

export function BottomNav({ className }: { className?: string }) {
  const pathname = usePathname();
  return (
    <nav
      className={cn(
        // Anchor at bottom: 0 and absorb safe-area + visual offset via padding.
        // Why: on iOS Safari, env(safe-area-inset-bottom) changes dynamically
        // as the toolbar shows/hides during scroll — placing it in `bottom`
        // makes the nav "jump". Padding doesn't trigger re-layout of the
        // fixed anchor, so the nav stays locked in place.
        "fixed inset-x-0 bottom-0 z-30 px-3 pb-[calc(env(safe-area-inset-bottom)+10px)] lg:hidden",
        // Force a separate compositing layer so scroll never repaints the nav.
        "[transform:translate3d(0,0,0)] [will-change:transform] [contain:layout_paint]",
        className,
      )}
      aria-label="Navegação principal"
    >
      {/* Liquid Glass capsule — heavier blur + saturate gives the iOS feel,
       * darker fill ensures icons/labels stay legible over any background,
       * inner specular highlight + accent ring add depth. */}
      <ul
        className={cn(
          "relative mx-auto max-w-md flex items-stretch justify-between gap-1",
          "rounded-full p-1.5 h-[64px]",
          "bg-black/65 supports-[backdrop-filter]:bg-black/55",
          "backdrop-blur-2xl backdrop-saturate-200",
          "border border-white/[0.08]",
          "shadow-[inset_0_1px_0_0_rgba(255,255,255,0.18),inset_0_-1px_0_0_rgba(0,0,0,0.45),0_18px_50px_-12px_rgba(0,0,0,0.75)]",
        )}
      >
        {/* Soft top sheen — sells the glass effect */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-6 top-0 h-px rounded-full bg-gradient-to-r from-transparent via-white/30 to-transparent"
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
