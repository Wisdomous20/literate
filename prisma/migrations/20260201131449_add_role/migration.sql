-- CreateEnum
CREATE TYPE "userType" AS ENUM ('USER', 'ADMIN');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "role" "userType" NOT NULL DEFAULT 'USER';
