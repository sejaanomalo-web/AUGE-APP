-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('WORKOUT_PLAN_CREATED', 'WORKOUT_PLAN_UPDATED', 'WORKOUT_EXERCISE_UPDATED', 'WORKOUT_SCHEDULE_UPDATED', 'WORKOUT_REMINDER_MORNING', 'WORKOUT_REMINDER_EVENING', 'STREAK_BROKEN', 'EXAM_RECEIVED', 'TRAINER_COMMENT', 'STUDENT_WORKOUT_STARTED', 'STUDENT_WORKOUT_FINISHED', 'STUDENT_WORKOUT_SKIPPED', 'STUDENT_METRIC_ADDED', 'STUDENT_EXAM_UPLOADED', 'STUDENT_INVITE_ACCEPTED');

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "data" JSONB,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "pushSent" BOOLEAN NOT NULL DEFAULT false,
    "pushError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PushSubscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PushSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationSettings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "morningReminder" BOOLEAN NOT NULL DEFAULT true,
    "eveningReminder" BOOLEAN NOT NULL DEFAULT true,
    "streakAlerts" BOOLEAN NOT NULL DEFAULT true,
    "trainerActivity" BOOLEAN NOT NULL DEFAULT true,
    "studentActivity" BOOLEAN NOT NULL DEFAULT true,
    "morningReminderHour" INTEGER NOT NULL DEFAULT 7,
    "eveningReminderHour" INTEGER NOT NULL DEFAULT 20,

    CONSTRAINT "NotificationSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Notification_userId_read_createdAt_idx" ON "Notification"("userId", "read", "createdAt");

-- CreateIndex
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "PushSubscription_endpoint_key" ON "PushSubscription"("endpoint");

-- CreateIndex
CREATE INDEX "PushSubscription_userId_idx" ON "PushSubscription"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationSettings_userId_key" ON "NotificationSettings"("userId");

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PushSubscription" ADD CONSTRAINT "PushSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationSettings" ADD CONSTRAINT "NotificationSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
