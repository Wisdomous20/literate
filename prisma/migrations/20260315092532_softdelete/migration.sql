/*
  Warnings:

  - The `deletedAt` column on the `Student` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `emailVerified` on the `users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Student" DROP COLUMN "deletedAt",
ADD COLUMN     "deletedAt" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "users" DROP COLUMN "emailVerified";
