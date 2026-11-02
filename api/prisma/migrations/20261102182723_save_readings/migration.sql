-- CreateEnum
CREATE TYPE "ReadingStatus" AS ENUM ('NOT_SENT', 'SENT', 'FAILED');

-- CreateTable
CREATE TABLE "readings" (
    "id" SERIAL NOT NULL,
    "digits" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "status" "ReadingStatus" NOT NULL DEFAULT 'NOT_SENT',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "readings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "readings_date_id_idx" ON "readings"("date" DESC, "id" DESC);
