-- Paused-state column for WorkoutPlan.
-- A plan is considered paused when pausedAt is non-null AND isActive is
-- still true. isActive=false means inactive/retired; the two states are
-- intentionally separate so we don't lose history on resume.
ALTER TABLE "WorkoutPlan" ADD COLUMN "pausedAt" TIMESTAMP(3);
