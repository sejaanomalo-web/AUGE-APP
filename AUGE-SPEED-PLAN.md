# AUGE — Plano de velocidade (inicialização + transições) — 2026-06-13

Investigação multi-agente (4 frentes: cold-start, transição, cargas desnecessárias, bundle/dados) + verificação contra o código real. Foco: app abrir o mais rápido possível **direto na landla** (sem o splash animado) e transições entre abas/ações o mais instantâneas possível, desativando o que carrega sem necessidade.

## Aplicado nesta sessão

### Inicialização
1. **Removido o splash overlay animado** (`#auge-splash` + `SplashDismiss`) que impunha ~420ms mínimos + 450ms de fade a cada abertura — era a causa direta do "travado". O app agora pinta a landing assim que o HTML (já no precache do service worker) chega. `src/app/layout.tsx`, `src/components/shared/SplashDismiss.tsx` (deletado). Mantido o splash **nativo** do iOS (`apple-touch-startup-image`), que não custa JS e evita tela branca no boot do SO.
2. **Hero da landing mais rápido**: delays dos textos/CTA de 220ms/420ms → 60ms/120ms e a animação `hero-rise` de 720ms → 300ms. O "Começar agora"/"Já tenho conta" aparece quase junto com o logo. `src/app/page.tsx`, `tailwind.config.ts`.

### Transição entre abas/ações
3. **`PageTransition` instantâneo**: removido `AnimatePresence mode="wait"` (serializava ~200ms de saída antes de entrar) + o deslocamento `y`. Agora é só um fade-in de 120ms — a página nova entra na hora. `src/components/shared/PageTransition.tsx`.
4. **`staleTimes` no router cache** (`dynamic: 30`, `static: 180`): voltar a uma aba visitada nos últimos 30s reusa o conteúdo em cache (navegação instantânea, sem round-trip). Mutações já chamam `revalidatePath`/`router.refresh`, então dados do próprio usuário continuam frescos. `next.config.ts`.
5. **`loading.tsx` por grupo de rota** ((aluno), (personal), (nutricionista), (execucao)) + skeleton `RouteSkeleton`: qualquer aba sem loading próprio agora commita na hora mostrando esqueleto, em vez de congelar até o RSC chegar. Também faz o prefetch dos `<Link>` valer.

### Cargas desnecessárias / overhead
6. **Sino de notificações: 2 queries → 1 server action** (`getNotificationsWithCount`, uma chamada `auth()` + uma transação Prisma) em todo shell autenticado. `src/lib/actions/notifications.ts`, `src/lib/notifications/use-notifications.ts`.
7. **Sentry mais leve no mobile**: `replaysSessionSampleRate 0.1 → 0` (sem gravação contínua de sessões saudáveis) e `enableLogs true → false` no cliente. Mantido replay em erro (`replaysOnErrorSampleRate: 1.0`) e tracing (0.2). `src/instrumentation-client.ts`.
8. **Tunnel do Sentry fora do Clerk**: `/monitoring` virou rota pública no middleware — telemetria não paga `auth.protect()` no Edge a cada envio. `src/middleware.ts`.
9. **`optimizePackageImports` (lucide-react, date-fns)**: tira peso de barrel do First Load JS compartilhado (lucide é usado em ~90 arquivos, inclusive nos layouts). `next.config.ts`.
10. **`getMyPlans` reusa `getCurrentUser`** (React cache de request) em vez de refazer `user.findUnique` — elimina um round-trip serial em /treinos e /planos. `src/lib/actions/workout-plans.ts`.

## Confirmado já-bom (sem ação)
- `recharts` já é `dynamic()` (não está no bundle inicial; só nas telas de gráfico).
- WorkoutBuilder/MealPlanBuilder/ExerciseExecutor/GuidedTour já são code-split por rota/botão (não estão no bundle compartilhado).
- `useSupabaseClient` é memoizado (um único websocket; sem re-subscribe por render).
- Layouts de grupo não re-executam queries em navegação client dentro do grupo.

## Requer sua decisão (NÃO aplicado — mudam comportamento/risco)
- **Adiar o WebSocket de realtime do sino** até abrir o sino: tiraria o handshake do mount, mas o badge deixaria de incrementar ao vivo (só atualizaria ao abrir o sino/recarregar). Mantido ligado por enquanto.
- **Remover `router.refresh()` redundante** após updates otimistas (Objetivos/Treinos): acelera, mas precisa revisar caso a caso para não deixar dado derivado do servidor desatualizado.
- **`unstable_cache` em `getMyProfessionals`** (vertical do aluno) com TTL: risco de vertical desatualizada se o vínculo mudar.
- **Mover localization do Clerk (ptBR)** para só as telas de auth: tira peso da landing, mas mexe na estrutura de auth global.
- **`staleTimes.dynamic`**: usei 30s; se /hoje precisar ser mais "ao vivo", reduzir para ~15-20s.

## Validação
`prisma generate` + `npm run build` verde; `tsc` 0 erros; First Load JS compartilhado comparado antes/depois.
