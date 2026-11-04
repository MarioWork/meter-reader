-- AlterTable
ALTER TABLE "readings" ADD COLUMN "failed_at" TIMESTAMPTZ(3),
ADD COLUMN "failure_reason" TEXT;
