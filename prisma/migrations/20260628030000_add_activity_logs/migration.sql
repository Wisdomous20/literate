CREATE TABLE IF NOT EXISTS "activity_logs" (
  "id" TEXT NOT NULL,
  "actorUserId" TEXT NOT NULL,
  "actorEmail" TEXT,
  "actorRole" "userType" NOT NULL,
  "action" TEXT NOT NULL,
  "entityType" TEXT NOT NULL,
  "entityId" TEXT,
  "entityTitle" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "activity_logs_actorUserId_createdAt_idx"
  ON "activity_logs"("actorUserId", "createdAt");

CREATE INDEX IF NOT EXISTS "activity_logs_actorRole_createdAt_idx"
  ON "activity_logs"("actorRole", "createdAt");

CREATE INDEX IF NOT EXISTS "activity_logs_entityType_entityId_idx"
  ON "activity_logs"("entityType", "entityId");
