"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
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
  mirrorRoute,
  type VerticalKey,
} from "@/lib/vertical/route-mirror";

function persistVertical(v: VerticalKey) {
  document.cookie = `auge_vertical=${v};path=/;max-age=31536000;samesite=lax`;
}

const SHARED_PREFIXES = ["/perfil"];
function isSharedRoute(pathname: string) {
  return SHARED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + "/"),
  );
}

/**
 * Client-side shell wrapped by the server-side (aluno)/layout.tsx.
 *
 * A vertical ativa é derivada de usePathname() AQUI (não passada pelo server),
 * porque o layout (aluno) é compartilhado entre /hoje e /nutricao/* e o Next
 * NÃO re-renderiza layouts compartilhados em navegação client — computar no
 * server congelaria tema/nav.
 *
 * Rotas compartilhadas (ex.: /perfil) não pertencem a uma vertical. Para elas
 * preservamos a última vertical em que o usuário esteve (estado + cookie), em
 * vez de cair no default "treinos" — senão abrir o Perfil estando em Nutrição
 * jogava tudo de volta pro tema de treino.
 */
export function AlunoLayoutShell({
  available,
  initialVertical = "treinos",
  children,
}: {
  available: VerticalKey[];
  initialVertical?: VerticalKey;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname() ?? "/hoje";
  const routeVertical = detectVerticalFromPathname(pathname);
  const shared = isSharedRoute(pathname);
  const sole = available.length === 1 ? available[0] : null;

  const [remembered, setRemembered] = React.useState<VerticalKey>(
    sole ?? (shared ? initialVertical : routeVertical),
  );

  // Em rotas próprias de uma vertical, memoriza qual é e persiste no cookie
  // (lido pelo server no próximo full load para evitar flash em /perfil).
  React.useEffect(() => {
    if (sole || shared) return;
    setRemembered(routeVertical);
    persistVertical(routeVertical);
  }, [routeVertical, shared, sole]);

  const vertical: VerticalKey = sole ?? (shared ? remembered : routeVertical);

  // Espelha a vertical no <body> para que conteúdo renderizado via portal
  // (tutorial, sheet de notificações, menu da conta) — que fica FORA da div
  // com data-vertical abaixo — também herde o accent teal em Nutrição.
  React.useEffect(() => {
    document.body.setAttribute("data-vertical", vertical);
    return () => document.body.removeAttribute("data-vertical");
  }, [vertical]);

  // Troca de vertical pelo toggle. Em rota própria, navega pro espelho; em
  // rota compartilhada (/perfil), alterna em lugar (atualiza memória + cookie).
  const selectVertical = React.useCallback(
    (v: VerticalKey) => {
      setRemembered(v);
      persistVertical(v);
      if (!isSharedRoute(pathname)) router.push(mirrorRoute(pathname, v));
    },
    [pathname, router],
  );

  const items: NavItem[] =
    vertical === "nutricao" ? NAV_ALUNO_NUTRICAO : NAV_ALUNO_TREINOS;
  const homeHref = vertical === "nutricao" ? "/nutricao/hoje" : "/hoje";
  const toggle =
    available.length >= 2 ? (
      <VerticalToggle
        available={available}
        current={vertical}
        onSelect={selectVertical}
      />
    ) : null;

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
