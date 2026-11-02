-- CreateTable
CREATE TABLE "photos" (
    "id" SERIAL NOT NULL,
    "file_name" TEXT NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "reading_id" INTEGER,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "photos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "photos_file_name_uidx" ON "photos"("file_name");

-- CreateIndex
CREATE UNIQUE INDEX "photos_reading_id_uidx" ON "photos"("reading_id");

-- AddForeignKey
ALTER TABLE "photos" ADD CONSTRAINT "photos_reading_id_fkey" FOREIGN KEY ("reading_id") REFERENCES "readings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

