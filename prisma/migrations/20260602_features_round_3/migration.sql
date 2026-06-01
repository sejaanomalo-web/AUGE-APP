-- Round 3: exercise_category + followup_form + events_tab + strava

-- ============ ENUM NotificationType new values ============
-- IF NOT EXISTS deixa idempotente; nenhuma DDL abaixo usa esses valores no mesmo trx.
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'FOLLOWUP_FORM_SENT';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'FOLLOWUP_FORM_ANSWERED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'EVENT_REMINDER_PERSONAL';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'EVENT_REMINDER_STUDENT';

-- ============ ENUMs novos ============
CREATE TYPE "ExerciseCategory" AS ENUM ('ACADEMIA', 'CORRIDA');
CREATE TYPE "FollowUpQuestionType" AS ENUM ('TEXT', 'TEXTAREA', 'RATING_1_5', 'YES_NO', 'NUMBER');
CREATE TYPE "FollowUpFormStatus" AS ENUM ('PENDING', 'ANSWERED', 'EXPIRED', 'REVOKED');
CREATE TYPE "EventType" AS ENUM ('RUN_RACE', 'COMPETITION', 'ONE_OFF_SESSION', 'EVALUATION', 'OTHER');

-- ============ Exercise.category ============
ALTER TABLE "Exercise" ADD COLUMN "category" "ExerciseCategory" NOT NULL DEFAULT 'ACADEMIA';
CREATE INDEX "Exercise_category_idx" ON "Exercise"("category");

-- Backfill cirúrgico (regra estreita por nome — confirmar com produto se houver outros casos)
UPDATE "Exercise" SET "category" = 'CORRIDA'
WHERE name ILIKE '%corrida%' OR name ILIKE '%esteira%';

-- ============ RunningSession dedupe com Strava ============
ALTER TABLE "RunningSession" ADD COLUMN "source" TEXT NOT NULL DEFAULT 'manual';
ALTER TABLE "RunningSession" ADD COLUMN "externalId" TEXT;
CREATE UNIQUE INDEX "RunningSession_studentId_externalId_key"
  ON "RunningSession"("studentId", "externalId");

-- ============ FollowUp tables ============
CREATE TABLE "FollowUpFormTemplate" (
  "id"          TEXT NOT NULL PRIMARY KEY,
  "trainerId"   TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "name"        TEXT NOT NULL,
  "description" TEXT,
  "isArchived"  BOOLEAN NOT NULL DEFAULT false,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL
);
CREATE INDEX "FollowUpFormTemplate_trainerId_idx" ON "FollowUpFormTemplate"("trainerId");

CREATE TABLE "FollowUpFormQuestion" (
  "id"         TEXT NOT NULL PRIMARY KEY,
  "templateId" TEXT NOT NULL REFERENCES "FollowUpFormTemplate"("id") ON DELETE CASCADE,
  "order"      INTEGER NOT NULL DEFAULT 0,
  "label"      TEXT NOT NULL,
  "type"       "FollowUpQuestionType" NOT NULL,
  "required"   BOOLEAN NOT NULL DEFAULT true
);
CREATE INDEX "FollowUpFormQuestion_templateId_idx" ON "FollowUpFormQuestion"("templateId");

CREATE TABLE "FollowUpFormSend" (
  "id"         TEXT NOT NULL PRIMARY KEY,
  "templateId" TEXT NOT NULL REFERENCES "FollowUpFormTemplate"("id") ON DELETE CASCADE,
  "trainerId"  TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "studentId"  TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "token"      TEXT NOT NULL UNIQUE,
  "status"     "FollowUpFormStatus" NOT NULL DEFAULT 'PENDING',
  "expiresAt"  TIMESTAMP(3) NOT NULL,
  "sentAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "answeredAt" TIMESTAMP(3)
);
CREATE INDEX "FollowUpFormSend_trainerId_idx" ON "FollowUpFormSend"("trainerId");
CREATE INDEX "FollowUpFormSend_studentId_idx" ON "FollowUpFormSend"("studentId");
CREATE INDEX "FollowUpFormSend_token_idx"     ON "FollowUpFormSend"("token");

CREATE TABLE "FollowUpFormAnswer" (
  "id"          TEXT NOT NULL PRIMARY KEY,
  "sendId"      TEXT NOT NULL REFERENCES "FollowUpFormSend"("id") ON DELETE CASCADE,
  "questionId"  TEXT NOT NULL REFERENCES "FollowUpFormQuestion"("id"),
  "valueText"   TEXT,
  "valueNumber" DOUBLE PRECISION,
  "valueBool"   BOOLEAN,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "FollowUpFormAnswer_sendId_idx" ON "FollowUpFormAnswer"("sendId");

-- ============ Event ============
CREATE TABLE "Event" (
  "id"              TEXT NOT NULL PRIMARY KEY,
  "trainerId"       TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "studentId"       TEXT          REFERENCES "User"("id") ON DELETE SET NULL,
  "title"           TEXT NOT NULL,
  "type"            "EventType" NOT NULL DEFAULT 'OTHER',
  "startsAt"        TIMESTAMP(3) NOT NULL,
  "durationMinutes" INTEGER,
  "location"        TEXT,
  "locationUrl"     TEXT,
  "notes"           TEXT,
  "remindersHours"  INTEGER[] NOT NULL DEFAULT ARRAY[24, 2]::INTEGER[],
  "remindersFired"  JSONB NOT NULL DEFAULT '{}'::jsonb,
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"       TIMESTAMP(3) NOT NULL
);
CREATE INDEX "Event_trainerId_startsAt_idx" ON "Event"("trainerId", "startsAt");
CREATE INDEX "Event_studentId_startsAt_idx" ON "Event"("studentId", "startsAt");

-- ============ Strava ============
CREATE TABLE "StravaAccount" (
  "id"              TEXT NOT NULL PRIMARY KEY,
  "userId"          TEXT NOT NULL UNIQUE REFERENCES "User"("id") ON DELETE CASCADE,
  "stravaAthleteId" BIGINT NOT NULL UNIQUE,
  "accessToken"     TEXT NOT NULL,
  "refreshToken"    TEXT NOT NULL,
  "expiresAt"       TIMESTAMP(3) NOT NULL,
  "scope"           TEXT NOT NULL,
  "firstName"       TEXT,
  "lastName"        TEXT,
  "profileImageUrl" TEXT,
  "lastSyncAt"      TIMESTAMP(3),
  "connectedAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"       TIMESTAMP(3) NOT NULL
);
CREATE INDEX "StravaAccount_stravaAthleteId_idx" ON "StravaAccount"("stravaAthleteId");

CREATE TABLE "StravaActivity" (
  "id"                 TEXT NOT NULL PRIMARY KEY,
  "studentId"          TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "stravaActivityId"   BIGINT NOT NULL UNIQUE,
  "type"               TEXT NOT NULL,
  "name"               TEXT NOT NULL,
  "distanceMeters"     DOUBLE PRECISION NOT NULL,
  "movingTimeSeconds"  INTEGER NOT NULL,
  "elapsedTimeSeconds" INTEGER NOT NULL,
  "startDate"          TIMESTAMP(3) NOT NULL,
  "averageHeartrate"   DOUBLE PRECISION,
  "maxHeartrate"       DOUBLE PRECISION,
  "averageSpeed"       DOUBLE PRECISION,
  "totalElevationGain" DOUBLE PRECISION,
  "calories"           DOUBLE PRECISION,
  "polyline"           TEXT,
  "raw"                JSONB NOT NULL,
  "createdAt"          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"          TIMESTAMP(3) NOT NULL
);
CREATE INDEX "StravaActivity_studentId_startDate_idx" ON "StravaActivity"("studentId", "startDate");
CREATE INDEX "StravaActivity_type_idx"                 ON "StravaActivity"("type");
