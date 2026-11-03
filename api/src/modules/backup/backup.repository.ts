// Every reading, for a backup: no page, no filter.
import type { Prisma } from '../../generated/prisma/client.ts';
import { prisma } from '../../lib/prisma.ts';

const BACKUP_READING_SELECT = {
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
  photo: { select: { fileName: true } },
} as const satisfies Prisma.ReadingSelect;

// Newest first, as the history: the latest day on top, and on the same day the one saved last.
const NEWEST_FIRST = [{ date: 'desc' }, { id: 'desc' }] as const satisfies Prisma.ReadingOrderByWithRelationInput[];

export type BackupReadingRow = Prisma.ReadingGetPayload<{ select: typeof BACKUP_READING_SELECT }>;

export const backupRepository = {
  findReadings: (): Promise<BackupReadingRow[]> =>
    prisma.reading.findMany({ orderBy: [...NEWEST_FIRST], select: BACKUP_READING_SELECT }),
};
