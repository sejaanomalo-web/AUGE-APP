import { headers } from "next/headers";
import { Sidebar } from "@/components/shared/Sidebar";
import { AppHeader } from "@/components/shared/AppHeader";
import { PageTransition } from "@/components/shared/PageTransition";
import {
  BottomNav,
  NAV_ALUNO_NUTRICAO,
} from "@/components/aluno/BottomNav";
import { NAV_ALUNO_TREINOS } from "@/lib/nav/registry";
import { InstallPWAPrompt } from "@/components/notifications/InstallPWAPrompt";
import { VerticalToggle } from "@/components/shared/VerticalToggle";
import { getMyProfessionals } from "@/lib/actions/professional-context";
import { detectVerticalFromPathname } from "@/lib/vertical/route-mirror";

export default async function AlunoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const h = await headers();
  const pathname = h.get("x-pathname") ?? "/hoje";
  const vertical = detectVerticalFromPathname(pathname);
  const { available } = await getMyProfessionals();

  const items =
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
          rightSlot={toggle}
          mobileLeftSlot={toggle}
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
