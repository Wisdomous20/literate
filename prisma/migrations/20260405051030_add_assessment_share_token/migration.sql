/*
  Warnings:

  - A unique constraint covering the columns `[shareToken]` on the table `Assessment` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Assessment" ADD COLUMN     "shareToken" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Assessment_shareToken_key" ON "Assessment"("shareToken");
