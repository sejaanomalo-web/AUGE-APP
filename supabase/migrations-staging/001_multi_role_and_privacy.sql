-- =============================================================================
-- AUGE — Migration STAGING 001: Multi-papel + Privacidade (saúde = só do dono)
-- =============================================================================
-- COMO USAR: rode este SQL no Supabase (SQL Editor) do projeto do AUGE.
-- É idempotente (IF NOT EXISTS / DROP IF EXISTS). Banco compartilhado: só toca
-- tabelas do AUGE. Pré-lançamento, sem usuários → seguro.
--
-- Depois de rodar, o schema.prisma é atualizado para refletir estas tabelas
-- (será feito no commit final; a app já foi escrita compatível).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. MULTI-PAPEL: um usuário pode ter vários papéis (ex.: personal E aluno)
-- -----------------------------------------------------------------------------
-- Hoje "User.role" guarda UM papel. Esta tabela passa a permitir N papéis por
-- usuário, sem quebrar nada (User.role continua como "papel ativo/preferido"
-- para o contexto de UI; a app decide acesso por VÍNCULO real, não pelo papel).

CREATE TABLE IF NOT EXISTS "UserRoleAssignment" (
  "userId"    text        NOT NULL,
  "role"      "UserRole"  NOT NULL,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "UserRoleAssignment_pkey"      PRIMARY KEY ("userId", "role"),
  CONSTRAINT "UserRoleAssignment_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "UserRoleAssignment_userId_idx"
  ON "UserRoleAssignment" ("userId");

-- Backfill: migra o papel único atual para a nova tabela.
INSERT INTO "UserRoleAssignment" ("userId", "role")
SELECT "id", "role" FROM "User" WHERE "role" IS NOT NULL
ON CONFLICT ("userId", "role") DO NOTHING;

-- RLS: o próprio usuário lê seus papéis; escrita é via service_role (server).
ALTER TABLE "UserRoleAssignment" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS ura_owner_select ON "UserRoleAssignment";
CREATE POLICY ura_owner_select ON "UserRoleAssignment"
  FOR SELECT TO authenticated
  USING ("userId" = (SELECT public.clerk_user_id()));

-- -----------------------------------------------------------------------------
-- 2. MULTI-PERSONAL: permissões granulares por vínculo (à prova de futuro)
-- -----------------------------------------------------------------------------
-- O aluno já pode ter N personais (TrainerStudent é M2M). Estas colunas
-- permitem, no futuro, escopo fino por vínculo. Defaults preservam o
-- comportamento atual (personal vê/edita treino).
ALTER TABLE "TrainerStudent"
  ADD COLUMN IF NOT EXISTS "canViewTraining" boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "canEditTraining" boolean NOT NULL DEFAULT true;

ALTER TABLE "NutritionistStudent"
  ADD COLUMN IF NOT EXISTS "canViewNutrition" boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "canEditNutrition" boolean NOT NULL DEFAULT true;

-- -----------------------------------------------------------------------------
-- 3. PRIVACIDADE: dados de SAÚDE são só do dono (personal NÃO vê)
-- -----------------------------------------------------------------------------
-- Decisão do dono (2026-07-24): personal vê TREINO; exames e fotos de progresso
-- são privados do aluno. Alinha a RLS (defesa secundária) à regra já aplicada
-- na aplicação. Remove a leitura do trainer nessas tabelas.

-- Exames (ExamUpload): owner-only.
DROP POLICY IF EXISTS exam_select ON "ExamUpload";
CREATE POLICY exam_select ON "ExamUpload"
  FOR SELECT TO authenticated
  USING ("studentId" = (SELECT public.clerk_user_id()));

-- OBS (decisão pendente): BodyMetric contém medidas numéricas (peso/%gordura)
-- E a foto de progresso (photoUrl). Se você quiser esconder TUDO do personal,
-- descomente o bloco abaixo. Por padrão mantemos as MEDIDAS visíveis ao
-- personal (feedback de treino) — a FOTO já será servida por bucket privado
-- + signed URL só do dono (tratado na app), então a foto não vaza pela RLS.
--
-- DROP POLICY IF EXISTS bm_select ON "BodyMetric";
-- CREATE POLICY bm_select ON "BodyMetric"
--   FOR SELECT TO authenticated
--   USING ("studentId" = (SELECT public.clerk_user_id()));

-- -----------------------------------------------------------------------------
-- 4. SMOKE TEST
-- -----------------------------------------------------------------------------
-- SELECT COUNT(*) FROM "UserRoleAssignment";           -- deve ≥ nº de users com role
-- SELECT relname, relrowsecurity FROM pg_class
--   WHERE relname = 'UserRoleAssignment';              -- relrowsecurity = true
-- SELECT policyname, cmd FROM pg_policies
--   WHERE tablename = 'ExamUpload';                    -- exam_select owner-only
