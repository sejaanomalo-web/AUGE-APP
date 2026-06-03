"use client";

import {
  Apple,
  LayoutDashboard,
  User,
  Users,
  Utensils,
  Wheat,
} from "lucide-react";
import { Sidebar } from "@/components/shared/Sidebar";
import { BottomNav } from "@/components/shared/BottomNav";
import { AppHeader } from "@/components/shared/AppHeader";
import { PageTransition } from "@/components/shared/PageTransition";

const items = [
  { href: "/nutri/dashboard", label: "Painel", icon: LayoutDashboard },
  { href: "/nutri/alunos", label: "Alunos", icon: Users },
  { href: "/nutri/cardapios", label: "Cardápios", icon: Utensils },
  { href: "/nutri/alimentos", label: "Alimentos", icon: Wheat },
  { href: "/nutri/conta", label: "Perfil", icon: User },
];

export function NutricionistaShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Sidebar items={items} homeHref="/nutri/dashboard" />
      <div className="lg:pl-60 flex flex-col min-h-screen">
        <AppHeader perfilHref="/nutri/conta" homeHref="/nutri/dashboard" />
        <main className="flex-1 pb-[calc(env(safe-area-inset-bottom)+96px)] lg:pb-12 px-4 lg:px-8 py-6 lg:py-8">
          <PageTransition>{children}</PageTransition>
        </main>
        <BottomNav items={items} />
      </div>
    </>
  );
}

NutricionistaShell.displayName = "NutricionistaShell";
// Re-export the brand icon used in onboarding so future imports stay local.
export { Apple as NutriIcon };
