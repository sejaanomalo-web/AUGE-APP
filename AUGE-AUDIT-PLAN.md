# AUGE — Pente fino completo e plano de implementação

**Data:** 2026-06-13
**Método:** auditoria multi-agente (7 dimensões em paralelo + verificação adversarial de cada achado + síntese). 71 achados levantados → 54 refutados na verificação → **17 confirmados**. Mais auditoria direta do banco (Supabase advisors) e do build.

**Restrição do dono respeitada:** nenhuma funcionalidade/comportamento visível ao usuário foi alterado. Só entraram mudanças que preservam o resultado byte-a-byte (performance, queries, bundle, código morto) ou consertam algo que já estava quebrado.

---

## ✅ FASE 1 — Aplicado nesta sessão (zero mudança de comportamento)

### Velocidade de navegação / abas (a dor principal do dono)
A causa real de abas "lentas" é o TTFB: cada página espera todas as queries do Postgres **em série** antes do primeiro byte. Paralelizamos as consultas independentes — mesmos dados, mesma tela, só mais rápido.

| # | Arquivo | O que mudou | Ganho |
|---|---------|-------------|-------|
| 1 | `src/app/(aluno)/hoje/page.tsx` | 4 consultas independentes (plano, stats, medidas, eventos) agora em `Promise.all`; os 2 `findFirst` de log idem | aba central do aluno: de ~soma das latências para ~a maior |
| 2 | `src/lib/aluno-stats.ts` | as 4 queries internas de `getAlunoWeeklyStats` em `Promise.all` + `select` enxuto nos `exerciseLogs` | ~75% menos latência da função (usada em /hoje e /alunos/[id]) |
| 3 | `src/app/(personal)/dashboard/page.tsx` | loop N+1 (2 queries por aluno em série) → 2 queries agregadas (`findMany` com `_count` + `groupBy`), tudo num `Promise.all` | TTFB do painel deixa de crescer com a carteira de alunos (antes O(2N) round-trips) |
| 4 | `src/lib/actions/workout-logs.ts` | `getMyHistory` trocou `include` profundo por `select` enxuto | /histórico para de trazer plano + exercícios completos descartados (dezenas de KB/log) |
| 5 | `src/lib/actions/goals.ts` | progresso das metas em `Promise.all` (com memo por metric:period) + soma de km via `aggregate` no banco | /objetivos para de fazer 1 query por meta em série |
| 6 | `src/middleware.ts` | removido header `x-pathname` morto (ninguém lia; clonava `Headers` em toda request) | menos trabalho por request; remove armadilha de forçar dynamic rendering |

### Bundle do cliente (PWA mobile mais leve)

| # | Arquivo | O que mudou | Ganho |
|---|---------|-------------|-------|
| 7 | `src/instrumentation-client.ts` | Sentry Session Replay carregado via `lazyLoadIntegration` (sob demanda) em vez de estático | ~50 kB gzip fora do first-load de **todas** as rotas; mesmos sample rates |
| 8 | `MotionProvider.tsx` + 8 componentes | framer-motion migrado para `LazyMotion` + `m` (featureset `domMax` async) | ~25 kB gzip fora do bundle compartilhado; animações idênticas |
| 9 | `ExerciciosClient.tsx`, `EvolucaoEvaluations.tsx` | `loading="lazy" decoding="async"` nas thumbnails de lista | imagens fora da tela não competem banda no load |
| 10 | `package.json` | removidas deps nunca importadas: `zod`, `@supabase/ssr` | install/CI/lockfile mais limpos, menor superfície de auditoria |

### Build / infra
- **Prisma client obsoleto** estava gerando erros de tipo fantasma localmente (`tx.workoutPlan does not exist`, etc.) e ajudando a estourar o `tsc` no `next build`. `prisma generate` fresco resolveu — `tsc` do código-fonte agora passa com **0 erros**.

---

## ⏸️ REQUER DECISÃO DO DONO (mudam algo visível — não aplicado)

Estes são reais e de alto impacto na **velocidade percebida**, mas mexem em comportamento visível, então ficam para sua aprovação:

1. **`loading.tsx` (skeletons) por rota** — hoje a tela "congela" na página antiga até o servidor responder. Com skeletons, a aba troca **instantaneamente** (mostra esqueleto e depois o conteúdo). É o maior ganho de "sensação de rapidez", mas introduz um estado de carregamento visível onde hoje não há. *Recomendado se você topar o skeleton.*

2. **`experimental.staleTimes.dynamic` (15–30s)** em `next.config.ts` — ao voltar para uma aba aberta há segundos, reusa o cache do cliente em vez de refazer tudo. Trade-off: dados de **outro** dispositivo/cron podem aparecer com até X s de atraso (mudanças do próprio usuário continuam na hora, pois as actions já fazem `revalidatePath`).

3. **`PageTransition` (`AnimatePresence mode="wait"`)** — a animação de saída serializa ~200ms extra em cada troca. Remover/trocar por `popLayout` deixa a navegação mais ágil, mas altera a animação que você desenhou. *Decisão de design.*

---

## 🔒 Banco de dados (Supabase) — observações

O projeto Supabase é **compartilhado** com outro sistema (Hub/Sentinela: tabelas financeiras, tráfego, etc.). As tabelas do AUGE acessadas via Prisma usam conexão direta (service role), então:
- "RLS habilitada sem policy" nas tabelas do AUGE (`usuarios`, `notificacoes`, `push_subscriptions`, …) é **intencional e seguro** (bloqueia anon; só service role acessa) — confirmado pelos próprios comentários das tabelas.
- Os alertas de `SECURITY DEFINER` / RLS permissiva são em maioria do **outro** sistema. Não tocamos no banco (mudanças de schema/policies exigem sua autorização explícita e são infra compartilhada).
- Crons no `vercel.json`: só `morning` e `evening` estão agendados, mas existem 6 rotas de cron no código (`events`, `nutrition-evening`, `nutrition-meal-reminder`, `strava-refresh`). **Vale confirmar** se as outras 4 deveriam estar agendadas (podem ser features que nunca disparam) — não alteramos para não mudar comportamento sem sua decisão.

---

## Como verificar que nada quebrou
- `npx prisma generate && npm run build` → compila.
- `tsc` do código-fonte: 0 erros.
- Cada otimização preserva o resultado renderizado (mesmos dados, ordem e arredondamentos); as mudanças foram verificadas por um agente adversarial campo a campo.
