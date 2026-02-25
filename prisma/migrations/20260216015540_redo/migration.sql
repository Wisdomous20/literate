/*
  Warnings:

  - You are about to drop the column `quizId` on the `Assessment` table. All the data in the column will be lost.
  - You are about to drop the column `quizLevel` on the `Assessment` table. All the data in the column will be lost.
  - You are about to drop the column `quizScore` on the `Assessment` table. All the data in the column will be lost.
  - You are about to drop the column `quizTotal` on the `Assessment` table. All the data in the column will be lost.
  - You are about to drop the `StudentAnswer` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Assessment" DROP CONSTRAINT "Assessment_quizId_fkey";

-- DropForeignKey
ALTER TABLE "StudentAnswer" DROP CONSTRAINT "StudentAnswer_assessmentId_fkey";

-- DropForeignKey
ALTER TABLE "StudentAnswer" DROP CONSTRAINT "StudentAnswer_questionId_fkey";

-- AlterTable
ALTER TABLE "Assessment" DROP COLUMN "quizId",
DROP COLUMN "quizLevel",
DROP COLUMN "quizScore",
DROP COLUMN "quizTotal";

-- DropTable
DROP TABLE "StudentAnswer";

-- CreateTable
CREATE TABLE "ComprehensionTest" (
    "id" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "quizId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "totalItems" INTEGER NOT NULL,
    "level" TEXT NOT NULL,

    CONSTRAINT "ComprehensionTest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComprehensionAnswer" (
    "id" TEXT NOT NULL,
    "comprehensionTestId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "isCorrect" BOOLEAN,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ComprehensionAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ComprehensionTest_assessmentId_key" ON "ComprehensionTest"("assessmentId");

-- AddForeignKey
ALTER TABLE "ComprehensionTest" ADD CONSTRAINT "ComprehensionTest_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComprehensionTest" ADD CONSTRAINT "ComprehensionTest_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "Quiz"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComprehensionAnswer" ADD CONSTRAINT "ComprehensionAnswer_comprehensionTestId_fkey" FOREIGN KEY ("comprehensionTestId") REFERENCES "ComprehensionTest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComprehensionAnswer" ADD CONSTRAINT "ComprehensionAnswer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
