-- CreateEnum
CREATE TYPE "GoalMetric" AS ENUM ('WORKOUT_COUNT', 'DISTANCE_KM');

-- CreateEnum
CREATE TYPE "GoalPeriod" AS ENUM ('WEEK', 'MONTH', 'YEAR');

-- CreateTable
CREATE TABLE "Goal" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "sport" TEXT NOT NULL,
    "metric" "GoalMetric" NOT NULL,
    "target" DOUBLE PRECISION NOT NULL,
    "period" "GoalPeriod" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Goal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Goal_studentId_idx" ON "Goal"("studentId");

-- AddForeignKey
ALTER TABLE "Goal" ADD CONSTRAINT "Goal_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RLS — sem policies = bloqueado pra anon/authenticated. Só service_role
-- acessa, que é exatamente o que o Prisma usa via DATABASE_URL.
ALTER TABLE "Goal" ENABLE ROW LEVEL SECURITY;
