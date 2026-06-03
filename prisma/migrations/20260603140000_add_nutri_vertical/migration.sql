-- Round 4: vertical de Nutrição
-- Schema 100% aditivo. Ver PLANO-NUTRICAO-VERTICAL.md secao 2 (Modelo de dados) e secao 10 (Fase 1).
-- Postgres 12+ permite ALTER TYPE ADD VALUE dentro de transacao desde que o novo valor NAO seja
-- usado na mesma transacao. Aqui nenhum statement usa os novos enum values (backfill abaixo usa
-- type::text LIKE), entao a migration roda inteira em um unico transaction block do Prisma.

-- ============ Enums modificados ============
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'NUTRICIONISTA';

ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'MEAL_PLAN_CREATED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'MEAL_PLAN_UPDATED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'MEAL_REMINDER';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'STUDENT_MEAL_LOGGED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'STUDENT_MEAL_SKIPPED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'NUTRI_COMMENT';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'NUTRI_INVITE_ACCEPTED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'NUTRI_FOLLOWUP_FORM_SENT';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'NUTRI_FOLLOWUP_FORM_ANSWERED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'HYDRATION_REMINDER';

-- ============ Enums novos ============
DO $$ BEGIN
  CREATE TYPE "Vertical" AS ENUM ('TREINOS', 'NUTRICAO', 'FISIO', 'MENTAL', 'SONO');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "NutritionistStudentStatus" AS ENUM ('PENDING', 'ACTIVE', 'PAUSED', 'ENDED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "MealLogStatus" AS ENUM ('PENDING', 'LOGGED', 'SKIPPED', 'PARTIAL');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "MealLogMode" AS ENUM ('GUIDED', 'FREE');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============ User: crn + preferredVertical ============
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "crn" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "preferredVertical" "Vertical";

-- ============ Notification: coluna vertical + backfill ============
ALTER TABLE "Notification" ADD COLUMN IF NOT EXISTS "vertical" "Vertical";

UPDATE "Notification"
SET "vertical" = 'NUTRICAO'
WHERE "vertical" IS NULL
  AND ("type"::text LIKE 'MEAL_%' OR "type"::text LIKE 'NUTRI_%' OR "type"::text = 'HYDRATION_REMINDER');

UPDATE "Notification"
SET "vertical" = 'TREINOS'
WHERE "vertical" IS NULL;

-- ============ NotificationSettings: flags nutri ============
ALTER TABLE "NotificationSettings" ADD COLUMN IF NOT EXISTS "nutricionistActivity" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "NotificationSettings" ADD COLUMN IF NOT EXISTS "mealReminder"         BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "NotificationSettings" ADD COLUMN IF NOT EXISTS "mealReminderHours"    INTEGER[] NOT NULL DEFAULT ARRAY[7, 12, 19];
ALTER TABLE "NotificationSettings" ADD COLUMN IF NOT EXISTS "hydrationReminder"    BOOLEAN NOT NULL DEFAULT false;

-- ============ NutritionistStudent (paralela a TrainerStudent) ============
CREATE TABLE IF NOT EXISTS "NutritionistStudent" (
    "id"             TEXT NOT NULL,
    "nutritionistId" TEXT NOT NULL,
    "studentId"      TEXT NOT NULL,
    "status"         "NutritionistStudentStatus" NOT NULL DEFAULT 'ACTIVE',
    "inviteId"       TEXT,
    "startedAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt"        TIMESTAMP(3),
    CONSTRAINT "NutritionistStudent_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "NutritionistStudent_nutritionistId_studentId_key" ON "NutritionistStudent"("nutritionistId", "studentId");
CREATE INDEX IF NOT EXISTS "NutritionistStudent_nutritionistId_status_idx" ON "NutritionistStudent"("nutritionistId", "status");
CREATE INDEX IF NOT EXISTS "NutritionistStudent_studentId_status_idx"      ON "NutritionistStudent"("studentId", "status");

DO $$ BEGIN
  ALTER TABLE "NutritionistStudent" ADD CONSTRAINT "NutritionistStudent_nutritionistId_fkey"
    FOREIGN KEY ("nutritionistId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "NutritionistStudent" ADD CONSTRAINT "NutritionistStudent_studentId_fkey"
    FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============ InviteCodeNutri (paralela a InviteCode) ============
CREATE TABLE IF NOT EXISTS "InviteCodeNutri" (
    "id"             TEXT NOT NULL,
    "code"           TEXT NOT NULL,
    "nutritionistId" TEXT NOT NULL,
    "status"         "InviteStatus" NOT NULL DEFAULT 'ACTIVE',
    "usedById"       TEXT,
    "expiresAt"      TIMESTAMP(3) NOT NULL,
    "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usedAt"         TIMESTAMP(3),
    CONSTRAINT "InviteCodeNutri_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "InviteCodeNutri_code_key"             ON "InviteCodeNutri"("code");
CREATE INDEX IF NOT EXISTS        "InviteCodeNutri_code_idx"             ON "InviteCodeNutri"("code");
CREATE INDEX IF NOT EXISTS        "InviteCodeNutri_nutritionistId_idx"   ON "InviteCodeNutri"("nutritionistId");

DO $$ BEGIN
  ALTER TABLE "InviteCodeNutri" ADD CONSTRAINT "InviteCodeNutri_nutritionistId_fkey"
    FOREIGN KEY ("nutritionistId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "InviteCodeNutri" ADD CONSTRAINT "InviteCodeNutri_usedById_fkey"
    FOREIGN KEY ("usedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============ MealPlan / Meal / MealItem / FoodCatalog / MealLog / MealItemLog / HydrationLog ============

CREATE TABLE IF NOT EXISTS "MealPlan" (
    "id"             TEXT NOT NULL,
    "nutritionistId" TEXT,
    "studentId"      TEXT NOT NULL,
    "name"           TEXT NOT NULL,
    "description"    TEXT,
    "startDate"      TIMESTAMP(3) NOT NULL,
    "endDate"        TIMESTAMP(3),
    "isActive"       BOOLEAN NOT NULL DEFAULT true,
    "pausedAt"       TIMESTAMP(3),
    "targetCalories" INTEGER,
    "targetProteinG" INTEGER,
    "targetCarbsG"   INTEGER,
    "targetFatG"     INTEGER,
    "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"      TIMESTAMP(3) NOT NULL,
    CONSTRAINT "MealPlan_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "MealPlan_studentId_isActive_idx" ON "MealPlan"("studentId", "isActive");
CREATE INDEX IF NOT EXISTS "MealPlan_nutritionistId_idx"     ON "MealPlan"("nutritionistId");

DO $$ BEGIN
  ALTER TABLE "MealPlan" ADD CONSTRAINT "MealPlan_nutritionistId_fkey"
    FOREIGN KEY ("nutritionistId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "MealPlan" ADD CONSTRAINT "MealPlan_studentId_fkey"
    FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "Meal" (
    "id"        TEXT NOT NULL,
    "planId"    TEXT NOT NULL,
    "name"      TEXT NOT NULL,
    "timeOfDay" TEXT,
    "dayOfWeek" INTEGER,
    "order"     INTEGER NOT NULL,
    "notes"     TEXT,
    CONSTRAINT "Meal_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "Meal_planId_idx" ON "Meal"("planId");

DO $$ BEGIN
  ALTER TABLE "Meal" ADD CONSTRAINT "Meal_planId_fkey"
    FOREIGN KEY ("planId") REFERENCES "MealPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "FoodCatalog" (
    "id"             TEXT NOT NULL,
    "name"           TEXT NOT NULL,
    "brand"          TEXT,
    "isCustom"       BOOLEAN NOT NULL DEFAULT false,
    "createdById"    TEXT,
    "source"         TEXT NOT NULL,
    "kcalPer100g"    DOUBLE PRECISION NOT NULL,
    "proteinPer100g" DOUBLE PRECISION NOT NULL,
    "carbsPer100g"   DOUBLE PRECISION NOT NULL,
    "fatPer100g"     DOUBLE PRECISION NOT NULL,
    "fiberPer100g"   DOUBLE PRECISION,
    CONSTRAINT "FoodCatalog_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "FoodCatalog_name_idx"        ON "FoodCatalog"("name");
CREATE INDEX IF NOT EXISTS "FoodCatalog_createdById_idx" ON "FoodCatalog"("createdById");

DO $$ BEGIN
  ALTER TABLE "FoodCatalog" ADD CONSTRAINT "FoodCatalog_createdById_fkey"
    FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- pg_trgm: busca fuzzy "arroz" -> "Arroz, branco, cozido"
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS "FoodCatalog_name_trgm_idx" ON "FoodCatalog" USING GIN ("name" gin_trgm_ops);

CREATE TABLE IF NOT EXISTS "MealItem" (
    "id"       TEXT NOT NULL,
    "mealId"   TEXT NOT NULL,
    "foodId"   TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unit"     TEXT NOT NULL,
    "notes"    TEXT,
    "order"    INTEGER NOT NULL,
    CONSTRAINT "MealItem_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "MealItem_mealId_idx" ON "MealItem"("mealId");
CREATE INDEX IF NOT EXISTS "MealItem_foodId_idx" ON "MealItem"("foodId");

DO $$ BEGIN
  ALTER TABLE "MealItem" ADD CONSTRAINT "MealItem_mealId_fkey"
    FOREIGN KEY ("mealId") REFERENCES "Meal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "MealItem" ADD CONSTRAINT "MealItem_foodId_fkey"
    FOREIGN KEY ("foodId") REFERENCES "FoodCatalog"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "MealLog" (
    "id"           TEXT NOT NULL,
    "mealId"       TEXT NOT NULL,
    "studentId"    TEXT NOT NULL,
    "date"         DATE NOT NULL,
    "startedAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt"   TIMESTAMP(3),
    "status"       "MealLogStatus" NOT NULL DEFAULT 'PENDING',
    "mode"         "MealLogMode" NOT NULL DEFAULT 'GUIDED',
    "notes"        TEXT,
    "studentNotes" TEXT,
    "photoKey"     TEXT,
    CONSTRAINT "MealLog_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "MealLog_studentId_date_idx" ON "MealLog"("studentId", "date");
CREATE INDEX IF NOT EXISTS "MealLog_mealId_date_idx"    ON "MealLog"("mealId", "date");

DO $$ BEGIN
  ALTER TABLE "MealLog" ADD CONSTRAINT "MealLog_mealId_fkey"
    FOREIGN KEY ("mealId") REFERENCES "Meal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "MealLog" ADD CONSTRAINT "MealLog_studentId_fkey"
    FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "MealItemLog" (
    "id"            TEXT NOT NULL,
    "mealLogId"     TEXT NOT NULL,
    "foodId"        TEXT NOT NULL,
    "grams"         DOUBLE PRECISION,
    "consumed"      BOOLEAN NOT NULL,
    "skipped"       BOOLEAN NOT NULL DEFAULT false,
    "skippedReason" TEXT,
    "loggedAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MealItemLog_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "MealItemLog_mealLogId_idx" ON "MealItemLog"("mealLogId");

DO $$ BEGIN
  ALTER TABLE "MealItemLog" ADD CONSTRAINT "MealItemLog_mealLogId_fkey"
    FOREIGN KEY ("mealLogId") REFERENCES "MealLog"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "MealItemLog" ADD CONSTRAINT "MealItemLog_foodId_fkey"
    FOREIGN KEY ("foodId") REFERENCES "FoodCatalog"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "HydrationLog" (
    "id"        TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "date"      DATE NOT NULL,
    "ml"        INTEGER NOT NULL,
    "source"    TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "HydrationLog_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "HydrationLog_studentId_date_idx" ON "HydrationLog"("studentId", "date");

DO $$ BEGIN
  ALTER TABLE "HydrationLog" ADD CONSTRAINT "HydrationLog_studentId_fkey"
    FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
