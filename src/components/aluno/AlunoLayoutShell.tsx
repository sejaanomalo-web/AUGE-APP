"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/shared/Sidebar";
import { AppHeader } from "@/components/shared/AppHeader";
import { PageTransition } from "@/components/shared/PageTransition";
import { BottomNav } from "@/components/shared/BottomNav";
import { InstallPWAPrompt } from "@/components/notifications/InstallPWAPrompt";
import { VerticalToggle } from "@/components/shared/VerticalToggle";
import {
  NAV_ALUNO_NUTRICAO,
  NAV_ALUNO_TREINOS,
  type NavItem,
} from "@/lib/nav/registry";
import {
  detectVerticalFromPathname,
  type VerticalKey,
} from "@/lib/vertical/route-mirror";

/**
 * Client-side shell wrapped by the server-side (aluno)/layout.tsx.
 *
 * IMPORTANT: the active vertical is derived from `usePathname()` HERE, not
 * passed down from the server layout. The (aluno) layout is shared between
 * /hoje and /nutricao/* — Next.js does NOT re-render shared layouts on
 * client navigation, so a server-computed vertical would freeze on the
 * value from the first load. Deriving it client-side makes the theme
 * (data-vertical → teal), the nav swap and the active tab all update
 * instantly when the toggle navigates.
 *
 * Items + icons stay imported here so the lucide React components don't
 * cross the RSC boundary (that throws "Functions cannot be passed directly
 * to Client Components").
 */
export function AlunoLayoutShell({
  available,
  children,
}: {
  available: VerticalKey[];
  children: React.ReactNode;
}) {
  const pathname = usePathname() ?? "/hoje";
  const vertical = detectVerticalFromPathname(pathname);

  const items: NavItem[] =
    vertical === "nutricao" ? NAV_ALUNO_NUTRICAO : NAV_ALUNO_TREINOS;
  const homeHref = vertical === "nutricao" ? "/nutricao/hoje" : "/hoje";
  const toggle =
    available.length >= 2 ? <VerticalToggle available={available} /> : null;

  return (
    <div data-vertical={vertical} className="min-h-screen bg-bg-base">
      <Sidebar items={items} homeHref={homeHref} />
      <div className="lg:pl-60 flex flex-col min-h-screen">
        <AppHeader
          perfilHref="/perfil"
          homeHref={homeHref}
          centerSlot={toggle}
        />
        <main className="flex-1 pb-[calc(env(safe-area-inset-bottom)+96px)] lg:pb-12 px-4 lg:px-8 py-6 lg:py-8">
          <PageTransition>{children}</PageTransition>
        </main>
        <BottomNav items={items} />
        <InstallPWAPrompt />
      </div>
    </div>
  );
}
