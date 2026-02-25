/*
  Warnings:

  - The values [ORAL_READING_TEST] on the enum `AssessmentType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "AssessmentType_new" AS ENUM ('ORAL_READING', 'COMPREHENSION', 'READING_FLUENCY');
ALTER TABLE "Assessment" ALTER COLUMN "type" TYPE "AssessmentType_new" USING ("type"::text::"AssessmentType_new");
ALTER TYPE "AssessmentType" RENAME TO "AssessmentType_old";
ALTER TYPE "AssessmentType_new" RENAME TO "AssessmentType";
DROP TYPE "public"."AssessmentType_old";
COMMIT;

-- AlterEnum
ALTER TYPE "MiscueType" ADD VALUE 'REPETITION';
