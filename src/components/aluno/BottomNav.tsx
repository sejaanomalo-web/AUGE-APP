"use client";

import { BottomNav as SharedBottomNav } from "@/components/shared/BottomNav";
import {
  NAV_ALUNO_NUTRICAO,
  NAV_ALUNO_TREINOS,
  type NavItem,
} from "@/lib/nav/registry";

export function BottomNav({
  items,
  className,
}: {
  items?: NavItem[];
  className?: string;
}) {
  return <SharedBottomNav items={items ?? NAV_ALUNO_TREINOS} className={className} />;
}

// Backward-compat re-export for existing (personal) and tooling consumers.
export const alunoSidebarItems = NAV_ALUNO_TREINOS;
export { NAV_ALUNO_NUTRICAO };
