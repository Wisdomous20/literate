/*
  Warnings:

  - You are about to drop the column `deletedAt` on the `Student` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Student" DROP COLUMN "deletedAt",
ADD COLUMN     "archived" BOOLEAN NOT NULL DEFAULT false;
