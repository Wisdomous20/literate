/*
  Warnings:

  - You are about to drop the column `type` on the `Assessment` table. All the data in the column will be lost.
  - You are about to drop the column `level` on the `ComprehensionTest` table. All the data in the column will be lost.
  - The `classificationLevel` column on the `OralFluencySession` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `comprehensionLevel` to the `ComprehensionTest` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "LevelClassification" AS ENUM ('INDEPENDENT', 'INSTRUCTIONAL', 'FRUSTRATION');

-- AlterTable
ALTER TABLE "Assessment" DROP COLUMN "type";

-- AlterTable
ALTER TABLE "ComprehensionTest" DROP COLUMN "level",
ADD COLUMN     "comprehensionLevel" "LevelClassification" NOT NULL;

-- AlterTable
ALTER TABLE "OralFluencySession" DROP COLUMN "classificationLevel",
ADD COLUMN     "classificationLevel" "LevelClassification";

-- CreateTable
CREATE TABLE "OralReadingResult" (
    "id" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "fluencyLevel" "LevelClassification" NOT NULL,
    "comprehensionLevel" "LevelClassification" NOT NULL,
    "oralReadingLevel" "LevelClassification" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OralReadingResult_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OralReadingResult_assessmentId_key" ON "OralReadingResult"("assessmentId");

-- AddForeignKey
ALTER TABLE "OralReadingResult" ADD CONSTRAINT "OralReadingResult_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
