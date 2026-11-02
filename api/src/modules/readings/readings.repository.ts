// The history: every reading, newest first, removing one saved by mistake, and whether its email went out.
import type { Prisma } from '../../generated/prisma/client.ts';
import { PRISMA_RECORD_NOT_FOUND, getPrismaErrorCode } from '../../lib/databaseErrors.ts';
import type { SkipTake } from '../../lib/pagination.ts';
import { prisma } from '../../lib/prisma.ts';

const READING_SELECT = {
  id: true,
  digits: true,
  date: true,
  status: true,
  sentAt: true,
  createdAt: true,
  // The file name, so deleting a reading can remove its photo from the uploads folder too, and sending it can attach it.
  photo: { select: { id: true, fileName: true } },
} as const satisfies Prisma.ReadingSelect;

// Newest first: the latest day on top, and on the same day the one saved last.
const NEWEST_FIRST = [{ date: 'desc' }, { id: 'desc' }] as const satisfies Prisma.ReadingOrderByWithRelationInput[];

export type NewReading = { digits: string; date: Date; photoId?: number };

export type ReadingRow = Prisma.ReadingGetPayload<{ select: typeof READING_SELECT }>;

export type ReadingPage = { rows: ReadingRow[]; total: number };

// What a send ends in: sent at a time, or failed (and so not sent at any time).
type SendOutcome = { status: 'SENT'; sentAt: Date } | { status: 'FAILED'; sentAt: null };

// The updated row, or null when the reading was deleted meanwhile.
async function updateSendOutcome(id: number, outcome: SendOutcome): Promise<ReadingRow | null> {
  try {
    return await prisma.reading.update({ where: { id }, data: outcome, select: READING_SELECT });
  } catch (error) {
    if (getPrismaErrorCode(error) === PRISMA_RECORD_NOT_FOUND) return null;

    throw error;
  }
}

export const readingsRepository = {
  // The saved row, or null when the photo cannot be linked. A photo is linked only while it belongs to no reading:
  // an unknown or taken photo fails the whole save (P2025), in one statement, so two saves cannot share a photo.
  create: async ({ digits, date, photoId }: NewReading): Promise<ReadingRow | null> => {
    const photo = photoId === undefined ? undefined : { connect: { id: photoId, reading: { is: null } } };

    try {
      return await prisma.reading.create({ data: { digits, date, photo }, select: READING_SELECT });
    } catch (error) {
      if (getPrismaErrorCode(error) === PRISMA_RECORD_NOT_FOUND) return null;

      throw error;
    }
  },

  // The page and the total in one transaction, so the total matches the page.
  findPage: async ({ skip, take }: SkipTake): Promise<ReadingPage> => {
    const [rows, total] = await prisma.$transaction([
      prisma.reading.findMany({ orderBy: [...NEWEST_FIRST], skip, take, select: READING_SELECT }),
      prisma.reading.count(),
    ]);

    return { rows, total };
  },

  findById: (id: number): Promise<ReadingRow | null> =>
    prisma.reading.findUnique({ where: { id }, select: READING_SELECT }),

  markSent: (id: number, sentAt: Date): Promise<ReadingRow | null> => updateSendOutcome(id, { status: 'SENT', sentAt }),

  markFailed: (id: number): Promise<ReadingRow | null> => updateSendOutcome(id, { status: 'FAILED', sentAt: null }),

  // The deleted row, or null when there was none. One statement, so two deletes at once cannot both find the row:
  // the second gets null, never a database error.
  deleteById: async (id: number): Promise<ReadingRow | null> => {
    try {
      return await prisma.reading.delete({ where: { id }, select: READING_SELECT });
    } catch (error) {
      if (getPrismaErrorCode(error) === PRISMA_RECORD_NOT_FOUND) return null;

      throw error;
    }
  },
};
