/*
  Warnings:

  - You are about to drop the column `oralReadingLevel` on the `OralReadingResult` table. All the data in the column will be lost.
  - You are about to drop the column `tags` on the `Passage` table. All the data in the column will be lost.
  - Added the required column `classificationLevel` to the `OralReadingResult` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "OralReadingResult" DROP COLUMN "oralReadingLevel",
ADD COLUMN     "classificationLevel" "LevelClassification" NOT NULL;

-- AlterTable
ALTER TABLE "Passage" DROP COLUMN "tags";
