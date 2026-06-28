
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_enum e
        JOIN pg_type t ON t.oid = e.enumtypid
        WHERE t.typname = 'SubscriptionStatus'
          AND e.enumlabel = 'SUPERSEDED'
    ) THEN
        ALTER TYPE "SubscriptionStatus" ADD VALUE 'SUPERSEDED';
    END IF;
END $$;

DROP INDEX IF EXISTS "Subscription_organizationId_key";

CREATE INDEX IF NOT EXISTS "Subscription_organizationId_idx"
  ON "Subscription"("organizationId");

ALTER TABLE "Organization"
  ADD COLUMN IF NOT EXISTS "currentSubscriptionId" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "Organization_currentSubscriptionId_key"
  ON "Organization"("currentSubscriptionId");

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'Organization_currentSubscriptionId_fkey'
    ) THEN
        ALTER TABLE "Organization"
          ADD CONSTRAINT "Organization_currentSubscriptionId_fkey"
          FOREIGN KEY ("currentSubscriptionId") REFERENCES "Subscription"("id")
          ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

ALTER TABLE "Invoice"
  ADD COLUMN IF NOT EXISTS "discountAmount" DECIMAL(10,2) NOT NULL DEFAULT 0;

UPDATE "Organization" o
SET "currentSubscriptionId" = s."id"
FROM "Subscription" s
WHERE s."organizationId" = o."id"
  AND o."currentSubscriptionId" IS NULL;
