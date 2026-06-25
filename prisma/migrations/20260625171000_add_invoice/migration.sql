-- This migration intentionally backfills existing Subscription rows before
-- making new billing columns required.

-- CreateEnum
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'OrganizationType') THEN
        CREATE TYPE "OrganizationType" AS ENUM ('PERSONAL', 'TEAM');
    END IF;
END $$;

-- CreateEnum
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'InvoiceStatus') THEN
        CREATE TYPE "InvoiceStatus" AS ENUM ('PENDING', 'PAID', 'VOID', 'FAILED');
    END IF;
END $$;

-- CreateEnum
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'InvoiceEmailStatus') THEN
        CREATE TYPE "InvoiceEmailStatus" AS ENUM ('PENDING', 'SENT', 'FAILED');
    END IF;
END $$;

-- AlterEnum
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_enum e
        JOIN pg_type t ON t.oid = e.enumtypid
        WHERE t.typname = 'OrganizationMemberRole'
          AND e.enumlabel = 'OWNER'
    ) THEN
        ALTER TYPE "OrganizationMemberRole" ADD VALUE 'OWNER';
    END IF;
END $$;

-- Existing organizations are team/workspace accounts. New orgs default to PERSONAL.
ALTER TABLE "Organization"
ADD COLUMN IF NOT EXISTS "type" "OrganizationType" NOT NULL DEFAULT 'TEAM';

ALTER TABLE "Organization" ALTER COLUMN "type" SET DEFAULT 'PERSONAL';

-- CreateTable
CREATE TABLE IF NOT EXISTS "Plan" (
    "id" TEXT NOT NULL,
    "code" "PlanType" NOT NULL,
    "name" TEXT NOT NULL,
    "maxMembers" INTEGER NOT NULL,
    "priceAmount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'PHP',
    "billingInterval" TEXT NOT NULL DEFAULT 'YEAR',
    "providerPlanId" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Plan_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Plan_code_key" UNIQUE ("code")
);

-- SeedPlanData
INSERT INTO "Plan" (
    "id",
    "code",
    "name",
    "maxMembers",
    "priceAmount",
    "currency",
    "billingInterval",
    "active",
    "createdAt",
    "updatedAt"
)
VALUES
    ('plan_solo', 'SOLO', 'Solo', 1, 1500.00, 'PHP', 'YEAR', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('plan_kasalo', 'KASALO', 'Kasalo', 5, 5000.00, 'PHP', 'YEAR', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('plan_panalo', 'PANALO', 'Panalo', 15, 15000.00, 'PHP', 'YEAR', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('plan_pamilya', 'PAMILYA', 'Pamilya', 20, 20000.00, 'PHP', 'YEAR', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("code") DO NOTHING;

-- Convert existing organization owners into OWNER memberships.
UPDATE "OrganizationMember" AS om
SET "role" = 'OWNER'
FROM "Organization" AS o
WHERE om."organizationId" = o."id"
  AND om."userId" = o."ownerId";

INSERT INTO "OrganizationMember" (
    "id",
    "userId",
    "organizationId",
    "role",
    "joinedAt"
)
SELECT
    'owner_member_' || o."id",
    o."ownerId",
    o."id",
    'OWNER',
    CURRENT_TIMESTAMP
FROM "Organization" AS o
WHERE NOT EXISTS (
    SELECT 1
    FROM "OrganizationMember" AS om
    WHERE om."organizationId" = o."id"
      AND om."userId" = o."ownerId"
)
ON CONFLICT ("userId", "organizationId") DO UPDATE SET "role" = 'OWNER';

-- Add new subscription columns as nullable first.
ALTER TABLE "Subscription"
ADD COLUMN IF NOT EXISTS "planId" TEXT,
ADD COLUMN IF NOT EXISTS "maxMembersSnapshot" INTEGER,
ADD COLUMN IF NOT EXISTS "priceAmountSnapshot" DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS "currencySnapshot" TEXT NOT NULL DEFAULT 'PHP';

-- Backfill plan and snapshot data from the previous flat subscription fields.
UPDATE "Subscription"
SET
    "planId" = CASE "planType"::TEXT
        WHEN 'SOLO' THEN 'plan_solo'
        WHEN 'KASALO' THEN 'plan_kasalo'
        WHEN 'PANALO' THEN 'plan_panalo'
        WHEN 'PAMILYA' THEN 'plan_pamilya'
    END,
    "maxMembersSnapshot" = COALESCE("maxMembers", 1),
    "priceAmountSnapshot" = CASE "planType"::TEXT
        WHEN 'SOLO' THEN 1500.00
        WHEN 'KASALO' THEN 5000.00
        WHEN 'PANALO' THEN 15000.00
        WHEN 'PAMILYA' THEN GREATEST(COALESCE("maxMembers", 20), 20) * 1000.00
        ELSE 1500.00
    END;

-- Create personal organizations for existing direct user subscriptions.
INSERT INTO "Organization" (
    "id",
    "name",
    "ownerId",
    "type",
    "createdAt",
    "updatedAt"
)
SELECT
    'personal_' || s."userId",
    COALESCE(NULLIF(TRIM(CONCAT_WS(' ', u."firstName", u."lastName")), ''), 'Personal') || '''s Workspace',
    s."userId",
    'PERSONAL',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "Subscription" AS s
JOIN "users" AS u ON u."id" = s."userId"
WHERE s."userId" IS NOT NULL
  AND s."organizationId" IS NULL
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "OrganizationMember" (
    "id",
    "userId",
    "organizationId",
    "role",
    "joinedAt"
)
SELECT
    'personal_member_' || s."userId",
    s."userId",
    'personal_' || s."userId",
    'OWNER',
    CURRENT_TIMESTAMP
FROM "Subscription" AS s
WHERE s."userId" IS NOT NULL
  AND s."organizationId" IS NULL
ON CONFLICT ("userId", "organizationId") DO UPDATE SET "role" = 'OWNER';

UPDATE "Subscription"
SET "organizationId" = 'personal_' || "userId"
WHERE "userId" IS NOT NULL
  AND "organizationId" IS NULL;

-- Safety fallback for any malformed subscription without userId or organizationId.
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM "Subscription"
        WHERE "organizationId" IS NULL
    ) THEN
        RAISE EXCEPTION 'Cannot migrate Subscription rows that have neither organizationId nor userId.';
    END IF;
END $$;

-- Drop old constraints before removing/replacing columns.
ALTER TABLE "Subscription" DROP CONSTRAINT IF EXISTS "Subscription_userId_fkey";
ALTER TABLE "Subscription" DROP CONSTRAINT IF EXISTS "Subscription_organizationId_fkey";
ALTER TABLE "Organization" DROP CONSTRAINT IF EXISTS "Organization_ownerId_fkey";

DROP INDEX IF EXISTS "Subscription_userId_key";
DROP INDEX IF EXISTS "Organization_ownerId_idx";

-- Make new subscription columns required after backfill.
ALTER TABLE "Subscription" ALTER COLUMN "organizationId" SET NOT NULL;
ALTER TABLE "Subscription" ALTER COLUMN "planId" SET NOT NULL;
ALTER TABLE "Subscription" ALTER COLUMN "maxMembersSnapshot" SET NOT NULL;
ALTER TABLE "Subscription" ALTER COLUMN "priceAmountSnapshot" SET NOT NULL;

-- Drop replaced old columns.
ALTER TABLE "Subscription" DROP COLUMN "userId";
ALTER TABLE "Subscription" DROP COLUMN "planType";
ALTER TABLE "Subscription" DROP COLUMN "maxMembers";
ALTER TABLE "Organization" DROP COLUMN "ownerId";

-- AlterTable
ALTER TABLE "webhook_deliveries"
ADD COLUMN IF NOT EXISTS "provider" TEXT NOT NULL DEFAULT 'XENDIT',
ADD COLUMN IF NOT EXISTS "eventId" TEXT;

-- CreateTable
CREATE TABLE IF NOT EXISTS "Invoice" (
    "id" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'PENDING',
    "currency" TEXT NOT NULL,
    "subtotalAmount" DECIMAL(10,2) NOT NULL,
    "taxAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "totalAmount" DECIMAL(10,2) NOT NULL,
    "amountPaid" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "billingSnapshotEncrypted" TEXT,
    "billingSnapshotKeyVersion" TEXT,
    "recipientEmailEncrypted" TEXT,
    "recipientEmailKeyVersion" TEXT,
    "emailStatus" "InvoiceEmailStatus" NOT NULL DEFAULT 'PENDING',
    "emailSentAt" TIMESTAMP(3),
    "emailFailureReason" TEXT,
    "invoicePdfUrl" TEXT,
    "providerInvoiceId" TEXT,
    "issuedAt" TIMESTAMP(3),
    "dueAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "PaymentTransaction" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'XENDIT',
    "providerPaymentId" TEXT,
    "status" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL,
    "providerPayloadEncrypted" TEXT,
    "providerPayloadKeyVersion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Subscription_xenditPlanId_key" ON "Subscription"("xenditPlanId");
CREATE INDEX IF NOT EXISTS "Subscription_planId_idx" ON "Subscription"("planId");
CREATE INDEX IF NOT EXISTS "Subscription_status_currentPeriodEnd_idx" ON "Subscription"("status", "currentPeriodEnd");
CREATE UNIQUE INDEX IF NOT EXISTS "webhook_deliveries_eventId_key" ON "webhook_deliveries"("eventId");
CREATE UNIQUE INDEX IF NOT EXISTS "Invoice_invoiceNumber_key" ON "Invoice"("invoiceNumber");
CREATE UNIQUE INDEX IF NOT EXISTS "Invoice_providerInvoiceId_key" ON "Invoice"("providerInvoiceId");
CREATE INDEX IF NOT EXISTS "Invoice_subscriptionId_idx" ON "Invoice"("subscriptionId");
CREATE INDEX IF NOT EXISTS "Invoice_status_issuedAt_idx" ON "Invoice"("status", "issuedAt");
CREATE UNIQUE INDEX IF NOT EXISTS "PaymentTransaction_providerPaymentId_key" ON "PaymentTransaction"("providerPaymentId");
CREATE INDEX IF NOT EXISTS "PaymentTransaction_invoiceId_idx" ON "PaymentTransaction"("invoiceId");
CREATE INDEX IF NOT EXISTS "PaymentTransaction_provider_status_idx" ON "PaymentTransaction"("provider", "status");

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PaymentTransaction" ADD CONSTRAINT "PaymentTransaction_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;
