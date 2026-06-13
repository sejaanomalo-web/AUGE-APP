# AUGE — Plano dos 5 ajustes (2026-06-13)

Análise por camada e plano de implementação. Tudo validado contra o código real.

## 1) Excluir plano de treino + renomear "Inativar" → "Desativar"

**Arquitetura atual:** `TreinosClient.tsx` (menu 3 pontinhos: Marcar como ativo / Pausar / Inativar / Editar conteúdo) chama `setPlanStatus`. `deletePlan` existe mas faz `prisma.workoutPlan.delete` direto — **falha se houver `WorkoutLog`** (FK `WorkoutLog→session` é Restrict, sem cascade). `INACTIVE` já some do `/hoje` do aluno (via `getActivePlanForStudent` que filtra `isActive`), mas `getMyPlans` do aluno ainda retorna inativos.

**Mudanças:**
- `deletePlan` (workout-plans.ts): tornar transacional — apaga `WorkoutLog` das sessões do plano (ExerciseLog cascateia), `PlanMetricDefinition`/valores se não cascatearem, depois `workoutPlan.delete` (sessions/sessionExercises cascateiam). Mantém checagem de permissão.
- `getMyPlans` (aluno): excluir `isActive:false` → plano desativado **some do dashboard do aluno** (/hoje e /planos). Personal continua vendo todos.
- `TreinosClient`: renomear "Inativar"→"Desativar", badge/filttro "Inativo"→"Desativado". Card com status INACTIVE renderizado em **tom apagado** (opacity reduzida). Adicionar item de menu **"Excluir plano"** (ícone lixeira, destrutivo) que abre `DeletePlanDialog`.
- Novo `DeletePlanDialog.tsx`: exige digitar **EXCLUIR** + checkbox "Estou ciente que o plano será excluído e todos os dados removidos para mim e para meu aluno"; aviso "Se quer manter os dados, use Desativar". Botão só habilita com texto exato + checkbox.

## 2) Remover travessões (—, –)

85 ocorrências em ~38 arquivos. **Visíveis** (strings/JSX): trocar por `·` (vazios e separadores) ou reescrever (intervalos `0–100`→`0 a 100`). **Comentários/logs** (não user-facing): trocar `—`/`–` por `-`.

## 3) Eventos com múltiplos alunos

**Atual:** `Event.studentId` único; `EventForm` seleciona 1 aluno; `createEvent` cria 1 evento. **Decisão:** sem migração no banco compartilhado de produção — `createEvent` passa a aceitar `studentIds[]` e cria **um evento por aluno** (cada um com seu lembrete). `EventForm`: seletor de aluno vira **multi-seleção (chips)** no modo criação; edição continua 1 aluno (cada linha = 1 aluno). Downstream (aluno/dashboard/cron) inalterado.

## 4) Validação em todos os campos (padrão brasileiro)

**Atual:** `Input` repassa props nativas; sem máscaras. Campos: altura/peso (`type=number`), nascimento (`type=date` nativo), telefone/nome/objetivo/título/local/notas (texto livre, sem limite).

**Mudanças:**
- Nova lib `src/lib/masks.ts`: `digits`, `maskCPF`, `maskDateBR` (dd/mm/aaaa), `maskPhoneBR`, `maskCEP`, `maskInt`, `maskDecimal({intDigits,decimals})`, `clampNumber`, validadores `isValidCPF`/`isValidDateBR`.
- `Input`: prop opcional `mask?: (raw)=>string` (filtra no onChange, mutando o valor antes de repassar) + **maxLength padrão alto** para tipos texto (cap automático em todo campo). `Textarea`: maxLength padrão.
- Aplicar campo a campo (todos os formulários): e-mail ≤ 50; nomes ≤ 80; títulos ≤ 100; local ≤ 120; URLs ≤ 200; observações/descrições ≤ 500–1000; telefone máscara BR; altura/peso decimais com limite (altura ≤ 250cm, peso ≤ 400kg); duração/sets/reps/kcal/macros inteiros com teto; metas numéricas. Nenhum campo aceita mais caracteres ou tipo diferente do permitido.

## 5) Splash de inicialização (sem tela branca de 1.5s)

**Atual:** entre o splash nativo e o React pintar, ~1.5s de tela branca. `--bg-base = #080A0D`, `--accent = #B7FF2A`. `/` é estático e (após ajuste anterior) servido do precache.

**Mudança:** overlay de splash **no HTML estático** do root layout (pinta instantâneo, junto do `/` cacheado) com CSS crítico **inline** (independe do CSS externo): fundo #080A0D, logo "ꓥuge" em #B7FF2A que **expande ao centro** (scale 0.7→1 + fade) com leve pulse — estilo WhatsApp/Chrome. Componente client `SplashDismiss` faz fade-out após a hidratação; animação de segurança esconde após ~4s caso o JS falhe. Cobre todo o app (root layout) e some nas navegações seguintes.

## Validação final
`prisma generate` + `npm run build` verde; `tsc` 0 erros; revisão do diff; commit + push.
