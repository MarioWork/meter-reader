// The bills: one row per uploaded file. The file itself lives in UPLOADS_DIR (lib/uploads.ts), beside the photos.
import type { BillFileType, Prisma } from '../../generated/prisma/client.ts';
import { prisma } from '../../lib/prisma.ts';

const BILL_SELECT = {
  id: true,
  fileName: true,
  fileType: true,
  originalName: true,
  sizeBytes: true,
  createdAt: true,
  // The reading's day names the file when it has no name of its own.
  reading: { select: { date: true } },
} as const satisfies Prisma.BillSelect;

export type NewBill = { fileName: string; fileType: BillFileType; originalName: string | null; sizeBytes: number };

type DeletedBill = { fileName: string };

export type BillRow = Prisma.BillGetPayload<{ select: typeof BILL_SELECT }>;

export const billsRepository = {
  create: (data: NewBill): Promise<BillRow> => prisma.bill.create({ data, select: BILL_SELECT }),

  findById: (id: number): Promise<BillRow | null> => prisma.bill.findUnique({ where: { id }, select: BILL_SELECT }),

  // Deletes the bills no reading took before the cutoff and answers their file names. One statement: a bill linked
  // while this runs is never deleted, and only the deleted rows' files are answered.
  deleteUnlinkedBefore: async (cutoff: Date): Promise<string[]> => {
    const rows = await prisma.$queryRaw<DeletedBill[]>`
      delete from bills where reading_id is null and created_at < ${cutoff} returning file_name as "fileName"`;

    return rows.map((row) => row.fileName);
  },
};
