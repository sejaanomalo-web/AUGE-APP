# MASTER PLAN — Vertical de Nutrição no AUGE-APP

## 1. Visão geral

O AUGE-APP precisa ganhar uma segunda vertical de produto (Nutrição), com role NUTRICIONISTA full, toggle no header do aluno para alternar entre Treinos e Nutrição, e capacidade de um aluno ter um Personal E uma Nutricionista vinculados simultaneamente. A decisão arquitetural é construir Nutrição como um módulo paralelo (Parallel Namespace) sob `/nutri/*` para o lado profissional e `/nutricao/*` para o lado aluno, com tabelas de link e invite separadas das de treino. URL é a fonte de verdade da vertical ativa do aluno; o toggle navega entre rotas pareadas e não muda view state.

A racional principal é que o AUGE já tem uma implementação treino-side madura (Strava integrado, crons em produção, follow-up forms, eventos, push notifications) e 25+ call sites usando `trainerStudent.findFirst({status:'ACTIVE'})` como predicado de autorização. Generalizar TrainerStudent para uma tabela polimórfica ProfessionalLink com coluna `vertical` exige patchar cada um desses sites com um filtro `vertical:'TREINOS'` — uma falha por omissão vira regressão de segurança (nutricionista recebe notificação de treino, ou pior, autoriza ação treino-side). Tabelas paralelas eliminam essa classe de bug por construção: queries treino consultam TrainerStudent, queries nutri consultam NutritionistStudent, sem interseção possível.

Pagamos um custo conhecido de duplicação (800-1200 LOC entre nutri-students.ts, nutri-meal-plans.ts, nutri-invites.ts vs. seus equivalentes treino), mas mitigamos esse custo onde realmente importa criando um único helper `notifyByContext(actorId, resolver, type, payload)` que centraliza o fanout de notificações. Adicionamos coluna `vertical` em Notification desde a primeira migração para evitar backfill futuro quando precisarmos de inbox filtrado por vertical. E corrigimos imediatamente o latent bug do consumeInviteCode (re-link após ENDED viola unique) que afeta tanto treino quanto nutri.

## 2. Modelo de dados

Diff conceitual em `prisma/schema.prisma` — todo aditivo, sem renames, sem drops, sem alterações de nullability em colunas existentes:

### Enums modificados

```prisma
enum UserRole {
  PERSONAL
  ALUNO
  NUTRICIONISTA  // NOVO
}

enum NotificationType {
  // ... valores existentes preservados
  // NOVOS:
  MEAL_PLAN_CREATED
  MEAL_PLAN_UPDATED
  MEAL_REMINDER
  STUDENT_MEAL_LOGGED
  STUDENT_MEAL_SKIPPED
  NUTRI_COMMENT
  NUTRI_INVITE_ACCEPTED
  NUTRI_FOLLOWUP_FORM_SENT
  NUTRI_FOLLOWUP_FORM_ANSWERED
}
```

### Enum novo (reservado para futuro)

```prisma
enum Vertical {
  TREINOS
  NUTRICAO
  // FISIO MENTAL SONO — reservados, não usados em v1
}
```

A coluna `vertical` aparece apenas em Notification (e opcionalmente em InviteCode/Event mais tarde). NÃO usamos Vertical no TrainerStudent — é o que mantém a segurança das queries treino-side.

### User — campos adicionados

```prisma
model User {
  // ... campos existentes preservados (cref, sportsPracticed, etc.)
  crn               String?    // NOVO — Conselho Regional de Nutricionistas
  preferredVertical Vertical?  // NOVO — última vertical usada pelo aluno (default para post-login)
}
```

`cref` e `crn` coexistem como colunas opcionais. A invariante "uma role por User" é mantida no app layer; documentamos que um profissional dual-certificado cria duas contas Clerk (limitação aceita do v1).

### Novo link table — NutritionistStudent (paralelo, NÃO renomeia TrainerStudent)

```prisma
model NutritionistStudent {
  id              String                    @id @default(cuid())
  nutritionistId  String
  studentId       String
  status          NutritionistStudentStatus @default(ACTIVE)
  inviteId        String?
  startedAt       DateTime                  @default(now())
  endedAt         DateTime?
  nutritionist    User                      @relation("NutricionistaRelation", fields: [nutritionistId], references: [id], onDelete: Cascade)
  student         User                      @relation("NutriAlunoRelation",    fields: [studentId],      references: [id], onDelete: Cascade)
  @@unique([nutritionistId, studentId])
  @@index([nutritionistId, status])
  @@index([studentId, status])
}

enum NutritionistStudentStatus { PENDING ACTIVE PAUSED ENDED }
```

### Novo invite table — InviteCodeNutri (paralelo)

```prisma
model InviteCodeNutri {
  id             String       @id @default(cuid())
  code           String       @unique
  nutritionistId String
  status         InviteStatus @default(ACTIVE)  // reusa enum existente
  usedById       String?
  usedAt         DateTime?
  expiresAt      DateTime
  createdAt      DateTime     @default(now())
  nutritionist   User         @relation("InviteNutriCreator",  fields: [nutritionistId], references: [id], onDelete: Cascade)
  usedBy         User?        @relation("InviteNutriConsumer", fields: [usedById],       references: [id])
}
```

Códigos nanoid de 6 chars, alfabeto idêntico ao trainer, TTL 7 dias. Lookup duplo em validateInviteCode resolve qual tabela contém o código — para o aluno, é um único campo de texto.

### Domínio de Nutrição (espelha WorkoutPlan tree)

```prisma
model MealPlan {
  id              String    @id @default(cuid())
  nutritionistId  String?
  studentId       String
  name            String
  description     String?
  startDate       DateTime
  endDate         DateTime?
  isActive        Boolean   @default(true)
  pausedAt        DateTime?
  targetCalories  Int?
  targetProteinG  Int?
  targetCarbsG    Int?
  targetFatG      Int?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  meals           Meal[]
  logs            MealLog[]
}

model Meal {
  id        String     @id @default(cuid())
  planId    String
  name      String     // "Café da manhã"
  timeOfDay String?    // "07:30"
  dayOfWeek Int?       // 0-6 ou null para diário
  order     Int
  notes     String?
  items     MealItem[]
  plan      MealPlan   @relation(fields: [planId], references: [id], onDelete: Cascade)
}

model MealItem {
  id        String      @id @default(cuid())
  mealId    String
  foodId    String
  quantity  Float
  unit      String      // "g", "ml", "unid"
  notes     String?
  order     Int
  meal      Meal        @relation(fields: [mealId], references: [id], onDelete: Cascade)
  food      FoodCatalog @relation(fields: [foodId], references: [id])
}

model FoodCatalog {
  id              String  @id @default(cuid())
  name            String
  brand           String?
  isCustom        Boolean @default(false)
  createdById     String?
  source          String  // "TACO" | "USDA" | "USER"
  kcalPer100g     Float
  proteinPer100g  Float
  carbsPer100g    Float
  fatPer100g      Float
  fiberPer100g    Float?
  @@index([name])
  @@index([createdById])
}

model MealLog {
  id           String         @id @default(cuid())
  mealId       String
  studentId    String
  date         DateTime
  startedAt    DateTime       @default(now())
  finishedAt   DateTime?
  status       MealLogStatus  @default(PENDING)
  mode         MealLogMode    @default(GUIDED)
  notes        String?
  studentNotes String?
  photoKey     String?
  items        MealItemLog[]
}

model MealItemLog {
  id            String   @id @default(cuid())
  mealLogId     String
  foodId        String
  grams         Float?
  consumed      Boolean
  skipped       Boolean  @default(false)
  skippedReason String?
  loggedAt      DateTime @default(now())
}

enum MealLogStatus { PENDING LOGGED SKIPPED PARTIAL }
enum MealLogMode   { GUIDED FREE }

model HydrationLog {
  id        String   @id @default(cuid())
  studentId String
  date      DateTime
  ml        Int
  source    String   // "manual" | "reminder"
  createdAt DateTime @default(now())
  @@index([studentId, date])
}
```

### Notification — coluna `vertical` adicionada DESDE a primeira migração

```prisma
model Notification {
  // ... campos existentes
  vertical  Vertical?  // NOVO — nullable para retrocompatibilidade; backfill via CASE no migration
}
```

Backfill no SQL da migração: `UPDATE "Notification" SET vertical = CASE WHEN type::text LIKE 'MEAL_%' OR type::text LIKE 'NUTRI_%' THEN 'NUTRICAO' ELSE 'TREINOS' END WHERE vertical IS NULL;`

### NotificationSettings — flags por vertical

```prisma
model NotificationSettings {
  // ... campos existentes preservados
  nutricionistActivity Boolean @default(true)  // NOVO
  mealReminder         Boolean @default(true)  // NOVO
  mealReminderHours    Int[]   @default([7, 12, 19])  // NOVO
  hydrationReminder    Boolean @default(false)  // NOVO
}
```

Mantemos `trainerActivity`/`studentActivity` para retrocompatibilidade — semântica permanece treino-side.

### Modelos NÃO modificados em v1

- **TrainerStudent** — totalmente intocado. Nenhuma coluna, nenhuma constraint, nenhuma relation muda. Esta é a decisão load-bearing.
- **InviteCode** — intocado.
- **Event** — intocado. Um nutricionista cria Event com `trainerId = currentUser.id` (a coluna é genericamente User FK). Nutri events viverão na mesma tabela em v1; em v2 podemos adicionar `vertical` se análise mostrar necessidade.
- **FollowUpFormTemplate**, **FollowUpFormSend** — intocados. Nutri usa templates próprios criados via seu próprio shell.
- **BodyMetric**, **ExamUpload** — intocados; visibilidade cross-vertical via helper `getAlunoSharedData` (fase 6).
- **Strava\*** — intocado, permanece treino-only.

## 3. Auth e papéis

### UserRole

Enum ganha `NUTRICIONISTA`. Postgres `ALTER TYPE ... ADD VALUE 'NUTRICIONISTA'` precisa rodar fora de transação — migração será criada com `prisma migrate dev --create-only` e o SQL editado manualmente para separar o ADD VALUE em statement próprio antes do BEGIN.

### requireRole

`src/lib/auth-helpers.ts:10` — assinatura widening:

```ts
import type { UserRole } from "@prisma/client";
import { ROLE_DEFAULT_ROUTE } from "@/lib/auth/role-routes";

export async function requireRole(expected: UserRole) {
  const { userId } = await auth();
  if (!userId) redirect("/login");
  let user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) user = await ensureUserRecord();
  if (!user.role) redirect("/onboarding");
  if (user.role !== expected) redirect(ROLE_DEFAULT_ROUTE[user.role]);
  return user;
}
```

A ternária hardcoded da linha 21 vira lookup. Backward-compatible para todos 25+ call sites.

### Novo módulo — src/lib/auth/role-routes.ts

```ts
import type { UserRole } from "@prisma/client";

export const ROLE_DEFAULT_ROUTE: Record<UserRole, string> = {
  PERSONAL: "/dashboard",
  ALUNO: "/hoje",
  NUTRICIONISTA: "/nutri/dashboard",
};
```

Single source of truth, consumido por requireRole E src/app/post-login/page.tsx.

### Helpers novos

- `requireNutricionista()` em auth-helpers.ts — açúcar para `requireRole("NUTRICIONISTA")`, evita risco de typo literal em 30+ páginas nutri.
- `requireAnyRole(expected: UserRole[])` — para futuras surfaces compartilhadas.
- `requireNutriLink(studentId)` — espelha o predicado de autorização treino-side, consultando NutritionistStudent.

### Clerk

Clerk webhook em `src/app/api/webhooks/clerk/route.ts` permanece **intocado**: cria User com `role: null`, onboarding atribui. Não mirroramos role em publicMetadata — Prisma continua sendo source of truth. Mantém o contrato atual e evita loops de sincronização.

### Middleware

`src/middleware.ts` — **intocado**. Novas rotas `/nutri/*` e `/nutricao/*` são automaticamente protegidas pelo clerkMiddleware.auth.protect() existente. Role enforcement permanece server-side dentro de cada page.tsx.

### setUserRole

`src/lib/actions/users.ts:52` — opts ganham `crn`:

```ts
setUserRole(role: UserRole, opts?: { cref?: string; crn?: string; inviteCode?: string })
```

Branch interno: `if (role === "NUTRICIONISTA") update({ role, crn })`, senão comportamento existente. Para ALUNO + inviteCode, o consume tenta InviteCode primeiro, InviteCodeNutri depois — aluno não precisa saber qual digitou.

Guard rail: app layer valida que role==='PERSONAL' não aceita crn, role==='NUTRICIONISTA' não aceita cref. Documenta a invariante.

## 4. Estrutura de rotas

### Grupos de rotas

**Existentes (intocados):**
- `(personal)` → /dashboard, /alunos, /treinos, /exercicios, /eventos, /conta
- `(aluno)` → /hoje, /planos, /historico, /evolucao, /perfil, /medidas, /objetivos, /acompanhamento/[token]
- `(execucao)` → /treino/[id]/executar (fullscreen)
- `(public)` → /, /login, /cadastro, /onboarding

**Novo: `(nutricionista)`** — clone do (personal):
- `src/app/(nutricionista)/layout.tsx` — Sidebar + AppHeader + BottomNav, requireRole("NUTRICIONISTA"), data-vertical="nutricao" no wrapper
- `src/app/(nutricionista)/nutri/dashboard/page.tsx` → /nutri/dashboard
- `/nutri/alunos`, `/nutri/alunos/[id]`
- `/nutri/cardapios`, `/nutri/cardapios/novo`, `/nutri/cardapios/[id]`, `/nutri/cardapios/[id]/editar`
- `/nutri/alimentos` (catálogo de FoodCatalog)
- `/nutri/eventos`, `/nutri/eventos/novo` (cria Event com trainerId=currentNutri.id)
- `/nutri/conta`, `/nutri/conta/notificacoes`

Prefixo `/nutri/*` evita colisão com /(personal)/dashboard, /alunos, etc., e libera o caminho para futuro suporte a um humano dual-certificado.

**Novo: rotas aluno-side sob (aluno) — NÃO um grupo separado:**
- `src/app/(aluno)/nutricao/hoje/page.tsx` → /nutricao/hoje
- `/nutricao/cardapio` (lista MealPlans ativos)
- `/nutricao/cardapio/[id]` (visualização)
- `/nutricao/historico`, `/nutricao/historico/[id]`
- `/nutricao/evolucao`
- `/nutricao/agua` (HydrationLog)
- `/perfil/profissionais` (compartilhado — gerencia vínculos)

Não reorganizamos /hoje, /planos, /historico em /t/* — URLs treino-side permanecem byte-idênticas. Zero redirect a manter, zero notification.data.url a reescrever, zero risco de quebra de bookmark.

### Toggle = URL navigation

O VerticalToggle no header chama `router.push(mirrorRoute(pathname, target))`. Tabela de pares em `src/lib/vertical/route-mirror.ts`:

```ts
export const ROUTE_PAIRS: Array<{ treino: string; nutricao: string }> = [
  { treino: "/hoje",      nutricao: "/nutricao/hoje" },
  { treino: "/planos",    nutricao: "/nutricao/cardapio" },
  { treino: "/historico", nutricao: "/nutricao/historico" },
  { treino: "/evolucao",  nutricao: "/nutricao/evolucao" },
  { treino: "/perfil",    nutricao: "/perfil" },  // perfil compartilhado
];

export function mirrorRoute(pathname: string, target: "treino" | "nutricao"): string {
  // dynamic segments: match prefix, drop trailing /[id] params, fall back to vertical home
  // ...
}
```

Para dynamic IDs (ex. /planos/abc123 → /nutricao/cardapio), o fallback é a lista — perda de contexto aceita como tradeoff vs ambiguidade de mapeamento entre IDs distintos.

### API routes

- Novos: `/api/cron/nutrition-morning`, `/api/cron/nutrition-evening`
- Existentes intocados: `/api/cron/morning`, `/api/cron/evening`, `/api/cron/events`, `/api/cron/strava-refresh`
- Webhooks Clerk e Strava — intocados

**Verificar plano Vercel** antes da fase 4: se Hobby (limite de 2 crons), consolidar via loop interno em `/api/cron/morning` ao invés de criar endpoints novos. Decisão entra como critério go/no-go da fase.

### Backward compatibility

NÃO criamos redirects em next.config.ts para /hoje → /t/hoje porque /hoje permanece treino-side. Eliminamos toda uma classe de operacional (rewriting de Notification.data.url, debug de stale push notifications, smoke test de redirect-em-PWA-iOS-standalone).

## 5. Top toggle

### Componente — src/components/shared/VerticalToggle.tsx

Segmented pill, client component. Props:

```ts
interface VerticalToggleProps {
  available: Vertical[];    // calculado server-side via getMyProfessionals()
  current: Vertical;        // derivado do pathname server-side
}
```

Comportamento:
- Renderiza apenas se `available.length >= 2`.
- Clique chama `router.push(mirrorRoute(pathname, target))` + server action `updatePreferredVertical(target)` (atualiza User.preferredVertical para próximo /post-login).
- Active segment usa CSS `bg-accent text-text-on-accent` — re-tinta automaticamente quando data-vertical muda.

### Estado: URL como source of truth

NÃO usamos localStorage, NÃO usamos cookie de "active vertical". O pathname é o único source of truth. Razão:
- Bookmarkable: `/nutricao/hoje` é um deep link auto-descritivo.
- Multi-tab: cada aba tem seu próprio pathname, zero conflito.
- SSR: server components inferem vertical do pathname sem precisar de cookie.
- Back button: navegação preserva histórico naturalmente.

`User.preferredVertical` existe apenas para decidir o default no /post-login (aluno com ambas verticais cai em sua última escolha).

### ASCII mockup mobile (aluno com ambas verticais, vertical=treino ativa)

```
+----------------------------------------------------+
| [Treinos|NUTRI]  [Logo]                (bell) (av) |
+----------------------------------------------------+
|                                                    |
|  Hoje — 03 jun 2026                                |
|                                                    |
|  +----------------------------------------------+  |
|  | Treino A — Peito/Tríceps                     |  |
|  | 5 exercícios               [Iniciar treino]  |  |
|  +----------------------------------------------+  |
|                                                    |
|  Próximos eventos                                  |
|  ...                                               |
|                                                    |
+----------------------------------------------------+
|  [Treinos] [Objetivos]  HOJE  [Evolução] [Perfil]  |
+----------------------------------------------------+
```

Após tap em "NUTRI":

```
+----------------------------------------------------+
| [Treinos|NUTRI]  [Logo]                (bell) (av) |
+----------------------------------------------------+
|                                                    |
|  Hoje — 03 jun 2026 (Nutrição)                     |
|                                                    |
|  +----------------------------------------------+  |
|  | Café da manhã                       07:30    |  |
|  |  • 100g aveia + 1 banana                     |  |
|  |  • 3 ovos                          [logar]   |  |
|  +----------------------------------------------+  |
|  +----------------------------------------------+  |
|  | Almoço                              12:30    |  |
|  |  ...                                         |  |
|  +----------------------------------------------+  |
|                                                    |
+----------------------------------------------------+
|  [Cardápio] [Histórico] HOJE [Evolução] [Perfil]   |
+----------------------------------------------------+
```

### ASCII mockup desktop (lg+)

```
+--------+---------------------------------------------------+
|  AUGE  |  [Treinos|NUTRI]              (bell) (av Bruno v) |
|        +---------------------------------------------------+
| Planos |                                                   |
| Objet  |  Hoje                                             |
| HOJE * |  ...                                              |
| Evol   |                                                   |
| Perfil |                                                   |
+--------+---------------------------------------------------+
```

Sidebar à esquerda muda items conforme `data-vertical` no wrapper.

### Mobile vs desktop

- Mobile (<lg): toggle em `mobileLeftSlot` do AppHeader, à esquerda do Logo. Footprint ~140px na linha de cima da tela.
- Desktop (lg+): toggle em `rightSlot` do AppHeader, à direita da Sidebar logo, antes do NotificationBell.

**Auditoria de width mobile**: 360px viewport (iPhone SE) — toggle 140px + Logo ~80px + bell ~28px + avatar ~80px = 328px. Margem 32px ok mas apertado. Mitigação: pill colapsa para ícones-only (Dumbbell/Apple) em viewports < 400px.

### Estado por-usuário, não por-sessão

`User.preferredVertical` persiste a última vertical escolhida do aluno para defaultar `/post-login`. Se o aluno fecha o app em `/nutricao/hoje` e abre dois dias depois, `/post-login` redireciona para `/nutricao/hoje`. Cookie não é necessário porque pathname já é stateful.

## 6. Shells de UI

### Sidebar e BottomNav reagem via data-vertical

`src/app/(aluno)/layout.tsx` é server component que:
1. Chama `requireRole("ALUNO")`.
2. Chama `getMyProfessionals()` → `{ trainer, nutritionist }` (uma round-trip prisma, cacheado via React `cache()` para evitar re-fetch em sub-routes).
3. Detecta vertical do pathname (primeiro segmento): `/nutricao/*` → `nutricao`, senão → `treinos`.
4. Renderiza `<div data-vertical={vertical}>` envolvendo a árvore.
5. Passa para AppHeader: `<VerticalToggle available={available} current={vertical} />` em rightSlot/mobileLeftSlot.
6. Renderiza `<BottomNav items={vertical === "nutricao" ? NAV_NUTRI_ALUNO : NAV_TREINO_ALUNO} />`.

Pathname server-side: usamos `next/headers` headers() + middleware injeta `x-pathname` (1 linha em src/middleware.ts dentro do wrapper Clerk):

```ts
export default clerkMiddleware(async (auth, req) => {
  // ... existing logic
  const res = NextResponse.next();
  res.headers.set("x-pathname", req.nextUrl.pathname);
  return res;
});
```

Alternativa se Clerk dificultar: usar um pequeno client wrapper que lê usePathname e seta data-vertical via useEffect. Aceitável dado que toggle visual é cosmético.

### Theme accent por vertical

Adicionar em `src/app/globals.css`:

```css
:root, .dark {
  --nutri: 56 189 168;          /* teal */
  --nutri-hover: 70 200 180;
  --nutri-glow: 56 189 168;
  --shadow-nutri: 0 8px 24px rgb(56 189 168 / 0.35);
}
.light {
  --nutri: 16 130 110;          /* deep teal para contraste */
  --nutri-hover: 22 145 124;
  --nutri-glow: 16 130 110;
}

[data-vertical="nutricao"] {
  --accent: var(--nutri);
  --accent-hover: var(--nutri-hover);
  --accent-glow: var(--nutri-glow);
}
```

Cascada automática: BottomNav active pill (`bg-accent`), Sidebar active link (`text-accent`), .pulse-line, primary Button (`bg-accent`), focus ring — tudo re-tinta sem mexer em componente algum.

`--coach` (#1d4ed8 royal blue) permanece como accent "profissional fala com você", neutro de vertical. Usado em Card variant="coach" para mensagens de qualquer pro.

Adicionar variant "nutri" a `Card.tsx`, `Button.tsx`, `Badge.tsx` (linha cada em variantClasses), usado para surfaces nutri-específicas que devem ser teal independente do contexto (ex: cartão de aluno em /nutri/alunos).

### ASCII — tela inicial do aluno (vertical=treinos)

```
+--------------------------------------------------+
| Header com toggle e bell                         |
+--------------------------------------------------+
| Hoje                                             |
|                                                  |
| [Card: Treino A — Peito/Tríceps    Iniciar →]   |
|                                                  |
| Próximos eventos                                 |
| [Card: Prova 10k em 12 dias]                     |
|                                                  |
| Pulso do progresso                               |
| [Pulse line com --accent (lime)]                 |
+--------------------------------------------------+
| BottomNav (Hoje centralizado, --accent lime)     |
+--------------------------------------------------+
```

### ASCII — tela inicial do aluno (vertical=nutrição)

```
+--------------------------------------------------+
| Header com toggle e bell (--accent agora teal)   |
+--------------------------------------------------+
| Hoje — Nutrição                                  |
|                                                  |
| [Card: Café da manhã  07:30          Logar →]   |
| [Card: Almoço         12:30          Logar →]   |
| [Card: Lanche tarde   16:00          Logar →]   |
| [Card: Jantar         19:30          Logar →]   |
|                                                  |
| Hidratação                                       |
| [1.2L / 2.5L  ████████░░░░  Beber 250ml]        |
|                                                  |
| Pulso do progresso                               |
| [Pulse line agora teal via --accent override]    |
+--------------------------------------------------+
| BottomNav (Hoje centralizado, items nutri)       |
+--------------------------------------------------+
```

### ASCII — dashboard do nutricionista (desktop)

```
+---------+-----------------------------------------------+
|  AUGE   |  [Logo mobile]                  (bell) Marina |
|  ▸Painel|                                               |
|  ▸Aluno |                                               |
| *Cardáp |  Painel — Nutrição                            |
|  ▸Alim  |                                               |
|  ▸Event |  12 alunos ativos   4 cardápios esta semana   |
|  ▸Conta |  3 follow-ups pendentes  2 consultas hoje     |
|         |                                               |
|         |  [Lista de alunos com aderência semanal]      |
|         |  [Aderência média: 82%]                       |
+---------+-----------------------------------------------+
^ --accent teal pelo data-vertical="nutricao" no layout
```

### Registry centralizado de nav

Em vez de hardcoded em cada layout (padrão atual), criamos `src/lib/nav/registry.ts`:

```ts
export const NAV_TREINO_PERSONAL: SidebarItem[] = [...];
export const NAV_NUTRI_NUTRICIONISTA: SidebarItem[] = [...];
export const NAV_TREINO_ALUNO: SidebarItem[] = [
  { href: "/planos",    label: "Treinos",   icon: ClipboardList },
  { href: "/objetivos", label: "Objetivos", icon: Crosshair },
  { href: "/hoje",      label: "Hoje",      icon: Target },         // centro
  { href: "/evolucao",  label: "Evolução",  icon: TrendingUp },
  { href: "/perfil",    label: "Perfil",    icon: User },
];
export const NAV_NUTRI_ALUNO: SidebarItem[] = [
  { href: "/nutricao/cardapio",  label: "Cardápio",  icon: Utensils },
  { href: "/nutricao/historico", label: "Histórico", icon: History },
  { href: "/nutricao/hoje",      label: "Hoje",      icon: Target },  // centro
  { href: "/nutricao/evolucao",  label: "Evolução",  icon: TrendingUp },
  { href: "/perfil",             label: "Perfil",    icon: User },
];
```

Layouts importam direto. Para uma 3a vertical (fisio), adicionar `NAV_FISIO_ALUNO` é uma linha.

## 7. Onboarding e cadastro

### /onboarding com 3 cards

Modificar `src/app/(public)/onboarding/page.tsx`:

```tsx
type Role = UserRole;  // antes: "PERSONAL" | "ALUNO"

// step 'role':
<div className="grid gap-3 md:grid-cols-3">
  <RoleCard icon={Activity} title="Sou Aluno"        onClick={() => pickRole("ALUNO")} />
  <RoleCard icon={Users}    title="Sou Personal"     onClick={() => pickRole("PERSONAL")} />
  <RoleCard icon={Apple}    title="Sou Nutricionista" onClick={() => pickRole("NUTRICIONISTA")} />
</div>
```

### ASCII — tela onboarding step 'role'

```
+--------------------------------------------------+
|  Bem-vindo ao AUGE                               |
|  Como você usa o app?                            |
|                                                  |
|  +------------+  +------------+  +-------------+ |
|  | [Activity] |  |  [Users]   |  |   [Apple]   | |
|  |            |  |            |  |             | |
|  | Sou Aluno  |  | Sou Personal| | Sou Nutri   | |
|  |            |  |            |  |             | |
|  +------------+  +------------+  +-------------+ |
+--------------------------------------------------+
```

### Step 'details' branches

- PERSONAL: input CREF (existente).
- NUTRICIONISTA: input CRN — placeholder "CRN-3 12345/SP", mesmo styling do CREF.
- ALUNO: input invite code (existente, debounced 300ms).

`validateInviteCode` estende retorno: `{ valid, professionalName, vertical }`. UI renderiza "X é seu personal" ou "X é sua nutricionista" baseado em `vertical`.

`setUserRole` aceita opts `{ cref?, crn?, inviteCode? }`. Guard rail no app layer: role==='PERSONAL' rejeita crn, role==='NUTRICIONISTA' rejeita cref.

### Aluno linka segundo profissional pós-onboarding

Nova página `src/app/(aluno)/perfil/profissionais/page.tsx`:

```
+--------------------------------------------------+
|  Meus profissionais                              |
+--------------------------------------------------+
|  Treinos                                         |
|  [Card: Marina Souza — Personal      Vinculado] |
|                                                  |
|  Nutrição                                        |
|  [Empty state: "Você ainda não tem nutricionista|
|   vinculado(a). Cole um código de convite:"     |
|   [_______]  [Vincular]                         ]|
+--------------------------------------------------+
```

Lista vínculos ativos agrupados por vertical, com "Adicionar profissional" abrindo input de invite code. Reusa `consumeInviteCode` (que internamente dispatcha entre InviteCode e InviteCodeNutri por lookup).

### Re-link após ENDED — fix do soft-delete bug

`consumeInviteCode` (ambas variants) é refatorado para fazer **upsert** em vez de create:

```ts
// pseudo
const existing = await prisma.trainerStudent.findUnique({
  where: { trainerId_studentId: { trainerId, studentId } },
});
if (existing && existing.status === "ENDED") {
  await prisma.trainerStudent.update({
    where: { id: existing.id },
    data: { status: "ACTIVE", endedAt: null, inviteId: invite.id, startedAt: new Date() },
  });
} else if (existing) {
  throw new Error("Você já tem um vínculo ativo com este profissional");
} else {
  await prisma.trainerStudent.create({ ... });
}
```

Mesmo padrão em consumeNutritionistInvite. Isso resolve o bug pré-existente (re-add após ENDED viola unique) e é necessário para que o fluxo aluno → /perfil/profissionais → "adicionar de novo um personal antigo" funcione.

### Notificações ao aceitar invite

- Personal: `STUDENT_INVITE_ACCEPTED` → url `/alunos/${studentId}` (existente, preservado).
- Nutricionista: `NUTRI_INVITE_ACCEPTED` → url `/nutri/alunos/${studentId}` (novo).

### Clerk

`/cadastro/[[...rest]]` e `/login/[[...rest]]` — **intocados**. Clerk só coleta identidade.

Variável env `NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/onboarding` — preservada.

## 8. Vínculos profissional-aluno

### Modelo: duas tabelas paralelas

**TrainerStudent** (intocado):
- @@unique([trainerId, studentId]) — pair-unique
- Usado por workout-plans, follow-up, events, exams, body-metrics, workout-logs, crons treino-side
- 25+ call sites permanecem byte-idênticos

**NutritionistStudent** (novo):
- @@unique([nutritionistId, studentId]) — pair-unique
- Usado exclusivamente por meal-plans, foods, meal-logs, crons nutri-side
- Zero overlap com TrainerStudent

### Múltiplos profissionais por aluno

Resolvido por construção: linhas em tabelas diferentes não conflitam. Um aluno pode ter:
- 1 TrainerStudent ACTIVE com Personal A
- 1 NutritionistStudent ACTIVE com Nutricionista B
- N rows ENDED em qualquer tabela (histórico)

Caps: máx 1 ACTIVE por (aluno, vertical) — enforcement via unique pair (mesmo profissional não duplica) + app layer check antes de consumir invite ("Você já tem nutricionista ativa, encerre antes").

### Mesma pessoa como Personal E Nutricionista?

**Não suportado em v1.** UserRole é enum single-valued. Workaround: duas contas Clerk com emails distintos. Limitação documentada na FAQ do onboarding.

Headroom para v2: adicionar `User.roles UserRole[]` ou tabela UserProfession (userId, role, registry). Não está no escopo do v1 — refatorar quando demanda real surgir.

### Lifecycle

Espelha TrainerStudent. Estados: PENDING (declarado mas não usado — invites pulam direto para ACTIVE), ACTIVE, PAUSED, ENDED.

- **createNutriInviteCode**: gated em role==='NUTRICIONISTA'. Mesma 6-char nanoid, 7-day TTL.
- **consumeNutritionistInvite**: transaction (InviteCodeNutri.status='USED' + NutritionistStudent upsert handling ENDED).
- **pauseNutritionistLink / resumeNutritionistLink / endNutritionistLink**: clones de students.ts:44/53/62.

### Fanout de lifecycle

Quando `endNutritionistLink`:
- Arquiva MealPlans onde nutritionistId === ended.nutritionistId E studentId === ended.studentId.
- Revoga FollowUpFormSend pendentes do nutricionista para esse aluno (se nutri usar follow-ups — fase 7+).
- Notifica aluno com `NUTRI_LINK_ENDED` (novo type, fase polish).

Quando `endTrainerLink` (cleanup pré-existente que nunca foi feito): arquiva WorkoutPlans, aborta WorkoutLogs IN_PROGRESS. Está fora do escopo nutri; documentado como tech debt separado.

### Migração de TrainerStudent existente

**Nenhuma necessária.** TrainerStudent não muda. Linhas existentes (todas treino-side) permanecem como estão. A nova tabela NutritionistStudent começa vazia.

### Helper de contexto profissional

Novo `src/lib/actions/professional-context.ts`:

```ts
import { cache } from "react";

export const getMyProfessionals = cache(async (alunoId: string) => {
  const [trainerLink, nutriLink] = await Promise.all([
    prisma.trainerStudent.findFirst({
      where: { studentId: alunoId, status: "ACTIVE" },
      include: { trainer: true },
    }),
    prisma.nutritionistStudent.findFirst({
      where: { studentId: alunoId, status: "ACTIVE" },
      include: { nutritionist: true },
    }),
  ]);
  return {
    trainer: trainerLink?.trainer ?? null,
    nutritionist: nutriLink?.nutritionist ?? null,
    available: [
      ...(trainerLink ? ["treinos" as const] : []),
      ...(nutriLink ? ["nutricao" as const] : []),
    ],
  };
});
```

React `cache()` garante uma round-trip por render do (aluno)/layout.tsx, reusada por sub-pages.

### Autorização

Predicados:
- Treino-side: `trainerStudent.findFirst({ trainerId, studentId, status: "ACTIVE" })` — **sem mudança**.
- Nutri-side: `nutritionistStudent.findFirst({ nutritionistId, studentId, status: "ACTIVE" })` — novo padrão.

Helpers:
- `requireTrainerLink(studentId)` — wrapper do predicado existente, opcional refator para reduzir duplicação.
- `requireNutriLink(studentId)` — equivalente para nutri.

Cross-vertical reads (BodyMetric, ExamUpload): novo helper `getAlunoSharedData(alunoId, viewerId)` checa ambas as tabelas. Audita-se em phase 6 com log de acesso (LGPD).

## 9. Notificações, crons, integrações

### NotificationType — extensão

Aditivo (sem renames):
- `MEAL_PLAN_CREATED`, `MEAL_PLAN_UPDATED`
- `MEAL_REMINDER`
- `STUDENT_MEAL_LOGGED`, `STUDENT_MEAL_SKIPPED`
- `NUTRI_COMMENT`
- `NUTRI_INVITE_ACCEPTED`
- `NUTRI_FOLLOWUP_FORM_SENT`, `NUTRI_FOLLOWUP_FORM_ANSWERED`

### Notification.vertical — adicionado na fase 1

Nullable, backfilled via CASE no migration SQL. Permite:
- Filtro de inbox por vertical no NotificationBell (fase polish).
- Per-vertical mute (NotificationSettings.nutricionistActivity / mealReminder gate consultam o type → vertical).
- Dedupe correta nos crons (jsonb_set CAS pattern preservado, mas pode filtrar por vertical).

### TYPE_TO_PREF — exhaustiveness check

`src/lib/notifications/notify.ts` ganha typed assertion:

```ts
const TYPE_TO_PREF = {
  WORKOUT_REMINDER_MORNING: "morningReminder",
  MEAL_REMINDER:            "mealReminder",
  // ...
} satisfies Record<NotificationType, keyof NotificationSettings>;
```

Compile-time falha se algum NotificationType faltar mapeamento. Mata a classe de bug "silently undefined gate".

### notifyByContext — helper unificado (incorporação do Polymorphic)

Novo `src/lib/notifications/fanout.ts`:

```ts
type RecipientResolver = (studentId: string) => Promise<string[]>;

export async function notifyByContext(opts: {
  resolver: RecipientResolver;
  studentId: string;
  type: NotificationType;
  vertical: Vertical;
  title: string;
  body: string;
  data?: any;
  url?: string;
}) {
  const recipientIds = await opts.resolver(opts.studentId);
  await Promise.all(recipientIds.map(userId =>
    notifyUser({ userId, type: opts.type, vertical: opts.vertical, ...opts })
  ));
}

export const resolveMyTrainer: RecipientResolver = async (studentId) => {
  const link = await prisma.trainerStudent.findFirst({
    where: { studentId, status: "ACTIVE" },
  });
  return link ? [link.trainerId] : [];
};

export const resolveMyNutritionist: RecipientResolver = async (studentId) => {
  const link = await prisma.nutritionistStudent.findFirst({
    where: { studentId, status: "ACTIVE" },
  });
  return link ? [link.nutritionistId] : [];
};
```

Sites de chamada (workout-logs.ts:10, body-metrics.ts:55, exams.ts:50, novo meal-logs.ts) usam `notifyByContext` em vez de hardcodear a query. Reduz duplicação para ~100 LOC total em vez de 800-1200.

### Push tag namespacing

`auge-${vertical ?? 'shared'}-${type}` — evita coalescing futuro. Service worker (`src/sw-push.js` se existir, ou registrado via web-push lib) é auditado na fase 6. Para v1, novos types nutri usam tag namespaced; types treino legados mantêm `auge-${type}` para não invalidar push subscriptions ativas — backward compat.

### Crons

**Existentes — auditoria mínima:**
- `/api/cron/morning` (workout reminders, birthday): intocado em v1. Birthday continua fanout para personal apenas. Nutri-side birthday fanout é polish (fase 6+).
- `/api/cron/evening` (workout reminder evening, STREAK_BROKEN, STUDENT_INACTIVE): intocado. O latent bug do line 85 (trainerStudent.findMany sem filtro de role) NÃO dispara porque nutri usa tabela separada — o bug está dormente, não removido. Documentado como tech debt.
- `/api/cron/events`: intocado. EVENT_REMINDER_PERSONAL fica como label genérico mesmo para events criados por nutricionista (cosmético, fase polish renomeia para EVENT_REMINDER_PROFESSIONAL com vertical no data).
- `/api/cron/strava-refresh`: intocado.

**Novos:**
- `/api/cron/nutrition-morning`: meal reminders (loop alunos com NutritionistStudent ACTIVE + MealPlan ativo + NotificationSettings.mealReminder=true; fanout para cada hour em mealReminderHours).
- `/api/cron/nutrition-evening`: nutri-side STUDENT_INACTIVE (aluno sem MealLog em 3 dias → notifica nutricionista) + meal-log streak para o aluno.

**Verificação Vercel plan**: antes de fase 4, confirmar plano Pro (>2 crons). Se Hobby, refator para loop interno em /api/cron/morning aceitando query param `?vertical=nutricao`.

### NotificationSettings

Flags por vertical já adicionadas no schema. UI em `/perfil/notificacoes` ganha seção "Nutrição" com toggles para `nutricionistActivity`, `mealReminder`, e input para `mealReminderHours` (chips selecionáveis). Para nutri side, `/nutri/conta/notificacoes` mostra `studentActivity` relabeled como "Atividade dos meus alunos".

### Strava

**Permanece treino-only em v1.** Nutricionista não vê dados Strava. Schema explicitamente não permite — StravaAccount é 1:1 com User, não há predicado de visibilidade cross-vertical.

Fase 6+ (cross-vertical sharing): se produto pedir, adicionar helper `getRunningCaloriesForNutri(studentId, dateRange)` gated por `requireNutriLink`. Não é v1.

### FollowUpForms

**Treino-side intocado.** Nutricionistas usam um pipeline paralelo simplificado em v1: criam templates próprios em `/nutri/formularios` (nova tabela FollowUpFormTemplateNutri? OU reuso da tabela existente com novo predicado de autorização).

Decisão para v1: **reuso da tabela existente** com a seguinte mudança mínima em `followup-forms.ts:144` (sendFormToStudent):
- Adiciona param `vertical: Vertical`
- Predicado de autorização vira: `if (vertical === "TREINOS") requireTrainerLink(studentId); else requireNutriLink(studentId);`
- Filtro de listagem de templates: nutricionista vê apenas templates próprios (já filtra por trainerId === current.id, semanticamente OK).

Não é zero-touch mas é a única exceção ao "intocado treino-side". Justificada porque follow-up forms são a principal ferramenta de acompanhamento.

### Web Push

PushSubscription continua per-User, per-device. Sem mudança. NotificationSettings flags gating no fanout decide se push é enviado.

## 10. Plano de migração faseado

### Fase 0 — Audit + foundation (risk: low)
- Audit dos 12 call sites de TrainerStudent.findFirst documentados no LINKS MAP. Confirma que nenhum lookup escondido existe.
- Verifica plano Vercel (Hobby vs Pro) para decisão sobre cron endpoints novos.
- Cria `src/lib/auth/role-routes.ts` com ROLE_DEFAULT_ROUTE map. NUTRICIONISTA aponta inicialmente para `/onboarding` (não para `/nutri/dashboard` ainda — guard rail contra usuários NUTRICIONISTA injetados em produção pré-fase 2).
- Refator `requireRole` em `src/lib/auth-helpers.ts:21` para usar o map. Assinatura widening para `UserRole`.
- Refator `src/app/post-login/page.tsx` para usar o map.
- Feature flag `NEXT_PUBLIC_NUTRI_ENABLED=false` em .env.local.

**Deliverable**: PR1 mergeable hoje. Zero impacto visível em usuários. PERSONAL/ALUNO redirects byte-idênticos. Dependências: nenhuma.

### Fase 1 — Schema migration (risk: medium)
Migração Prisma aditiva única em `prisma/migrations/<ts>_add_nutri_vertical/migration.sql`:
1. ALTER TYPE UserRole ADD VALUE 'NUTRICIONISTA' (statement separado, fora de transação).
2. ALTER TYPE NotificationType ADD VALUE para cada um dos 9 novos values (statements separados).
3. CREATE TYPE Vertical AS ENUM.
4. CREATE TYPE NutritionistStudentStatus AS ENUM.
5. CREATE TYPE MealLogStatus, MealLogMode.
6. ALTER TABLE User ADD COLUMN crn TEXT NULL, ADD COLUMN preferredVertical Vertical NULL.
7. CREATE TABLE NutritionistStudent, InviteCodeNutri.
8. CREATE TABLE MealPlan, Meal, MealItem, FoodCatalog, MealLog, MealItemLog, HydrationLog.
9. ALTER TABLE Notification ADD COLUMN vertical Vertical NULL.
10. ALTER TABLE NotificationSettings ADD COLUMN nutricionistActivity BOOLEAN DEFAULT TRUE, mealReminder BOOLEAN DEFAULT TRUE, mealReminderHours INTEGER[] DEFAULT '{7,12,19}', hydrationReminder BOOLEAN DEFAULT FALSE.
11. Backfill: `UPDATE Notification SET vertical = CASE WHEN type::text LIKE 'MEAL_%' OR type::text LIKE 'NUTRI_%' THEN 'NUTRICAO' ELSE 'TREINOS' END WHERE vertical IS NULL`.
12. Atualiza prisma/seed.ts para opcionalmente criar 1 nutricionista de teste + 50 FoodCatalog seed (TACO público + USDA — documentar licensing em CONTRIBUTING-VERTICALS.md).

Aplicar via Supabase branch (`mcp__claude_ai_Supabase_An_malo__create_branch` + `apply_migration`), validar contra dados existentes (count TrainerStudent unchanged, User shapes unchanged), executar `get_advisors` para checar advisories, então `merge_branch`.

**Deliverable**: PR2. Staging deploy confirma zero-impacto. @prisma/client regenerado com UserRole.NUTRICIONISTA. Dependências: Fase 0.

### Fase 2 — Nutricionista pro-side (risk: medium)
- Criar `src/app/(nutricionista)/layout.tsx` clonando `(personal)/layout.tsx`. Adicionar `requireRole("NUTRICIONISTA")`, `data-vertical="nutricao"` no wrapper, items nav nutri.
- Atualiza ROLE_DEFAULT_ROUTE[NUTRICIONISTA] = "/nutri/dashboard" (substituindo o guard rail).
- Atualiza `src/app/(public)/onboarding/page.tsx` para 3 cards + branch CRN.
- Atualiza `setUserRole` em `src/lib/actions/users.ts` para aceitar opts.crn + guard rail role↔registry.
- Cria server actions em `src/lib/actions/nutri-students.ts`, `nutri-meal-plans.ts`, `nutri-foods.ts`, `nutri-invites.ts`, `nutri-meal-logs.ts` — cada um espelhando o action correspondente treino-side mas consultando NutritionistStudent/MealPlan/etc.
- Implementa `consumeInviteCode` upsert pattern (handle ENDED row → UPDATE em vez de INSERT) — fix do soft-delete bug para AMBAS as tabelas.
- Adiciona `validateInviteCode` dual-lookup (InviteCode primeiro, InviteCodeNutri segundo).
- Cria `getMyProfessionals()` em `src/lib/actions/professional-context.ts` com React cache().
- Páginas nutri-side: /nutri/dashboard, /nutri/alunos, /nutri/alunos/[id], /nutri/cardapios + CRUD, /nutri/alimentos, /nutri/conta + notificacoes.
- Componentes em `src/components/nutri/`: AlunosClient, MealPlanBuilder, FoodSelector, MealPlanCard.

**Deliverable**: PR3-7 (incremental, 2-3 rotas + actions por PR). Nutricionista pode signup, gerar invite, criar cardápio, vincular aluno via invite. Personal flow completamente intocado. Dependências: Fase 1.

### Fase 3 — Aluno toggle + vertical nutricao (risk: medium)
- Adiciona prop opcional `verticalToggle?: React.ReactNode` em `src/components/shared/AppHeader.tsx` — renderiza em rightSlot (desktop) E mobileLeftSlot (mobile) para garantir visibilidade nos dois breakpoints.
- Cria `src/components/shared/VerticalToggle.tsx` (segmented pill).
- Cria `src/lib/vertical/route-mirror.ts` com tabela de pares.
- Cria `src/lib/nav/registry.ts` com NAV_TREINO_ALUNO + NAV_NUTRI_ALUNO.
- Modifica `src/app/(aluno)/layout.tsx`:
  1. Detecta vertical do pathname (via header injection no middleware OU via client wrapper).
  2. Chama `getMyProfessionals()`.
  3. Renderiza `<div data-vertical={vertical}>`.
  4. Passa VerticalToggle ao AppHeader.
  5. Renderiza BottomNav com items correspondentes.
- Modifica `src/middleware.ts` para injetar `x-pathname` header (1 linha dentro do clerkMiddleware wrapper).
- Cria rotas nutricao aluno-side: `/nutricao/hoje`, `/nutricao/cardapio`, `/nutricao/cardapio/[id]`, `/nutricao/historico`, `/nutricao/historico/[id]`, `/nutricao/evolucao`, `/nutricao/agua`.
- Cria `/perfil/profissionais` (gerencia vínculos).
- Componentes: `CardapioView`, `MealLogClient`, `HydrationTracker`.

**Deliverable**: PR8-10. Aluno com ambas verticais vê toggle, navega corretamente, BottomNav swap funciona. Aluno com só personal NÃO vê toggle. Aluno só com nutricionista é redirecionado para /nutricao/hoje pelo /post-login (lê User.preferredVertical defaulted para NUTRICAO se único vínculo é nutri). Dependências: Fase 2.

### Fase 4 — Nutri crons + notification fanout (risk: low-medium)
- Cria `src/lib/notifications/fanout.ts` com `notifyByContext` + resolvers.
- Adiciona typed `satisfies` em TYPE_TO_PREF.
- Refatora `notifyTrainerOfStudentActivity` (workout-logs.ts:10), `body-metrics.ts:55`, `exams.ts:50` para usar `notifyByContext(resolveMyTrainer, ...)` — preserva semantics, ganha consistência.
- Novos sites de chamada nutri-side (em nutri-meal-logs.ts) usam `notifyByContext(resolveMyNutritionist, ...)`.
- Cria `/api/cron/nutrition-morning/route.ts` + `/api/cron/nutrition-evening/route.ts`.
- Atualiza `vercel.json` com novas entradas cron (gated pelo plano Vercel — se Hobby, consolidar internamente).
- Atualiza UI de `/perfil/notificacoes` e `/nutri/conta/notificacoes` com flags nutri.

**Deliverable**: PR11-12. Notificações nutri fluem corretamente. Per-vertical mute funciona. Crons disparam meal reminders + nutri-side inactivity. Dependências: Fase 3.

### Fase 5 — Theme polish (risk: low)
- Adiciona `--nutri`, `--nutri-glow`, `--nutri-hover` em `src/app/globals.css` :root/.dark e .light.
- Adiciona regra `[data-vertical="nutricao"] { --accent: var(--nutri); ... }`.
- Adiciona variant="nutri" em Card.tsx, Button.tsx, Badge.tsx.
- VerticalToggle visual usa accent atual.
- Audita componentes para ensurar que --coach (royal blue) é usado apenas em contextos "profissional fala" cross-vertical.

**Deliverable**: PR13. Vertical nutri visualmente distinta (teal accent). Personal/nutricionista pro-side mantém accents atuais. Dependências: Fase 4.

### Fase 6 — Cross-vertical data + event polish (risk: low)
- Cria `getAlunoSharedData(alunoId, viewerId)` que consulta ambas as tabelas de link.
- Surface BodyMetric history em `/nutri/alunos/[id]`.
- Adiciona log de acesso (LGPD): nova tabela `ProfessionalDataAccess` (viewerId, alunoId, dataType, viewedAt).
- Adiciona FollowUpForm pipeline para nutri (modifica `sendFormToStudent` em followup-forms.ts:144 para aceitar vertical param).
- Nutri-side birthday fanout em `/api/cron/nutrition-morning` (espelha cron/morning birthday SQL).
- Rename de label EVENT_REMINDER_PERSONAL para uso genérico (mantém enum value para retrocompat, copy reflete).

**Deliverable**: PR14-15. Nutricionista vê histórico de peso/exames do aluno (auditado). Nutri envia follow-up forms. Dependências: Fase 5.

### Fase 7 — Hardening + extensibilidade (risk: low)
- Documento `CONTRIBUTING-VERTICALS.md` com passo-a-passo para adicionar FISIO/MENTAL/SONO.
- Testes E2E críticos: signup nutricionista, vincular aluno, criar cardápio, aluno toggle, notificações nutri.
- Sentinel test: tentativa de criar 2 NutritionistStudent ACTIVE para mesmo (studentId) falha no app layer.
- Roda `mcp__claude_ai_Supabase_An_malo__get_advisors` em produção pós-deploy.
- Decide se mantém duas tabelas ou refatora para ProfessionalLink polimórfica (gate decision based em métricas reais de produção + roadmap fisio).

**Deliverable**: PR16. Runbook publicado. Dependências: Fase 6.

## 11. Inventário de arquivos a criar/modificar

### NOVOS

```
src/lib/auth/role-routes.ts
src/lib/vertical/route-mirror.ts
src/lib/vertical/VerticalContext.tsx               (opcional, se for client-side pathname)
src/lib/nav/registry.ts
src/lib/actions/professional-context.ts
src/lib/actions/nutri-students.ts
src/lib/actions/nutri-meal-plans.ts
src/lib/actions/nutri-foods.ts
src/lib/actions/nutri-invites.ts
src/lib/actions/nutri-meal-logs.ts
src/lib/actions/nutri-hydration.ts
src/lib/notifications/fanout.ts
src/components/shared/VerticalToggle.tsx
src/components/nutri/AlunosClient.tsx
src/components/nutri/MealPlanBuilder.tsx
src/components/nutri/MealEditor.tsx
src/components/nutri/FoodSelector.tsx
src/components/nutri/FoodLibrary.tsx
src/components/nutri/MealPlanCard.tsx
src/components/nutri/AlunoNutriCard.tsx
src/components/aluno/BottomNavNutricao.tsx
src/components/aluno/CardapioView.tsx
src/components/aluno/MealLogClient.tsx
src/components/aluno/RefeicaoCard.tsx
src/components/aluno/HydrationTracker.tsx
src/app/(nutricionista)/layout.tsx
src/app/(nutricionista)/nutri/dashboard/page.tsx
src/app/(nutricionista)/nutri/alunos/page.tsx
src/app/(nutricionista)/nutri/alunos/[id]/page.tsx
src/app/(nutricionista)/nutri/cardapios/page.tsx
src/app/(nutricionista)/nutri/cardapios/novo/page.tsx
src/app/(nutricionista)/nutri/cardapios/[id]/page.tsx
src/app/(nutricionista)/nutri/cardapios/[id]/editar/page.tsx
src/app/(nutricionista)/nutri/alimentos/page.tsx
src/app/(nutricionista)/nutri/eventos/page.tsx
src/app/(nutricionista)/nutri/eventos/novo/page.tsx
src/app/(nutricionista)/nutri/formularios/page.tsx
src/app/(nutricionista)/nutri/conta/page.tsx
src/app/(nutricionista)/nutri/conta/notificacoes/page.tsx
src/app/(aluno)/nutricao/hoje/page.tsx
src/app/(aluno)/nutricao/cardapio/page.tsx
src/app/(aluno)/nutricao/cardapio/[id]/page.tsx
src/app/(aluno)/nutricao/historico/page.tsx
src/app/(aluno)/nutricao/historico/[id]/page.tsx
src/app/(aluno)/nutricao/evolucao/page.tsx
src/app/(aluno)/nutricao/agua/page.tsx
src/app/(aluno)/perfil/profissionais/page.tsx
src/app/api/cron/nutrition-morning/route.ts
src/app/api/cron/nutrition-evening/route.ts
prisma/migrations/<ts>_add_nutri_vertical/migration.sql
prisma/seed-foods.ts
CONTRIBUTING-VERTICALS.md
```

### MODIFICAR

```
prisma/schema.prisma                              — adicionar enums, modelos, colunas (aditivo)
prisma/seed.ts                                    — opcional: nutri test user + amostra MealPlan
src/lib/auth-helpers.ts                           — widen requireRole, add requireNutricionista, requireNutriLink
src/lib/actions/users.ts                          — setUserRole aceita crn; add getMyNutritionist
src/lib/actions/invites.ts                        — consumeInviteCode dispatcher dual-table + upsert ENDED fix
src/lib/notifications/notify.ts                   — extend TYPE_TO_PREF (satisfies typed); refator pontual via notifyByContext
src/app/post-login/page.tsx                       — usa ROLE_DEFAULT_ROUTE + lê User.preferredVertical
src/app/(public)/onboarding/page.tsx              — 3 cards + branch CRN; validateInviteCode retorno com vertical
src/app/(aluno)/layout.tsx                        — getMyProfessionals + VerticalToggle + BottomNav swap + data-vertical
src/components/shared/AppHeader.tsx               — add prop verticalToggle?: ReactNode (renderiza em ambos breakpoints)
src/middleware.ts                                 — injeta x-pathname header (1 linha)
src/components/ui/Card.tsx                        — adicionar variant="nutri"
src/components/ui/Button.tsx                      — adicionar variant="nutri"
src/components/ui/Badge.tsx                       — adicionar variant="nutri"
src/app/globals.css                               — --nutri tokens + [data-vertical="nutricao"] override
src/lib/actions/workout-logs.ts                   — refator notifyTrainer para notifyByContext (preserva semantics)
src/lib/actions/body-metrics.ts                   — idem
src/lib/actions/exams.ts                          — idem
src/lib/actions/followup-forms.ts                 — accept vertical param; gate dispatch (fase 6)
vercel.json                                       — adicionar entradas cron nutrition-morning/evening (gated em plano Pro)
.env.local                                        — NEXT_PUBLIC_NUTRI_ENABLED feature flag
```

### NÃO MODIFICAR (load-bearing)

```
prisma/schema.prisma -> TrainerStudent, InviteCode, Event, FollowUpFormTemplate/Send/Answer/Question
src/lib/actions/workout-plans.ts                  — TrainerStudent queries intocadas
src/lib/actions/students.ts                       — getMyTrainer mantido
src/app/(personal)/**                             — todo intocado
src/app/(execucao)/**                             — todo intocado
src/app/api/cron/morning/route.ts                 — workout side intocado
src/app/api/cron/evening/route.ts                 — workout side intocado
src/app/api/cron/events/route.ts                  — intocado
src/app/api/cron/strava-refresh/route.ts          — intocado
src/app/api/webhooks/clerk/route.ts               — intocado
src/app/api/webhooks/strava/route.ts              — intocado
src/lib/integrations/strava/**                    — intocado
```

## 12. Open questions

Estas decisões são de produto/UX e precisam de definição antes de cada fase respectiva (não bloqueiam fase 0):

1. **Plano Vercel atual** — Hobby (2 crons max) ou Pro? Define se /api/cron/nutrition-* viram endpoints novos ou se consolidamos via query param no /api/cron/morning. Bloqueador da fase 4.

2. **Aluno-only nutricionista**: quando aluno não tem personal mas tem nutri, qual é a tela `/hoje` padrão? Hoje treino, ou /nutricao/hoje? Proposta: usar User.preferredVertical defaulted para a única vertical disponível. Confirmar UX.

3. **Catálogo de FoodCatalog** — quão grande é o seed inicial? 50 staples TACO, ou ingest TACO completo (~2k itens) na fase 1? Define se /nutri/alimentos precisa de fuzzy search (pg_trgm) desde o início.

4. **Conflito de invite code entre InviteCode e InviteCodeNutri** — risco de colisão nanoid é ~0.005% em 10k codes. Aceitar (lookup determinístico por order) ou unificar em uma tabela Invite com discriminador? Recomendação: aceitar em v1, monitorar.

5. **FollowUpForm para nutri**: usa pipeline existente (mudança mínima em sendFormToStudent param vertical) ou tabela paralela FollowUpFormTemplateNutri (zero risco mas mais duplicação)? Decisão impacta fase 6.

6. **Visibility de Event entre verticais**: nutricionista cria Event "Consulta de avaliação" — esse Event aparece no `/eventos` do personal vinculado ao mesmo aluno? Proposta: NÃO (Event é privado da vertical que criou). Confirmar.

7. **HydrationLog reminders**: cron envia push a cada hora em mealReminderHours, ou separado? Proposta: separado, novo NotificationType HYDRATION_REMINDER, hours configuráveis. Confirmar copy.

8. **MEAL_PLAN_CREATED notification**: deep link vai para `/nutricao/cardapio/[id]` (visualização) ou `/nutricao/hoje` (cards de hoje)? Proposta: cardapio/[id] no MEAL_PLAN_CREATED, hoje no MEAL_REMINDER. Confirmar.

9. **Aluno com dois personals históricos (ENDED)**: lista em /perfil/profissionais mostra histórico ENDED ou apenas ACTIVE? Proposta: apenas ACTIVE + accordion "Profissionais anteriores".

10. **Dual-cert profissional (CREF + CRN)**: aceitar como limitação documentada do v1 (cria duas contas Clerk) ou priorizar suporte com User.roles[]? Recomendação: aceitar limitação, planejar para v2 baseado em demanda.

11. **Theme — qual cor exata para --nutri?** Teal 56 189 168 (proposta), ou cor preferida do design system? Definir antes da fase 5.

12. **Strava data para nutri**: kcal burned é demanda imediata ou polish? Proposta: polish (fase 6+). Confirmar com early adopter nutricionistas.

13. **Migration window**: a migração da fase 1 é zero-downtime (aditiva), mas ALTER TYPE pode ter latência. Janela específica preferida (ex. madrugada) ou rolar em horário de baixo tráfego?

14. **BodyMetric quando ambos pros podem registrar**: hoje BodyMetric não tem recordedByUserId. Adicionar coluna na fase 6 ou aceitar ambiguidade? Recomendação: adicionar na fase 1 enquanto migration está aberta (1 coluna nullable, sem custo).

15. **Service worker** (`src/sw-push.js` ou registrado via web-push lib) — existe arquivo SW custom no projeto? Se sim, auditar antes de fase 4 para garantir que novos types/tags são tratados.

