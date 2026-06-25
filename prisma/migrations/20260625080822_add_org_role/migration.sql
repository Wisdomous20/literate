-- CreateEnum
CREATE TYPE "OrganizationMemberRole" AS ENUM ('ADMIN', 'USER');

-- AlterTable
ALTER TABLE "OrganizationMember" ADD COLUMN     "role" "OrganizationMemberRole" NOT NULL DEFAULT 'USER';
