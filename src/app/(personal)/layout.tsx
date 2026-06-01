"use client";

import {
  LayoutDashboard,
  Users,
  ClipboardList,
  Library,
  Calendar,
  User,
} from "lucide-react";
import { Sidebar } from "@/components/shared/Sidebar";
import { BottomNav } from "@/components/shared/BottomNav";
import { AppHeader } from "@/components/shared/AppHeader";
import { PageTransition } from "@/components/shared/PageTransition";

const items = [
  { href: "/dashboard", label: "Painel", icon: LayoutDashboard },
  { href: "/alunos", label: "Alunos", icon: Users },
  { href: "/treinos", label: "Treinos", icon: ClipboardList },
  { href: "/exercicios", label: "Exercícios", icon: Library },
  { href: "/eventos", label: "Eventos", icon: Calendar },
  { href: "/conta", label: "Perfil", icon: User },
];

export default function PersonalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-bg-base">
      <Sidebar items={items} homeHref="/dashboard" />
      <div className="lg:pl-60 flex flex-col min-h-screen">
        <AppHeader perfilHref="/conta" homeHref="/dashboard" />
        <main className="flex-1 pb-[calc(env(safe-area-inset-bottom)+96px)] lg:pb-12 px-4 lg:px-8 py-6 lg:py-8">
          <PageTransition>{children}</PageTransition>
        </main>
        <BottomNav items={items} />
      </div>
    </div>
  );
}
