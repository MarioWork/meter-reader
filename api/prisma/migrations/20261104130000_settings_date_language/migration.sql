-- CreateEnum
CREATE TYPE "MessageDateLanguage" AS ENUM ('ENGLISH', 'PORTUGUESE');

-- AlterTable
ALTER TABLE "settings" ADD COLUMN "date_language" "MessageDateLanguage" NOT NULL DEFAULT 'ENGLISH';
