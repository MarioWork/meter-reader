// The photos: one row per uploaded file. The file itself lives in UPLOADS_DIR (lib/uploads.ts).
import type { Prisma } from '../../generated/prisma/client.ts';
import { prisma } from '../../lib/prisma.ts';

const PHOTO_SELECT = {
  id: true,
  fileName: true,
  createdAt: true,
} as const satisfies Prisma.PhotoSelect;

export type NewPhoto = { fileName: string; sizeBytes: number };

type DeletedPhoto = { fileName: string };

export type PhotoRow = Prisma.PhotoGetPayload<{ select: typeof PHOTO_SELECT }>;

export const photosRepository = {
  create: (data: NewPhoto): Promise<PhotoRow> => prisma.photo.create({ data, select: PHOTO_SELECT }),

  findById: (id: number): Promise<PhotoRow | null> => prisma.photo.findUnique({ where: { id }, select: PHOTO_SELECT }),

  // Deletes the photos no reading took before the cutoff and answers their file names. One statement: a photo
  // linked while this runs is never deleted, and only the deleted rows' files are answered.
  deleteUnlinkedBefore: async (cutoff: Date): Promise<string[]> => {
    const rows = await prisma.$queryRaw<DeletedPhoto[]>`
      delete from photos where reading_id is null and created_at < ${cutoff} returning file_name as "fileName"`;

    return rows.map((row) => row.fileName);
  },
};
