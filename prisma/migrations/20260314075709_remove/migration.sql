/*
  Warnings:

  - You are about to drop the column `quizId` on the `ComprehensionTest` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "ComprehensionTest" DROP CONSTRAINT "ComprehensionTest_quizId_fkey";

-- AlterTable
ALTER TABLE "ComprehensionTest" DROP COLUMN "quizId";
