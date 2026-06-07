"use client";

import { Sidebar } from "@/components/shared/Sidebar";
import { AppHeader } from "@/components/shared/AppHeader";
import { PageTransition } from "@/components/shared/PageTransition";
import { BottomNav } from "@/components/shared/BottomNav";
import { InstallPWAPrompt } from "@/components/notifications/InstallPWAPrompt";
import { VerticalToggle } from "@/components/shared/VerticalToggle";
import { VerticalBanner } from "@/components/aluno/VerticalBanner";
import {
  NAV_ALUNO_NUTRICAO,
  NAV_ALUNO_TREINOS,
  type NavItem,
} from "@/lib/nav/registry";
import type { VerticalKey } from "@/lib/vertical/route-mirror";

/**
 * Client-side shell wrapped by the server-side (aluno)/layout.tsx.
 * Server layout passes only serializable data (vertical key, available
 * verticals array of strings, children). Items + icons stay imported
 * here so the lucide React components don't cross the RSC boundary —
 * that crossing throws "Functions cannot be passed directly to Client
 * Components" and 500s every page under (aluno).
 */
export function AlunoLayoutShell({
  vertical,
  available,
  children,
}: {
  vertical: VerticalKey;
  available: VerticalKey[];
  children: React.ReactNode;
}) {
  const items: NavItem[] =
    vertical === "nutricao" ? NAV_ALUNO_NUTRICAO : NAV_ALUNO_TREINOS;
  const homeHref = vertical === "nutricao" ? "/nutricao/hoje" : "/hoje";
  const toggle =
    available.length >= 2 ? <VerticalToggle available={available} /> : null;

  return (
    <>
      <Sidebar items={items} homeHref={homeHref} />
      <div className="lg:pl-60 flex flex-col min-h-screen">
        <AppHeader
          perfilHref="/perfil"
          homeHref={homeHref}
          rightSlot={toggle}
          mobileLeftSlot={toggle}
        />
        {available.length >= 2 && <VerticalBanner vertical={vertical} />}
        <main className="flex-1 pb-[calc(env(safe-area-inset-bottom)+96px)] lg:pb-12 px-4 lg:px-8 py-6 lg:py-8">
          <PageTransition>{children}</PageTransition>
        </main>
        <BottomNav items={items} />
        <InstallPWAPrompt />
      </div>
    </>
  );
}
