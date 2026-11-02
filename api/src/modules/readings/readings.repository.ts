// The history: every reading, newest first, and removing one saved by mistake.
import type { Prisma } from '../../generated/prisma/client.ts';
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

  // The deleted row, or null when there was none. Read and deleted in one transaction, so the caller gets the row
  // that was really removed (and can clean up after it).
  deleteById: (id: number): Promise<ReadingRow | null> =>
    prisma.$transaction(async (transaction) => {
      const row = await transaction.reading.findUnique({ where: { id }, select: READING_SELECT });

      if (!row) return null;

      await transaction.reading.delete({ where: { id } });

      return row;
    }),
};
