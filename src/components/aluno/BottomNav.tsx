"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Dumbbell, History, Activity, User } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/hoje", label: "Hoje", icon: Dumbbell },
  { href: "/historico", label: "Histórico", icon: History },
  { href: "/medidas", label: "Medidas", icon: Activity },
  { href: "/perfil", label: "Perfil", icon: User },
];

export function BottomNav({ className }: { className?: string }) {
  const pathname = usePathname();
  return (
    <nav
      className={cn(
        "fixed bottom-0 inset-x-0 z-30 bg-bg-surface border-t border-border-subtle px-4 lg:hidden",
        "pb-[env(safe-area-inset-bottom)]",
        className,
      )}
      aria-label="Navegação principal"
    >
      <ul className="flex items-stretch justify-around h-16">
        {items.map((item) => {
          const Icon = item.icon;
          const active =
            pathname === item.href || pathname?.startsWith(`${item.href}/`);
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "h-full flex flex-col items-center justify-center gap-1 relative transition-colors",
                  active
                    ? "text-accent"
                    : "text-text-muted hover:text-text-primary",
                )}
              >
                <Icon size={24} aria-hidden />
                <span className="text-[10px] font-medium leading-none">
                  {item.label}
                </span>
                {active && (
                  <span
                    aria-hidden
                    className="absolute -bottom-0 w-1 h-1 rounded-full bg-accent"
                  />
                )}
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
