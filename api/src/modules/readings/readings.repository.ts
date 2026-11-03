// The history: every reading, newest first, removing one saved by mistake, and whether its email went out.
import type { Prisma } from '../../generated/prisma/client.ts';
import { PRISMA_RECORD_NOT_FOUND, getPrismaErrorCode } from '../../lib/databaseErrors.ts';
import type { SkipTake } from '../../lib/pagination.ts';
import { AppError } from '../../lib/errors.ts';
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
  // The file name too, so deleting the reading or replacing its bill can remove the old file from the uploads folder.
  bill: { select: { id: true, fileName: true, fileType: true, sizeBytes: true } },
} as const satisfies Prisma.ReadingSelect;

// Newest first: the latest day on top, and on the same day the one saved last.
const NEWEST_FIRST = [{ date: 'desc' }, { id: 'desc' }] as const satisfies Prisma.ReadingOrderByWithRelationInput[];

export type NewReading = { digits: string; date: Date; photoId?: number };

// What can change on a saved reading. A field left out stays as it is. `billId` links an uploaded bill in place of the
// reading's own, and null removes it.
export type ReadingChanges = { costCents?: number | null; billId?: number | null };

// How an update ended. `removedBillFileName` is the file of the bill it replaced or removed: its row is gone, and the
// caller removes the file once the change is saved.
export type ReadingUpdate =
  | { outcome: 'updated'; row: ReadingRow; removedBillFileName: string | null }
  | { outcome: 'notFound' }
  | { outcome: 'billNotAvailable' };

type CurrentBill = { id: number; fileName: string } | null;

export type ReadingRow = Prisma.ReadingGetPayload<{ select: typeof READING_SELECT }>;

export type ReadingPage = { rows: ReadingRow[]; total: number };

// Which readings a page or the spreadsheet is taken from. Every part is optional; the days are inclusive.
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

function toWhere({ from, to, statuses }: ReadingFilter): Prisma.ReadingWhereInput {
  return { date: { gte: from, lte: to }, status: statuses ? { in: statuses } : undefined };
}

function toSentEmailColumns({ from, to, subject, body, withPhoto }: SentEmail): SentEmailColumns {
  return { sentFrom: from, sentTo: to, sentSubject: subject, sentBody: body, sentWithPhoto: withPhoto };
}

// Thrown inside the update's transaction to undo it: the bill asked for is unknown or belongs to another reading.
class BillNotAvailableError extends AppError {
  constructor() {
    super('The bill does not exist or already belongs to another reading', { code: 'BILL_NOT_AVAILABLE' });
  }
}

type TransactionClient = Prisma.TransactionClient;

// Links the bill, only while it belongs to no reading, after the reading's own bill row is deleted (one bill per
// reading). Nothing to do when the bill asked for is the one it has.
async function replaceBill(
  tx: TransactionClient,
  readingId: number,
  current: CurrentBill,
  billId: number | null,
): Promise<string | null> {
  const isSameBill = billId === (current?.id ?? null);

  if (isSameBill) return null;

  if (current) await tx.bill.deleteMany({ where: { id: current.id } });

  if (billId !== null) {
    const { count } = await tx.bill.updateMany({ where: { id: billId, readingId: null }, data: { readingId } });

    if (count === 0) throw new BillNotAvailableError();
  }

  return current?.fileName ?? null;
}

// The cost and the bill change together or not at all.
async function updateInTransaction(id: number, { costCents, billId }: ReadingChanges): Promise<ReadingUpdate> {
  return prisma.$transaction(async (tx) => {
    const current = await tx.reading.findUnique({
      where: { id },
      select: { bill: { select: { id: true, fileName: true } } },
    });

    if (!current) return { outcome: 'notFound' };

    const removedBillFileName = billId === undefined ? null : await replaceBill(tx, id, current.bill, billId);
    const row = await tx.reading.update({ where: { id }, data: { costCents }, select: READING_SELECT });

    return { outcome: 'updated', row, removedBillFileName };
  });
}

// The updated row, or null when there is no reading with this id (or it was deleted meanwhile).
async function updateReading(id: number, data: SendOutcome): Promise<ReadingRow | null> {
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
  findPage: async ({ skip, take }: SkipTake, filter: ReadingFilter): Promise<ReadingPage> => {
    const where = toWhere(filter);

    const [rows, total] = await prisma.$transaction([
      prisma.reading.findMany({ where, orderBy: [...NEWEST_FIRST], skip, take, select: READING_SELECT }),
      prisma.reading.count({ where }),
    ]);

    return { rows, total };
  },

  // Every row the filter matches, newest first, for the spreadsheet. No page: one meter read about once a month
  // makes a dozen rows a year, so the whole history is small.
  findAll: (filter: ReadingFilter): Promise<ReadingRow[]> =>
    prisma.reading.findMany({ where: toWhere(filter), orderBy: [...NEWEST_FIRST], select: READING_SELECT }),

  // Every reading with a Cost or a Bill in the range, newest first. No `take`: the Costs page lists every one of them,
  // and one meter read about monthly keeps this to a dozen rows a year.
  findWithCostOrBill: (filter: ReadingFilter): Promise<ReadingRow[]> =>
    prisma.reading.findMany({
      where: { ...toWhere(filter), OR: [{ costCents: { not: null } }, { bill: { isNot: null } }] },
      orderBy: [...NEWEST_FIRST],
      select: READING_SELECT,
    }),

  findById: (id: number): Promise<ReadingRow | null> =>
    prisma.reading.findUnique({ where: { id }, select: READING_SELECT }),

  // One transaction: a bill that cannot be linked changes nothing, the cost included.
  update: async (id: number, changes: ReadingChanges): Promise<ReadingUpdate> => {
    try {
      return await updateInTransaction(id, changes);
    } catch (error: unknown) {
      if (error instanceof BillNotAvailableError) return { outcome: 'billNotAvailable' };

      if (getPrismaErrorCode(error) === PRISMA_RECORD_NOT_FOUND) return { outcome: 'notFound' };

      throw error;
    }
  },

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
