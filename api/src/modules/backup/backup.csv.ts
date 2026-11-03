// The CSV backup's columns, one line per reading, read off the same reading the JSON backup holds. A new field is one
// more column here.
import type { CsvColumn } from '../../lib/csv.ts';
import type { BackupReading } from './backup.schema.ts';

export const BACKUP_CSV_COLUMNS: CsvColumn<BackupReading>[] = [
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
];
