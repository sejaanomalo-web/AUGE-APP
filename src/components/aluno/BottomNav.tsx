"use client";

import {
  ClipboardList,
  Crosshair,
  Target,
  TrendingUp,
  User,
} from "lucide-react";
import { BottomNav as SharedBottomNav } from "@/components/shared/BottomNav";

// Ordered intentionally so "Hoje" sits dead center (position 3 of 5).
const items = [
  { href: "/planos", label: "Treinos", icon: ClipboardList },
  { href: "/objetivos", label: "Objetivos", icon: Crosshair },
  { href: "/hoje", label: "Hoje", icon: Target },
  { href: "/evolucao", label: "Evolução", icon: TrendingUp },
  { href: "/perfil", label: "Perfil", icon: User },
];

export function BottomNav({ className }: { className?: string }) {
  return <SharedBottomNav items={items} className={className} />;
}

export const alunoSidebarItems = items.map(({ href, label, icon }) => ({
  href,
  label,
  icon,
}));
