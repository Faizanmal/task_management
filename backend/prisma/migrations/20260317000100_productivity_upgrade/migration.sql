-- CreateEnum
CREATE TYPE "TaskPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "RecurrencePattern" AS ENUM ('NONE', 'DAILY', 'WEEKLY', 'MONTHLY');

-- AlterTable
ALTER TABLE "Task"
ADD COLUMN "priority" "TaskPriority" NOT NULL DEFAULT 'MEDIUM',
ADD COLUMN "dueDate" TIMESTAMP(3),
ADD COLUMN "reminderAt" TIMESTAMP(3),
ADD COLUMN "recurrence" "RecurrencePattern" NOT NULL DEFAULT 'NONE',
ADD COLUMN "recurrenceInterval" INTEGER,
ADD COLUMN "completedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "RefreshToken"
ADD COLUMN "revokedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "TaskActivity" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "taskId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "TaskActivity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Task_dueDate_idx" ON "Task"("dueDate");

-- CreateIndex
CREATE INDEX "Task_priority_idx" ON "Task"("priority");

-- CreateIndex
CREATE INDEX "Task_recurrence_idx" ON "Task"("recurrence");

-- CreateIndex
CREATE INDEX "RefreshToken_revokedAt_idx" ON "RefreshToken"("revokedAt");

-- CreateIndex
CREATE INDEX "TaskActivity_taskId_idx" ON "TaskActivity"("taskId");

-- CreateIndex
CREATE INDEX "TaskActivity_userId_idx" ON "TaskActivity"("userId");

-- AddForeignKey
ALTER TABLE "TaskActivity" ADD CONSTRAINT "TaskActivity_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskActivity" ADD CONSTRAINT "TaskActivity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
