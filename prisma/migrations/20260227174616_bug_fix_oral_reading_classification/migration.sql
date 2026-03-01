/*
  Warnings:

  - You are about to drop the column `classificationLevel` on the `OralReadingResult` table. All the data in the column will be lost.
  - Added the required column `fluencyLevel` to the `OralReadingResult` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "OralReadingResult" DROP COLUMN "classificationLevel",
ADD COLUMN     "fluencyLevel" "LevelClassification" NOT NULL;
