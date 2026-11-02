// The photos: one row per uploaded file. The file itself lives in UPLOADS_DIR (lib/uploads.ts).
import type { Prisma } from '../../generated/prisma/client.ts';
import { prisma } from '../../lib/prisma.ts';

const PHOTO_SELECT = {
  id: true,
  fileName: true,
  createdAt: true,
} as const satisfies Prisma.PhotoSelect;

export type NewPhoto = { fileName: string; sizeBytes: number };

export type PhotoRow = Prisma.PhotoGetPayload<{ select: typeof PHOTO_SELECT }>;

export const photosRepository = {
  create: (data: NewPhoto): Promise<PhotoRow> => prisma.photo.create({ data, select: PHOTO_SELECT }),

  findById: (id: number): Promise<PhotoRow | null> => prisma.photo.findUnique({ where: { id }, select: PHOTO_SELECT }),
};
