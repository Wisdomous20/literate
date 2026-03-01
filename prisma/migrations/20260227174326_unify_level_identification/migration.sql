/*
  Warnings:

  - You are about to drop the column `comprehensionLevel` on the `ComprehensionTest` table. All the data in the column will be lost.
  - You are about to drop the column `fluencyLevel` on the `OralReadingResult` table. All the data in the column will be lost.
  - Added the required column `classificationLevel` to the `ComprehensionTest` table without a default value. This is not possible if the table is not empty.
  - Added the required column `classificationLevel` to the `OralReadingResult` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ComprehensionTest" DROP COLUMN "comprehensionLevel",
ADD COLUMN     "classificationLevel" "LevelClassification" NOT NULL;

-- AlterTable
ALTER TABLE "OralReadingResult" DROP COLUMN "fluencyLevel",
ADD COLUMN     "classificationLevel" "LevelClassification" NOT NULL;
