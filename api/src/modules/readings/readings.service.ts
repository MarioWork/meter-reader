import { ConflictError, NotFoundError } from '../../lib/httpErrors.ts';
import { logger } from '../../lib/logger.ts';
import { toSkipTake } from '../../lib/pagination.ts';
import { removeUpload } from '../../lib/uploads.ts';
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
const PHOTO_NOT_AVAILABLE_MESSAGE = 'This photo does not exist or already belongs to another reading';

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
    photoId: row.photo?.id ?? null,
  };
}

export async function addReading({ digits, date, photoId }: CreateReading): Promise<ReadingResponse> {
  const row = await readingsRepository.create({ digits, date: toDate(date), photoId });

  if (!row) throw new ConflictError(PHOTO_NOT_AVAILABLE_MESSAGE, 'PHOTO_NOT_AVAILABLE');

  // The id only: the digits are the user's data.
  log.info({ readingId: row.id }, 'reading saved');

  return toResponse(row);
}

export async function getReadings(query: ListReadingsQuery): Promise<ReadingListResponse> {
  const { rows, total } = await readingsRepository.findPage(toSkipTake(query));

  return { data: rows.map(toResponse), totalResultNumber: total, currentPage: query.page };
}

// Deleting the reading already deleted its photo row (cascade); this removes the file from the uploads folder. The
// row is gone by then, so a file that cannot be removed is logged, not turned into a failed delete.
async function removeReadingPhoto(row: ReadingRow): Promise<void> {
  if (!row.photo) return;

  try {
    await removeUpload(row.photo.fileName);
  } catch (error: unknown) {
    // Ids only: the error's message holds the file's path, never anything the user typed.
    log.warn({ readingId: row.id, photoId: row.photo.id, err: error }, 'photo file of a deleted reading not removed');
  }
}

export async function deleteReading(id: number): Promise<void> {
  const row = await readingsRepository.deleteById(id);

  if (!row) throw new NotFoundError(ENTITY, id);

  await removeReadingPhoto(row);

  log.info({ readingId: id }, 'reading deleted');
}
