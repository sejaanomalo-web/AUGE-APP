# Adicionando uma nova vertical

Este guia descreve como introduzir uma nova vertical (ex: `FISIO`, `MENTAL`,
`SONO`) no AUGE-APP seguindo o mesmo padrão usado por **Treinos** (vertical
original) e **Nutrição** (PR de referência: vertical-nutricao). A arquitetura
escolhida é **parallel namespace**: cada vertical tem suas próprias tabelas
de link, models de domínio, route group e shell de UI.

Tempo estimado: **2-4 semanas** para um engenheiro full-stack, dependendo da
profundidade do MVP. A maior parte do trabalho é UI; os ganchos arquiteturais
ficam todos prontos no padrão atual.

---

## 1. Schema (Prisma)

Toda mudança é aditiva. NÃO rename existing models.

### 1.1 Enum `UserRole`

Adicione o novo role profissional:

```prisma
enum UserRole {
  PERSONAL
  ALUNO
  NUTRICIONISTA
  FISIOTERAPEUTA   // NOVO
}
```

`Record<UserRole, string>` em [src/lib/auth/role-routes.ts](src/lib/auth/role-routes.ts)
vai exigir uma nova entrada no compile-time — adicione-a:

```ts
export const ROLE_DEFAULT_ROUTE: Record<UserRole, string> = {
  PERSONAL: "/dashboard",
  ALUNO: "/hoje",
  NUTRICIONISTA: "/nutri/dashboard",
  FISIOTERAPEUTA: "/fisio/dashboard",   // NOVO
};
```

### 1.2 Enum `Vertical`

Já reservamos `FISIO`, `MENTAL`, `SONO` — basta começar a usar. Se precisar
de outras, adicione-as no enum em [prisma/schema.prisma](prisma/schema.prisma).

### 1.3 Enum `NotificationType`

Adicione novos tipos pra essa vertical:

```prisma
enum NotificationType {
  // ... existentes ...

  // Fisio
  EXERCISE_PROGRAM_CREATED
  EXERCISE_PROGRAM_UPDATED
  STUDENT_EXERCISE_LOGGED
  FISIO_COMMENT
  FISIO_INVITE_ACCEPTED
}
```

E mapeie no `TYPE_TO_PREF` em [src/lib/notifications/notify.ts](src/lib/notifications/notify.ts).

### 1.4 Tabelas de link e domínio

Crie tabelas paralelas seguindo o padrão `NutritionistStudent` + `InviteCodeNutri`:

```prisma
model FisioterapeutaStudent { /* nutricionistStudent paralelo */ }
model InviteCodeFisio       { /* InviteCodeNutri paralelo */ }
```

E as tabelas de domínio (ex: `ExerciseProgram`, `Exercise`, `ExerciseLog`).
**Não compartilhe `Exercise` com a vertical de treinos** — domínios são
disjuntos por design.

### 1.5 `User`

Adicione registro profissional (se aplicável):

```prisma
model User {
  // ...
  crefito String?   // Conselho de Fisioterapia
}
```

### 1.6 Migração

Crie uma migration aditiva em `prisma/migrations/<ts>_add_fisio_vertical/migration.sql`
seguindo o template de [prisma/migrations/20260603140000_add_nutri_vertical/migration.sql](prisma/migrations/20260603140000_add_nutri_vertical/migration.sql):

- `ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'FISIOTERAPEUTA';`
- `ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS ...` para cada novo type
- `CREATE TABLE` para cada novo model
- Backfill seguro em colunas opcionais

Aplicar via Supabase SQL Editor **antes** do push, pra evitar janela de erro
quando a Vercel rebuildar.

---

## 2. Auth

Adicione um helper de açúcar em [src/lib/auth-helpers.ts](src/lib/auth-helpers.ts):

```ts
export function requireFisioterapeuta() {
  return requireRole("FISIOTERAPEUTA");
}
```

E (opcional) um predicado de autorização pra links:

```ts
async function requireFisioLink(studentId: string, userId: string) {
  const link = await prisma.fisioterapeutaStudent.findFirst({
    where: { fisioterapeutaId: userId, studentId, status: "ACTIVE" },
  });
  if (!link) throw new Error("Sem vínculo ativo com este aluno.");
  return link;
}
```

`setUserRole` em [src/lib/actions/users.ts](src/lib/actions/users.ts) precisa aceitar
o novo registro:

```ts
setUserRole(role, opts?: { cref?, crn?, crefito?, inviteCode? })
```

Com guards de cross-pollination — ex: `FISIOTERAPEUTA` rejeita `cref`/`crn`.

---

## 3. Rotas e shell

### 3.1 Route group

Crie `src/app/(fisioterapeuta)/` espelhando `(nutricionista)`:

```
src/app/(fisioterapeuta)/
  layout.tsx                                     # requireRole + shell wrapper
  fisio/
    dashboard/page.tsx
    alunos/page.tsx
    alunos/[id]/page.tsx
    programas/page.tsx, /novo/page.tsx, /[id]/page.tsx
    exercicios/page.tsx
    conta/page.tsx, /notificacoes/page.tsx
```

### 3.2 Shell

Crie `src/components/fisio/FisioShell.tsx` clone do
[src/components/nutri/NutricionistaShell.tsx](src/components/nutri/NutricionistaShell.tsx).
Items nav próprios pro domínio.

### 3.3 Lado aluno

Crie `/nutricao/*`-equivalente sob `(aluno)/fisio/*`:

```
src/app/(aluno)/fisio/hoje/page.tsx
src/app/(aluno)/fisio/programas/page.tsx, /[id]/page.tsx
src/app/(aluno)/fisio/historico/page.tsx
src/app/(aluno)/fisio/evolucao/page.tsx
```

### 3.4 Registry de nav

Adicione em [src/lib/nav/registry.ts](src/lib/nav/registry.ts):

```ts
export const NAV_ALUNO_FISIO: NavItem[] = [
  { href: "/fisio/programas", label: "Programas", icon: Activity },
  { href: "/fisio/historico", label: "Histórico", icon: History },
  { href: "/fisio/hoje",      label: "Hoje",      icon: Target },
  { href: "/fisio/evolucao",  label: "Evolução",  icon: TrendingUp },
  { href: "/perfil",          label: "Perfil",    icon: User },
];
```

### 3.5 Route mirror

Adicione em [src/lib/vertical/route-mirror.ts](src/lib/vertical/route-mirror.ts):

```ts
export const ROUTE_PAIRS = [
  // existentes...
  { treino: "/hoje", fisio: "/fisio/hoje" },        // NOVO
  { treino: "/planos", fisio: "/fisio/programas" }, // NOVO
];
```

E atualize `mirrorRoute` pra fazer dispatch entre 3 verticais (refactor leve
da função: aceita target arbitrário, busca pair com chave correspondente).

### 3.6 Top toggle

Em [src/components/shared/VerticalToggle.tsx](src/components/shared/VerticalToggle.tsx),
adicione o terceiro segmento no array que renderiza tabs. Considere também
mudar o layout pra accordion/dropdown se a UX começar a ficar apertada com
4+ verticais.

---

## 4. Onboarding

Em [src/app/(public)/onboarding/page.tsx](src/app/(public)/onboarding/page.tsx):

- Adicionar 4º card no grid (`md:grid-cols-4`).
- Branch novo na step `details` pra input CREFITO.
- `validateInviteCode` em [src/lib/actions/invites.ts](src/lib/actions/invites.ts)
  precisa de mais um lookup em `InviteCodeFisio` (linear scan acceptable em v1).

---

## 5. Notificações + crons

### 5.1 NotificationSettings

Adicione flags em [prisma/schema.prisma](prisma/schema.prisma):

```prisma
model NotificationSettings {
  // ...
  fisioterapeutaActivity Boolean @default(true)
  exerciseReminder       Boolean @default(true)
}
```

Mapeie no `TYPE_TO_PREF` em
[src/lib/notifications/notify.ts](src/lib/notifications/notify.ts).

### 5.2 Crons

No plano Vercel **Hobby** (cap de 2 crons), crons novos vão pelo GitHub
Actions seguindo o padrão de
[.github/workflows/cron-nutrition-meal-reminder.yml](.github/workflows/cron-nutrition-meal-reminder.yml).

- `/api/cron/fisio-exercise-reminder` — schedule horário
- `/api/cron/fisio-evening` — daily 22 UTC

---

## 6. Visibility cross-vertical

Domínio **fica isolado** por design — o fisioterapeuta NÃO acessa MealLogs
nem WorkoutPlans. Se precisar de dados compartilhados (ex: BodyMetric, exames),
crie um helper em
[src/lib/actions/professional-context.ts](src/lib/actions/professional-context.ts)
ou similar, gated por algum predicate de vínculo ativo (treino OU nutri OU
fisio).

Adicione log de acesso (LGPD) em uma nova tabela
`ProfessionalDataAccess` antes de surface dados cross-vertical, especialmente
exames e fotos.

---

## 7. Estilo e tema

Adicione token de cor em [src/app/globals.css](src/app/globals.css):

```css
:root, .dark {
  --fisio: <r> <g> <b>;
  --fisio-hover: ...;
  --fisio-glow: rgba(<r>, <g>, <b>, 0.22);
}

[data-vertical="fisio"] {
  --accent: var(--fisio);
  --accent-hover: var(--fisio-hover);
  --accent-glow: var(--fisio-glow);
}
```

Cascadeia automaticamente em todos componentes que usam `bg-accent`,
`text-accent`, `.pulse-line`, `focus ring`, `BottomNav active`. Sem mexer em
componente algum.

---

## 8. Checklist final

Antes de mergear PRs:

- [ ] Schema + migration aplicada no Supabase prod **antes** de pushar código
- [ ] `Record<UserRole, string>` em role-routes.ts contempla o novo role
- [ ] TYPE_TO_PREF em notify.ts mapeia todos novos NotificationTypes
- [ ] Layout do route group novo chama `requireRole(...)` e seta
      `data-vertical="..."`
- [ ] BottomNav swap por vertical em `(aluno)/layout.tsx` cobre a nova
- [ ] VerticalToggle renderiza o segmento da nova vertical
- [ ] Onboarding tem o card + branch CRefito (ou registro equivalente)
- [ ] Soft-delete fix (upsert ENDED → ACTIVE) replicado nos `consume*Invite`
- [ ] Pelo menos 1 cron novo (GH Actions) + secret CRON_SECRET reusado
- [ ] Tema CSS `--<vertical>` adicionado em `:root, .dark` e `.light`

Estimativa pra cumprir o checklist completo: **2-4 semanas** (1 eng full-stack).
Compressível pra 1-2 semanas se MVP for limitado a pro-side + visualização aluno-side
sem registro/cron.

---

## Referências

- [PLANO-NUTRICAO-VERTICAL.md](PLANO-NUTRICAO-VERTICAL.md) — design completo da vertical de nutrição
- [prisma/migrations/20260603140000_add_nutri_vertical/migration.sql](prisma/migrations/20260603140000_add_nutri_vertical/migration.sql) — template de migration
- [src/components/nutri/NutricionistaShell.tsx](src/components/nutri/NutricionistaShell.tsx) — template de shell
- [src/lib/actions/nutri-invites.ts](src/lib/actions/nutri-invites.ts) — template de actions de invite
- [src/app/api/cron/nutrition-meal-reminder/route.ts](src/app/api/cron/nutrition-meal-reminder/route.ts) + [.github/workflows/cron-nutrition-meal-reminder.yml](.github/workflows/cron-nutrition-meal-reminder.yml) — template de cron via GitHub Actions
