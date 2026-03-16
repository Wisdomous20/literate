/*
  Warnings:

  - You are about to drop the column `tags` on the `ComprehensionAnswer` table. All the data in the column will be lost.
  - Added the required column `tag` to the `ComprehensionAnswer` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ComprehensionAnswer" DROP COLUMN "tags",
ADD COLUMN     "tag" "Tags" NOT NULL;
