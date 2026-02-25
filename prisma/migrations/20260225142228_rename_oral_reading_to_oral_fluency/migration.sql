/*
  Warnings:

  - You are about to drop the `OralReadingBehavior` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `OralReadingMiscue` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `OralReadingSession` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "OralFluencyStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "OralFluencyBehaviorType" AS ENUM ('WORD_BY_WORD_READING', 'MONOTONOUS_READING', 'DISMISSAL_OF_PUNCTUATION');

-- DropForeignKey
ALTER TABLE "OralReadingBehavior" DROP CONSTRAINT "OralReadingBehavior_sessionId_fkey";

-- DropForeignKey
ALTER TABLE "OralReadingMiscue" DROP CONSTRAINT "OralReadingMiscue_sessionId_fkey";

-- DropForeignKey
ALTER TABLE "OralReadingSession" DROP CONSTRAINT "OralReadingSession_assessmentId_fkey";

-- DropForeignKey
ALTER TABLE "WordTimestamp" DROP CONSTRAINT "WordTimestamp_sessionId_fkey";

-- DropTable
DROP TABLE "OralReadingBehavior";

-- DropTable
DROP TABLE "OralReadingMiscue";

-- DropTable
DROP TABLE "OralReadingSession";

-- DropEnum
DROP TYPE "OralReadingStatus";

-- DropEnum
DROP TYPE "ReadingBehaviorType";

-- CreateTable
CREATE TABLE "OralFluencySession" (
    "id" TEXT NOT NULL,
    "assessmentId" TEXT,
    "audioUrl" TEXT NOT NULL DEFAULT '',
    "transcript" TEXT,
    "wordsPerMinute" DOUBLE PRECISION,
    "accuracy" DOUBLE PRECISION,
    "totalWords" INTEGER,
    "totalMiscues" INTEGER,
    "duration" DOUBLE PRECISION,
    "oralFluencyScore" DOUBLE PRECISION,
    "classificationLevel" TEXT,
    "status" "OralFluencyStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "OralFluencySession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OralFluencyMiscue" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "miscueType" "MiscueType" NOT NULL,
    "expectedWord" TEXT NOT NULL,
    "spokenWord" TEXT,
    "wordIndex" INTEGER NOT NULL,
    "timestamp" DOUBLE PRECISION,
    "isSelfCorrected" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OralFluencyMiscue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OralFluencyBehavior" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "behaviorType" "OralFluencyBehaviorType" NOT NULL,
    "startIndex" INTEGER,
    "endIndex" INTEGER,
    "startTime" DOUBLE PRECISION,
    "endTime" DOUBLE PRECISION,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OralFluencyBehavior_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OralFluencySession_assessmentId_key" ON "OralFluencySession"("assessmentId");

-- AddForeignKey
ALTER TABLE "OralFluencySession" ADD CONSTRAINT "OralFluencySession_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WordTimestamp" ADD CONSTRAINT "WordTimestamp_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "OralFluencySession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OralFluencyMiscue" ADD CONSTRAINT "OralFluencyMiscue_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "OralFluencySession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OralFluencyBehavior" ADD CONSTRAINT "OralFluencyBehavior_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "OralFluencySession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
