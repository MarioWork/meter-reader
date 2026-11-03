-- AlterTable
ALTER TABLE "readings" ADD COLUMN "sent_to" TEXT,
ADD COLUMN "sent_subject" TEXT,
ADD COLUMN "sent_body" TEXT,
ADD COLUMN "sent_with_photo" BOOLEAN;
