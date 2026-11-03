import { toCsv } from '../../lib/csv.ts';
import { logger } from '../../lib/logger.ts';
import { BACKUP_CSV_COLUMNS } from './backup.csv.ts';
import { backupRepository, type BackupReadingRow } from './backup.repository.ts';
import type { BackupReading, BackupReadingStatus, BackupResponse } from './backup.schema.ts';

const log = logger.child({ module: 'backup' });

// An ISO timestamp's first ten characters are its calendar day.
const ISO_DATE_LENGTH = 10;
const FILE_NAME_PREFIX = 'meter-readings';
const JSON_EXTENSION = 'json';
const CSV_EXTENSION = 'csv';

const STATUS_MAP: Record<BackupReadingRow['status'], BackupReadingStatus> = {
  NOT_SENT: 'notSent',
  SENT: 'sent',
  FAILED: 'failed',
};

// A download: the name the browser saves it under, and what is in it.
export type BackupFile<Content> = { fileName: string; content: Content };

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, ISO_DATE_LENGTH);
}

// "meter-readings-2026-11-03.json": the day it was made, so one backup never overwrites another.
function toFileName(exportedAt: Date, extension: string): string {
  return `${FILE_NAME_PREFIX}-${toIsoDate(exportedAt)}.${extension}`;
}

// Null while any part is missing: a reading sent before the email was kept has none of them. `from` may be null on
// its own: MAIL_FROM is optional.
function toSentEmail(row: BackupReadingRow): BackupReading['sentEmail'] {
  const { sentFrom, sentTo, sentSubject, sentBody, sentWithPhoto } = row;
  const isKept = sentTo !== null && sentSubject !== null && sentBody !== null && sentWithPhoto !== null;

  if (!isKept) return null;

  return { from: sentFrom, to: sentTo, subject: sentSubject, body: sentBody, hasPhoto: sentWithPhoto };
}

// The one place a row becomes a backed-up reading: the JSON holds it as is, and the CSV's columns read off it.
function toBackupReading(row: BackupReadingRow): BackupReading {
  return {
    id: row.id,
    digits: row.digits,
    date: toIsoDate(row.date),
    status: STATUS_MAP[row.status],
    sentAt: row.sentAt?.toISOString() ?? null,
    sentEmail: toSentEmail(row),
    photoFileName: row.photo?.fileName ?? null,
  };
}

async function getBackupReadings(): Promise<BackupReading[]> {
  const rows = await backupRepository.findReadings();

  // A count only: the readings are the user's data.
  log.info({ readingCount: rows.length }, 'backup made');

  return rows.map(toBackupReading);
}

// Every reading, whatever Home is filtered to.
export async function getBackup(): Promise<BackupFile<BackupResponse>> {
  const exportedAt = new Date();
  const readings = await getBackupReadings();

  return {
    fileName: toFileName(exportedAt, JSON_EXTENSION),
    content: { exportedAt: exportedAt.toISOString(), readings },
  };
}

// The same readings, one CSV line each.
export async function getBackupCsv(): Promise<BackupFile<string>> {
  const exportedAt = new Date();
  const readings = await getBackupReadings();

  return { fileName: toFileName(exportedAt, CSV_EXTENSION), content: toCsv(readings, BACKUP_CSV_COLUMNS) };
}
