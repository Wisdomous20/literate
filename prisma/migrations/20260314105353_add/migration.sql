/*
  Warnings:

  - You are about to drop the column `questionId` on the `ComprehensionAnswer` table. All the data in the column will be lost.
  - You are about to drop the column `classId` on the `Student` table. All the data in the column will be lost.
  - Added the required column `question` to the `ComprehensionAnswer` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tags` to the `ComprehensionAnswer` table without a default value. This is not possible if the table is not empty.
  - Added the required column `classRoomId` to the `Student` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "ComprehensionAnswer" DROP CONSTRAINT "ComprehensionAnswer_questionId_fkey";

-- DropForeignKey
ALTER TABLE "Student" DROP CONSTRAINT "Student_classId_fkey";

-- AlterTable
ALTER TABLE "ComprehensionAnswer" DROP COLUMN "questionId",
ADD COLUMN     "question" TEXT NOT NULL,
ADD COLUMN     "tags" "Tags" NOT NULL;

-- AlterTable
ALTER TABLE "Student" DROP COLUMN "classId",
ADD COLUMN     "classRoomId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_classRoomId_fkey" FOREIGN KEY ("classRoomId") REFERENCES "ClassRoom"("id") ON DELETE CASCADE ON UPDATE CASCADE;
