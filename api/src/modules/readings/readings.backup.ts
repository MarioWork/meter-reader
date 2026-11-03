// The backup: the CSV's columns, one line per reading, read off the same reading the JSON holds, where each Photo and
// Bill goes in the files zip, and what the downloads are called. A new field is one more column here.
import { toCsv, type CsvColumn } from '../../lib/csv.ts';
import type { BackupReading } from './readings.schema.ts';

// An ISO timestamp's first ten characters are its calendar day.
const ISO_DATE_LENGTH = 10;
const FILE_NAME_BASE = 'water-readings-backup';
export const JSON_EXTENSION = '.json';
export const CSV_EXTENSION = '.csv';
// The zip's folders: each file under the same name the JSON and the CSV list, so the two can be matched up.
export const PHOTOS_FOLDER = 'photos/';
export const BILLS_FOLDER = 'bills/';
const CENTS_PER_EURO = 100;
const CENTS_DIGITS = 2;

const BACKUP_CSV_COLUMNS: CsvColumn<BackupReading>[] = [
  { header: 'id', valueOf: (reading) => reading.id },
  { header: 'date', valueOf: (reading) => reading.date },
  // Text, as read: "00123" keeps its zeros.
  { header: 'digits', valueOf: (reading) => reading.digits },
  { header: 'status', valueOf: (reading) => reading.status },
  { header: 'sent_at', valueOf: (reading) => reading.sentAt },
  { header: 'sent_from', valueOf: (reading) => reading.sentEmail?.from ?? null },
  { header: 'sent_to', valueOf: (reading) => reading.sentEmail?.to ?? null },
  { header: 'sent_subject', valueOf: (reading) => reading.sentEmail?.subject ?? null },
  { header: 'sent_body', valueOf: (reading) => reading.sentEmail?.body ?? null },
  { header: 'sent_with_photo', valueOf: (reading) => reading.sentEmail?.hasPhoto ?? null },
  { header: 'photo_file_name', valueOf: (reading) => reading.photoFileName },
  { header: 'cost_euros', valueOf: (reading) => reading.costEuros },
  { header: 'bill_file_name', valueOf: (reading) => reading.billFileName },
];

// A Cost in euros with exactly 2 decimals, "42.10", worked out on the whole cents so no float ever rounds it.
export function toCostEuros(costCents: number): string {
  const euros = Math.floor(costCents / CENTS_PER_EURO);
  const cents = String(costCents % CENTS_PER_EURO).padStart(CENTS_DIGITS, '0');

  return `${euros}.${cents}`;
}

export function toReadingsBackupCsv(readings: BackupReading[]): string {
  return toCsv(readings, BACKUP_CSV_COLUMNS);
}

// water-readings-backup-2026-11-03.json: the day it was made, so one backup never overwrites another.
export function readingsBackupFileName(exportedAt: Date, extension: string): string {
  return `${FILE_NAME_BASE}-${exportedAt.toISOString().slice(0, ISO_DATE_LENGTH)}${extension}`;
}
