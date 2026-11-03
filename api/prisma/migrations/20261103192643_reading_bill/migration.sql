-- CreateEnum
CREATE TYPE "BillFileType" AS ENUM ('PDF', 'JPEG', 'PNG');

-- CreateTable
CREATE TABLE "bills" (
    "id" SERIAL NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_type" "BillFileType" NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "reading_id" INTEGER,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bills_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "bills_file_name_uidx" ON "bills"("file_name");

-- CreateIndex
CREATE UNIQUE INDEX "bills_reading_id_uidx" ON "bills"("reading_id");

-- AddForeignKey
ALTER TABLE "bills" ADD CONSTRAINT "bills_reading_id_fkey" FOREIGN KEY ("reading_id") REFERENCES "readings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
