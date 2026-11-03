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
  sentFrom: true,
  sentTo: true,
  sentSubject: true,
  sentBody: true,
  sentWithPhoto: true,
  costCents: true,
  createdAt: true,
  // The file name, so deleting a reading can remove its photo from the uploads folder too, and sending it can attach it.
  photo: { select: { id: true, fileName: true } },
} as const satisfies Prisma.ReadingSelect;

// Newest first: the latest day on top, and on the same day the one saved last.
const NEWEST_FIRST = [{ date: 'desc' }, { id: 'desc' }] as const satisfies Prisma.ReadingOrderByWithRelationInput[];

export type NewReading = { digits: string; date: Date; photoId?: number };

// What can change on a saved reading. A field left out stays as it is.
export type ReadingChanges = { costCents?: number | null };

export type ReadingRow = Prisma.ReadingGetPayload<{ select: typeof READING_SELECT }>;

export type ReadingPage = { rows: ReadingRow[]; total: number };

// Which readings a page is taken from. Every part is optional; the days are inclusive.
export type ReadingFilter = { from?: Date; to?: Date; statuses?: ReadingRow['status'][] };

// The email as it went out, kept on the reading once it is sent.
export type SentEmail = { from: string | null; to: string; subject: string; body: string; withPhoto: boolean };

type SentEmailColumns = {
  sentFrom: string | null;
  sentTo: string | null;
  sentSubject: string | null;
  sentBody: string | null;
  sentWithPhoto: boolean | null;
};

// What a send ends in: sent at a time with its email, or failed (and so not sent at any time, with no email).
type SendOutcome = ({ status: 'SENT'; sentAt: Date } | { status: 'FAILED'; sentAt: null }) & SentEmailColumns;

const NO_SENT_EMAIL: SentEmailColumns = {
  sentFrom: null,
  sentTo: null,
  sentSubject: null,
  sentBody: null,
  sentWithPhoto: null,
};

function toSentEmailColumns({ from, to, subject, body, withPhoto }: SentEmail): SentEmailColumns {
  return { sentFrom: from, sentTo: to, sentSubject: subject, sentBody: body, sentWithPhoto: withPhoto };
}

// The updated row, or null when there is no reading with this id (or it was deleted meanwhile).
async function updateReading(id: number, data: SendOutcome | ReadingChanges): Promise<ReadingRow | null> {
  try {
    return await prisma.reading.update({ where: { id }, data, select: READING_SELECT });
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

  // The page and the total in one transaction, so the total matches the page. Both count the filtered rows only.
  findPage: async ({ skip, take }: SkipTake, { from, to, statuses }: ReadingFilter): Promise<ReadingPage> => {
    const where = {
      date: { gte: from, lte: to },
      status: statuses ? { in: statuses } : undefined,
    } satisfies Prisma.ReadingWhereInput;

    const [rows, total] = await prisma.$transaction([
      prisma.reading.findMany({ where, orderBy: [...NEWEST_FIRST], skip, take, select: READING_SELECT }),
      prisma.reading.count({ where }),
    ]);

    return { rows, total };
  },

  findById: (id: number): Promise<ReadingRow | null> =>
    prisma.reading.findUnique({ where: { id }, select: READING_SELECT }),

  // One statement, so a reading deleted meanwhile is null, never a database error.
  update: (id: number, changes: ReadingChanges): Promise<ReadingRow | null> => updateReading(id, changes),

  markSent: (id: number, sentAt: Date, email: SentEmail): Promise<ReadingRow | null> =>
    updateReading(id, { status: 'SENT', sentAt, ...toSentEmailColumns(email) }),

  markFailed: (id: number): Promise<ReadingRow | null> =>
    updateReading(id, { status: 'FAILED', sentAt: null, ...NO_SENT_EMAIL }),

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
