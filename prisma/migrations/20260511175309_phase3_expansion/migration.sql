-- CreateEnum
CREATE TYPE "WorkoutMode" AS ENUM ('GUIDED', 'FREE');

-- DropForeignKey
ALTER TABLE "WorkoutPlan" DROP CONSTRAINT "WorkoutPlan_trainerId_fkey";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "currentWeight" DOUBLE PRECISION,
ADD COLUMN     "sportsPracticed" JSONB;

-- AlterTable
ALTER TABLE "WorkoutLog" ADD COLUMN     "mode" "WorkoutMode" NOT NULL DEFAULT 'GUIDED',
ADD COLUMN     "studentNotes" TEXT;

-- AlterTable
ALTER TABLE "WorkoutPlan" ALTER COLUMN "trainerId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "PlanMetricDefinition" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "unit" TEXT,
    "requiresAttachment" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlanMetricDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlanMetricLog" (
    "id" TEXT NOT NULL,
    "definitionId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "attachmentKey" TEXT,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlanMetricLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PlanMetricDefinition_planId_idx" ON "PlanMetricDefinition"("planId");

-- CreateIndex
CREATE INDEX "PlanMetricLog_definitionId_idx" ON "PlanMetricLog"("definitionId");

-- CreateIndex
CREATE INDEX "PlanMetricLog_studentId_idx" ON "PlanMetricLog"("studentId");

-- AddForeignKey
ALTER TABLE "WorkoutPlan" ADD CONSTRAINT "WorkoutPlan_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkoutPlan" ADD CONSTRAINT "WorkoutPlan_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanMetricDefinition" ADD CONSTRAINT "PlanMetricDefinition_planId_fkey" FOREIGN KEY ("planId") REFERENCES "WorkoutPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanMetricLog" ADD CONSTRAINT "PlanMetricLog_definitionId_fkey" FOREIGN KEY ("definitionId") REFERENCES "PlanMetricDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanMetricLog" ADD CONSTRAINT "PlanMetricLog_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
