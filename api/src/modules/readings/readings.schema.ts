import { z } from 'zod';
import { PaginationQuerySchema, paginatedResponseSchema } from '../../lib/pagination.ts';

// Long enough for any household meter's digit window, red digits included.
export const READING_DIGITS_MAX_LENGTH = 15;
const DIGITS_ONLY = /^\d+$/;

// `notSent` until the reading's email goes out; then `sent`, or `failed` (docs/GLOSSARY.md).
export const READING_STATUSES = ['notSent', 'sent', 'failed'] as const;

export const CreateReadingSchema = z.strictObject({
  // Text, never a number: "00123" stays "00123".
  digits: z.string().regex(DIGITS_ONLY, 'Use digits only').max(READING_DIGITS_MAX_LENGTH),
  // A calendar day (YYYY-MM-DD), the day the meter showed these digits.
  date: z.iso.date(),
  // The photo it was read from, uploaded first (POST /photos). Optional: a reading can be saved without one.
  photoId: z.number().int().positive().optional(),
});

const STATUS_SEPARATOR = ',';
const FROM_AFTER_TO_MESSAGE = 'From must be on or before to';

// A filter is trimmed, and one sent empty is no filter: the web app's url may carry `from=` once the user clears it.
function emptyAsAbsent(value: unknown): unknown {
  if (typeof value !== 'string') return value;

  return value.trim() || undefined;
}

// One or more statuses, comma-separated (`notSent,failed`), the way `sorting_fields` carries several values.
const StatusFilterSchema = z
  .string()
  .meta({ description: `One or more of ${READING_STATUSES.join(', ')}, comma-separated`, example: 'notSent,failed' })
  .transform((value) => value.split(STATUS_SEPARATOR).map((status) => status.trim()))
  .pipe(z.array(z.enum(READING_STATUSES)));

// The history narrowed to calendar days (both inclusive) and statuses, then paged. Still newest first.
export const ListReadingsQuerySchema = PaginationQuerySchema.extend({
  from: z.preprocess(emptyAsAbsent, z.iso.date().optional()),
  to: z.preprocess(emptyAsAbsent, z.iso.date().optional()),
  status: z.preprocess(emptyAsAbsent, StatusFilterSchema.optional()),
}).refine(({ from, to }) => !from || !to || from <= to, { message: FROM_AFTER_TO_MESSAGE, path: ['from'] });

export const ReadingParamsSchema = z.object({ id: z.coerce.number().int().positive() });

// The email exactly as it went out, the user's edits included. `hasPhoto`: whether the photo was attached.
export const SentEmailResponseSchema = z.object({
  // The user's address as MAIL_FROM said when it went out; null when it was not set.
  from: z.string().nullable(),
  to: z.string(),
  subject: z.string(),
  body: z.string(),
  hasPhoto: z.boolean(),
});

export const ReadingResponseSchema = z
  .object({
    id: z.number().int(),
    digits: z.string(),
    date: z.iso.date(),
    status: z.enum(READING_STATUSES),
    createdAt: z.iso.datetime(),
    // GET /photos/:id serves it; null when the reading was saved without a photo.
    photoId: z.number().int().nullable(),
    // When the mail service accepted its email; null until it is sent.
    sentAt: z.iso.datetime().nullable(),
    // Null until it is sent, and for readings sent before the email was kept.
    sentEmail: SentEmailResponseSchema.nullable(),
  })
  .meta({ id: 'Reading' });

const SUBJECT_MAX_LENGTH = 200;
const BODY_MAX_LENGTH = 5000;

// Whether the reading's photo goes with the email, said every time, never assumed. The subject and body are the
// user's edits of the preview; left out, the email uses the server's own (GET /readings/:id/email).
export const SendReadingSchema = z.strictObject({
  attachPhoto: z.boolean(),
  subject: z.string().trim().min(1).max(SUBJECT_MAX_LENGTH).optional(),
  body: z.string().trim().min(1).max(BODY_MAX_LENGTH).optional(),
});

// Exactly what POST /readings/:id/send emails: the provider's address, the subject, the body, and the photo that is
// attached when the user asks for it (null when the reading has none).
export const ReadingEmailResponseSchema = z
  .object({
    // The user's own address (MAIL_FROM), display only; null when it is not set.
    from: z.string().nullable(),
    // The provider's address saved in Settings; null until one is saved, and a send is refused until then.
    to: z.string().nullable(),
    subject: z.string(),
    body: z.string(),
    attachment: z.object({ photoId: z.number().int(), name: z.string() }).nullable(),
  })
  .meta({ id: 'ReadingEmail' });

// What every email starts with, before there is a reading to build its body from: the New reading form's preview.
export const EmailDefaultsResponseSchema = z
  .object({
    from: z.string().nullable(),
    // The provider's address saved in Settings; null until one is saved.
    to: z.string().nullable(),
    subject: z.string(),
    // The body with {date} (spelled out, "3 November 2026") and {reading} (the digits as read) to fill in.
    bodyTemplate: z.string(),
  })
  .meta({ id: 'EmailDefaults' });

export const ReadingListResponseSchema = paginatedResponseSchema(ReadingResponseSchema);

export type CreateReading = z.infer<typeof CreateReadingSchema>;
export type ListReadingsQuery = z.infer<typeof ListReadingsQuerySchema>;
export type ReadingParams = z.infer<typeof ReadingParamsSchema>;
export type SendReading = z.infer<typeof SendReadingSchema>;
export type ReadingEmailResponse = z.infer<typeof ReadingEmailResponseSchema>;
export type EmailDefaultsResponse = z.infer<typeof EmailDefaultsResponseSchema>;
export type ReadingStatus = (typeof READING_STATUSES)[number];
export type ReadingResponse = z.infer<typeof ReadingResponseSchema>;
export type ReadingListResponse = z.infer<typeof ReadingListResponseSchema>;
