"use client";

import {
  LayoutDashboard,
  Users,
  Dumbbell,
  Library,
  User,
} from "lucide-react";
import { Sidebar } from "@/components/shared/Sidebar";
import { MobileDrawer } from "@/components/shared/MobileDrawer";
import { AppHeader } from "@/components/shared/AppHeader";

const items = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/alunos", label: "Alunos", icon: Users },
  { href: "/treinos", label: "Treinos", icon: Dumbbell },
  { href: "/exercicios", label: "Exercícios", icon: Library },
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
        <AppHeader
          perfilHref="/conta"
          homeHref="/dashboard"
          mobileLeftSlot={<MobileDrawer items={items} homeHref="/dashboard" />}
        />
        <main className="flex-1 px-4 lg:px-8 py-6 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
