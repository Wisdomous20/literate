-- Kapamilya/Pamilya is now capped at 50 seats.
UPDATE "Plan"
SET "maxMembers" = 50,
    "updatedAt" = CURRENT_TIMESTAMP
WHERE "code" = 'PAMILYA'
  AND "maxMembers" <> 50;


UPDATE "Subscription" AS s
SET "maxMembersSnapshot" = 50,
    "updatedAt" = CURRENT_TIMESTAMP
FROM "Plan" AS p
WHERE s."planId" = p."id"
  AND p."code" = 'PAMILYA'
  AND s."maxMembersSnapshot" > 50;
