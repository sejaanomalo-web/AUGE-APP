/**
 * Pares de rotas treino-side ↔ nutrição-side. Quando o aluno alterna o
 * top toggle, navegamos pra rota correspondente. Path dinâmico (ex.
 * /planos/[id]) cai pra rota base da outra vertical — perda de contexto
 * intencional já que IDs entre verticais são distintos.
 */
export const ROUTE_PAIRS: ReadonlyArray<{
  treino: string;
  nutricao: string;
}> = [
  { treino: "/hoje", nutricao: "/nutricao/hoje" },
  { treino: "/planos", nutricao: "/nutricao/cardapio" },
  { treino: "/historico", nutricao: "/nutricao/historico" },
  { treino: "/evolucao", nutricao: "/nutricao/evolucao" },
  { treino: "/objetivos", nutricao: "/nutricao/hoje" },
  { treino: "/medidas", nutricao: "/nutricao/hoje" },
  // /perfil é compartilhado entre verticais — preservado como está.
];

export type VerticalKey = "treinos" | "nutricao";

export function detectVerticalFromPathname(pathname: string): VerticalKey {
  return pathname.startsWith("/nutricao") ? "nutricao" : "treinos";
}

export function mirrorRoute(pathname: string, target: VerticalKey): string {
  // /perfil/* permanece igual em ambas verticais
  if (pathname.startsWith("/perfil")) return pathname;

  const current = detectVerticalFromPathname(pathname);
  if (current === target) return pathname;

  for (const pair of ROUTE_PAIRS) {
    const fromKey = target === "treinos" ? "nutricao" : "treino";
    const toKey = target === "treinos" ? "treino" : "nutricao";
    if (pathname === pair[fromKey] || pathname.startsWith(pair[fromKey] + "/")) {
      return pair[toKey];
    }
  }

  // Fallback: home da vertical alvo
  return target === "treinos" ? "/hoje" : "/nutricao/hoje";
}
