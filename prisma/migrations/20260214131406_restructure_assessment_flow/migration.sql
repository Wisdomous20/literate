/*
  Warnings:

  - You are about to drop the column `passageId` on the `OralReadingSession` table. All the data in the column will be lost.
  - You are about to drop the column `studentId` on the `OralReadingSession` table. All the data in the column will be lost.
  - You are about to drop the `ComprehensionTest` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `passageId` to the `Assessment` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "ComprehensionTest" DROP CONSTRAINT "ComprehensionTest_assessmentId_fkey";

-- DropForeignKey
ALTER TABLE "OralReadingSession" DROP CONSTRAINT "OralReadingSession_passageId_fkey";

-- DropForeignKey
ALTER TABLE "OralReadingSession" DROP CONSTRAINT "OralReadingSession_studentId_fkey";

-- AlterTable
ALTER TABLE "Assessment" ADD COLUMN     "passageId" TEXT NOT NULL,
ADD COLUMN     "quizId" TEXT,
ADD COLUMN     "quizLevel" TEXT,
ADD COLUMN     "quizScore" INTEGER,
ADD COLUMN     "quizTotal" INTEGER;

-- AlterTable
ALTER TABLE "OralReadingSession" DROP COLUMN "passageId",
DROP COLUMN "studentId";

-- DropTable
DROP TABLE "ComprehensionTest";

-- CreateTable
CREATE TABLE "StudentAnswer" (
    "id" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "isCorrect" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StudentAnswer_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Assessment" ADD CONSTRAINT "Assessment_passageId_fkey" FOREIGN KEY ("passageId") REFERENCES "Passage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assessment" ADD CONSTRAINT "Assessment_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "Quiz"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentAnswer" ADD CONSTRAINT "StudentAnswer_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentAnswer" ADD CONSTRAINT "StudentAnswer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
