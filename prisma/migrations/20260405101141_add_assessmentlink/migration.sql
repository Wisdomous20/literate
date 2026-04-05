/*
  Warnings:

  - You are about to drop the column `shareToken` on the `Assessment` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Assessment_shareToken_key";

-- AlterTable
ALTER TABLE "Assessment" DROP COLUMN "shareToken";

-- CreateTable
CREATE TABLE "AssessmentLink" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssessmentLink_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AssessmentLink_token_key" ON "AssessmentLink"("token");

-- CreateIndex
CREATE UNIQUE INDEX "AssessmentLink_assessmentId_key" ON "AssessmentLink"("assessmentId");

-- CreateIndex
CREATE INDEX "AssessmentLink_token_idx" ON "AssessmentLink"("token");

-- AddForeignKey
ALTER TABLE "AssessmentLink" ADD CONSTRAINT "AssessmentLink_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
