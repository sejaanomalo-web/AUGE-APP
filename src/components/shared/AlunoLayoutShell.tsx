"use client";

import { Sidebar } from "@/components/shared/Sidebar";
import { AppHeader } from "@/components/shared/AppHeader";
import { PageTransition } from "@/components/shared/PageTransition";
import { BottomNav, alunoSidebarItems } from "@/components/aluno/BottomNav";
import { InstallPWAPrompt } from "@/components/notifications/InstallPWAPrompt";

// Same rationale as PersonalLayoutShell: keep alunoSidebarItems (which
// carries lucide icon components) inside the client boundary so the
// async layout.tsx can stay a server component without tripping RSC's
// "Functions cannot be passed directly to Client Components" guard.
export function AlunoLayoutShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-bg-base">
      <Sidebar items={alunoSidebarItems} homeHref="/hoje" />
      <div className="lg:pl-60 flex flex-col min-h-screen">
        <AppHeader perfilHref="/perfil" homeHref="/hoje" />
        <main className="flex-1 pb-[calc(env(safe-area-inset-bottom)+96px)] lg:pb-12 px-4 lg:px-8 py-6 lg:py-8">
          <PageTransition>{children}</PageTransition>
        </main>
        <BottomNav />
        <InstallPWAPrompt />
      </div>
    </div>
  );
}
