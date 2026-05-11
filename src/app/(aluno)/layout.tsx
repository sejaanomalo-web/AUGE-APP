"use client";

import { Sidebar } from "@/components/shared/Sidebar";
import { AppHeader } from "@/components/shared/AppHeader";
import { BottomNav, alunoSidebarItems } from "@/components/aluno/BottomNav";
import { InstallPWAPrompt } from "@/components/notifications/InstallPWAPrompt";

export default function AlunoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-bg-base">
      <Sidebar items={alunoSidebarItems} homeHref="/hoje" />
      <div className="lg:pl-60 flex flex-col min-h-screen">
        <AppHeader perfilHref="/perfil" homeHref="/hoje" />
        <main className="flex-1 pb-20 lg:pb-12 px-4 lg:px-8 py-6 lg:py-8">
          {children}
        </main>
        <BottomNav />
        <InstallPWAPrompt />
      </div>
    </div>
  );
}
