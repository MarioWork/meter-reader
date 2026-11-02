// The history: every reading, newest first, and removing one saved by mistake.
import type { Prisma } from '../../generated/prisma/client.ts';
import { PRISMA_RECORD_NOT_FOUND, getPrismaErrorCode } from '../../lib/databaseErrors.ts';
import type { SkipTake } from '../../lib/pagination.ts';
import { prisma } from '../../lib/prisma.ts';

const READING_SELECT = {
  id: true,
  digits: true,
  date: true,
  status: true,
  createdAt: true,
} as const satisfies Prisma.ReadingSelect;

// Newest first: the latest day on top, and on the same day the one saved last.
const NEWEST_FIRST = [{ date: 'desc' }, { id: 'desc' }] as const satisfies Prisma.ReadingOrderByWithRelationInput[];

export type NewReading = { digits: string; date: Date };

export type ReadingRow = Prisma.ReadingGetPayload<{ select: typeof READING_SELECT }>;

export type ReadingPage = { rows: ReadingRow[]; total: number };

export const readingsRepository = {
  create: (data: NewReading): Promise<ReadingRow> => prisma.reading.create({ data, select: READING_SELECT }),

  // The page and the total in one transaction, so the total matches the page.
  findPage: async ({ skip, take }: SkipTake): Promise<ReadingPage> => {
    const [rows, total] = await prisma.$transaction([
      prisma.reading.findMany({ orderBy: [...NEWEST_FIRST], skip, take, select: READING_SELECT }),
      prisma.reading.count(),
    ]);

    return { rows, total };
  },

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
