/*
  Warnings:

  - You are about to drop the `OralReading` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "OralReadingStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "MiscueType" AS ENUM ('OMISSION', 'MISPRONUNCIATION', 'SUBSTITUTION', 'REVERSAL', 'TRANSPOSITION', 'INSERTION', 'SELF_CORRECTION');

-- CreateEnum
CREATE TYPE "ReadingBehaviorType" AS ENUM ('WORD_BY_WORD_READING', 'MONOTONOUS_READING', 'DISMISSAL_OF_PUNCTUATION');

-- DropForeignKey
ALTER TABLE "OralReading" DROP CONSTRAINT "OralReading_assessmentId_fkey";

-- DropTable
DROP TABLE "OralReading";

-- CreateTable
CREATE TABLE "OralReadingSession" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "passageId" TEXT NOT NULL,
    "assessmentId" TEXT,
    "audioUrl" TEXT NOT NULL DEFAULT '',
    "transcript" TEXT,
    "wordsPerMinute" DOUBLE PRECISION,
    "accuracy" DOUBLE PRECISION,
    "totalWords" INTEGER,
    "totalMiscues" INTEGER,
    "duration" DOUBLE PRECISION,
    "status" "OralReadingStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "OralReadingSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WordTimestamp" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "word" TEXT NOT NULL,
    "startTime" DOUBLE PRECISION NOT NULL,
    "endTime" DOUBLE PRECISION NOT NULL,
    "confidence" DOUBLE PRECISION,
    "index" INTEGER NOT NULL,

    CONSTRAINT "WordTimestamp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OralReadingMiscue" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "miscueType" "MiscueType" NOT NULL,
    "expectedWord" TEXT NOT NULL,
    "spokenWord" TEXT,
    "wordIndex" INTEGER NOT NULL,
    "timestamp" DOUBLE PRECISION,
    "isSelfCorrected" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OralReadingMiscue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OralReadingBehavior" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "behaviorType" "ReadingBehaviorType" NOT NULL,
    "startIndex" INTEGER,
    "endIndex" INTEGER,
    "startTime" DOUBLE PRECISION,
    "endTime" DOUBLE PRECISION,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OralReadingBehavior_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OralReadingSession_assessmentId_key" ON "OralReadingSession"("assessmentId");

-- AddForeignKey
ALTER TABLE "OralReadingSession" ADD CONSTRAINT "OralReadingSession_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OralReadingSession" ADD CONSTRAINT "OralReadingSession_passageId_fkey" FOREIGN KEY ("passageId") REFERENCES "Passage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OralReadingSession" ADD CONSTRAINT "OralReadingSession_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WordTimestamp" ADD CONSTRAINT "WordTimestamp_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "OralReadingSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OralReadingMiscue" ADD CONSTRAINT "OralReadingMiscue_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "OralReadingSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OralReadingBehavior" ADD CONSTRAINT "OralReadingBehavior_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "OralReadingSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
