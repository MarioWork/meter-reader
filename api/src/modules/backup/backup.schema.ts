import { z } from 'zod';

// `notSent` until the reading's email goes out; then `sent`, or `failed` (docs/GLOSSARY.md). The same words as the
// readings routes, so a backup reads like the API.
export const BACKUP_READING_STATUSES = ['notSent', 'sent', 'failed'] as const;

// The email exactly as it went out. `hasPhoto`: whether the photo was attached.
const BackupSentEmailSchema = z.object({
  // The user's address as MAIL_FROM said when it went out; null when it was not set.
  from: z.string().nullable(),
  to: z.string(),
  subject: z.string(),
  body: z.string(),
  hasPhoto: z.boolean(),
});

// One reading with everything kept about it. A new field (Cost, Bill) is one more key here, in backup.service.ts's
// toBackupReading and in its CSV columns.
export const BackupReadingSchema = z.object({
  id: z.number().int(),
  // Text, never a number: "00123" stays "00123".
  digits: z.string(),
  date: z.iso.date(),
  status: z.enum(BACKUP_READING_STATUSES),
  // When the mail service accepted its email; null until it is sent.
  sentAt: z.iso.datetime().nullable(),
  // Null until it is sent, and for readings sent before the email was kept.
  sentEmail: BackupSentEmailSchema.nullable(),
  // The photo's file name in UPLOADS_DIR, where the file itself is; null when the reading was saved without one.
  photoFileName: z.string().nullable(),
});

// Everything as one JSON download: every reading, newest first, whatever Home is filtered to.
export const BackupResponseSchema = z
  .object({
    exportedAt: z.iso.datetime(),
    readings: z.array(BackupReadingSchema),
  })
  .meta({ id: 'Backup' });

export type BackupReading = z.infer<typeof BackupReadingSchema>;
export type BackupReadingStatus = (typeof BACKUP_READING_STATUSES)[number];
export type BackupResponse = z.infer<typeof BackupResponseSchema>;
