import { NotFoundError } from '../../lib/httpErrors.ts';
import { logger } from '../../lib/logger.ts';
import { toSkipTake } from '../../lib/pagination.ts';
import { readingsRepository, type ReadingRow } from './readings.repository.ts';
import type {
  CreateReading,
  ListReadingsQuery,
  ReadingListResponse,
  ReadingResponse,
  ReadingStatus,
} from './readings.schema.ts';

const log = logger.child({ module: 'readings' });

const ENTITY = 'Reading';

// An ISO timestamp's first ten characters are its calendar day.
const ISO_DATE_LENGTH = 10;

const STATUS_MAP: Record<ReadingRow['status'], ReadingStatus> = {
  NOT_SENT: 'notSent',
  SENT: 'sent',
  FAILED: 'failed',
};

// A Postgres `date` comes back as midnight UTC of that day, and goes in the same way.
function toDate(isoDate: string): Date {
  return new Date(`${isoDate}T00:00:00.000Z`);
}

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, ISO_DATE_LENGTH);
}

function toResponse(row: ReadingRow): ReadingResponse {
  return {
    id: row.id,
    digits: row.digits,
    date: toIsoDate(row.date),
    status: STATUS_MAP[row.status],
    createdAt: row.createdAt.toISOString(),
  };
}

export async function addReading({ digits, date }: CreateReading): Promise<ReadingResponse> {
  const row = await readingsRepository.create({ digits, date: toDate(date) });

  // The id only: the digits are the user's data.
  log.info({ readingId: row.id }, 'reading saved');

  return toResponse(row);
}

export async function getReadings(query: ListReadingsQuery): Promise<ReadingListResponse> {
  const { rows, total } = await readingsRepository.findPage(toSkipTake(query));

  return { data: rows.map(toResponse), totalResultNumber: total, currentPage: query.page };
}

// The seam for photos (issue #4): a reading has no stored files yet, so there is nothing to remove. Once a reading
// keeps its photo, this deletes that file from the uploads folder.
async function removeReadingFiles(row: ReadingRow): Promise<void> {
  log.debug({ readingId: row.id }, 'reading has no stored files to remove');
}

export async function deleteReading(id: number): Promise<void> {
  const row = await readingsRepository.deleteById(id);

  if (!row) throw new NotFoundError(ENTITY, id);

  await removeReadingFiles(row);

  log.info({ readingId: id }, 'reading deleted');
}
