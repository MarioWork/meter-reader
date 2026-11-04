import { Readable } from 'node:stream';
import { z } from 'zod';
import { PaginationQuerySchema, paginatedResponseSchema } from '../../lib/pagination.ts';
import { BILL_CONTENT_TYPES } from '../bills/bills.type.ts';
import { MESSAGE_DATE_FORMATS } from '../settings/settings.type.ts';

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

// Calendar days (both inclusive) and statuses: Home's filters, the same for the history and its spreadsheet.
const READING_FILTER_SHAPE = {
  from: z.preprocess(emptyAsAbsent, z.iso.date().optional()),
  to: z.preprocess(emptyAsAbsent, z.iso.date().optional()),
  status: z.preprocess(emptyAsAbsent, StatusFilterSchema.optional()),
};

type DayRange = { from?: string; to?: string };

function isRangeInOrder({ from, to }: DayRange): boolean {
  return !from || !to || from <= to;
}

const RANGE_IN_ORDER_RULE = { message: FROM_AFTER_TO_MESSAGE, path: ['from'] };

// The history narrowed by the filters, then paged. Still newest first.
export const ListReadingsQuerySchema = PaginationQuerySchema.extend(READING_FILTER_SHAPE).refine(
  isRangeInOrder,
  RANGE_IN_ORDER_RULE,
);

// The Costs page's readings narrowed to calendar days (both inclusive), with no status. Not paged: see
// CostListResponseSchema. Its spreadsheet takes the same query, so it holds the same readings.
export const ListCostsQuerySchema = z
  .object({ from: READING_FILTER_SHAPE.from, to: READING_FILTER_SHAPE.to })
  .refine(isRangeInOrder, RANGE_IN_ORDER_RULE);

// A time zone the runtime knows (an IANA name such as Europe/Lisbon): Intl refuses any other.
function isKnownTimeZone(timeZone: string): boolean {
  try {
    new Intl.DateTimeFormat(undefined, { timeZone });

    return true;
  } catch {
    return false;
  }
}

const UNKNOWN_TIME_ZONE_MESSAGE = 'Use a time zone name such as Europe/Lisbon';
const DEFAULT_TIME_ZONE = 'UTC';

// Every reading the filters match, not a page: the spreadsheet holds them all, newest first. `timeZone` is where the
// user is, so a sent time reads as their own clock showed it; UTC when it is left out.
export const ExportReadingsQuerySchema = z
  .object({
    ...READING_FILTER_SHAPE,
    timeZone: z.preprocess(
      emptyAsAbsent,
      z
        .string()
        .refine(isKnownTimeZone, UNKNOWN_TIME_ZONE_MESSAGE)
        .default(DEFAULT_TIME_ZONE)
        .meta({ example: 'Europe/Lisbon' }),
    ),
  })
  .refine(isRangeInOrder, RANGE_IN_ORDER_RULE);

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

// The most a Postgres `integer` column holds: a bigger cost would fail in the database instead of in validation.
const COST_CENTS_MAX = 2_147_483_647;

// A Cost (docs/GLOSSARY.md) in euro cents: a whole number, so 42,10 € is 4210 and never a rounded float. 0 or more.
const CostCentsSchema = z.number().int().min(0).max(COST_CENTS_MAX);

// The reading's Bill (docs/GLOSSARY.md): GET /bills/:id serves it. `name` is what the app shows: the name the file had
// on the user's device, or "bill-<the reading's day>" and its extension. `contentType` says what kind of file it is.
const ReadingBillSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  contentType: z.enum(BILL_CONTENT_TYPES),
  sizeBytes: z.number().int(),
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
    // When its last send failed, and the reason the user was told; null unless it is failed, and for readings that
    // failed before these were kept. The reason is null too when the failure was the server's own bug.
    failedAt: z.iso.datetime().nullable(),
    failureReason: z.string().nullable(),
    // What the reading cost, in euro cents (4210 is 42,10 €); null when the user has not added one.
    costCents: CostCentsSchema.nullable(),
    // The provider's bill for this reading; null when the user has not added one. Never part of its email.
    bill: ReadingBillSchema.nullable(),
  })
  .meta({ id: 'Reading' });

// A reading beside another one in the history (by date, then the one saved last): its id for the link to it, and its
// digits and day for the water used between them.
const ReadingNeighbourSchema = z.object({
  id: z.number().int(),
  digits: z.string(),
  date: z.iso.date(),
});

// One reading for its own page, with what the page needs beside it in the same answer: `previous` is the reading just
// before it by date (null for the first one ever), `next` the one just after (null for the newest).
export const ReadingDetailsResponseSchema = ReadingResponseSchema.extend({
  previous: ReadingNeighbourSchema.nullable(),
  next: ReadingNeighbourSchema.nullable(),
}).meta({ id: 'ReadingDetails' });

// What can change on a reading after it is saved. A field left out stays as it is; one sent as null is removed.
// `billId` is a bill uploaded first (POST /bills): it replaces the reading's bill, whose file is deleted.
export const UpdateReadingSchema = z.strictObject({
  costCents: CostCentsSchema.nullable().optional(),
  billId: z.number().int().positive().nullable().optional(),
});

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
    // The templates saved in Settings, with {date} and {reading} (the digits as read) to fill in.
    subjectTemplate: z.string(),
    bodyTemplate: z.string(),
    // How {date} is written, as chosen in Settings, so the form fills it in the way a send would.
    dateFormat: z.enum(MESSAGE_DATE_FORMATS),
  })
  .meta({ id: 'EmailDefaults' });

export const ReadingListResponseSchema = paginatedResponseSchema(ReadingResponseSchema);

// Every reading with a Cost or a Bill in the range, newest first, and the sum of their costs in euro cents (a reading
// with only a Bill adds nothing). Not paged: the chart needs every bar in the range, and one meter read about monthly
// makes a dozen readings a year.
export const CostListResponseSchema = z
  .object({
    data: z.array(ReadingResponseSchema),
    totalCostCents: z.number().int().min(0),
  })
  .meta({ id: 'CostList' });

// An .xlsx file, the readings' or the costs'. Binary: a Buffer goes out as is (Fastify never serialises one); the
// schema documents it as a file.
export const SpreadsheetResponseSchema = z.instanceof(Buffer).meta({ type: 'string', format: 'binary' });

// The files zip, streamed: Fastify sends a stream as it is (never serialised); the schema documents it as a file.
export const ReadingsFilesBackupResponseSchema = z.instanceof(Readable).meta({ type: 'string', format: 'binary' });

// One reading in the backup, with everything kept about it. A new field is one more key here, in readings.service.ts's
// toBackupReading and in readings.backup.ts's CSV columns.
export const BackupReadingSchema = z.object({
  id: z.number().int(),
  // Text, never a number: "00123" stays "00123".
  digits: z.string(),
  date: z.iso.date(),
  status: z.enum(READING_STATUSES),
  // When the mail service accepted its email; null until it is sent.
  sentAt: z.iso.datetime().nullable(),
  // Null until it is sent, and for readings sent before the email was kept.
  sentEmail: SentEmailResponseSchema.nullable(),
  // The photo's file name in UPLOADS_DIR, where the file itself is; null when the reading was saved without one.
  photoFileName: z.string().nullable(),
  // What it cost (docs/GLOSSARY.md: Cost), in euros with exactly 2 decimals ("42.10"): text, so the decimals are
  // kept as they are. Null when it has none.
  costEuros: z.string().nullable(),
  // The bill's file name in UPLOADS_DIR, as in the files zip's bills/ folder; null when it has none.
  billFileName: z.string().nullable(),
});

// The JSON backup: every reading, newest first, whatever Home is filtered to.
export const ReadingsBackupResponseSchema = z
  .object({
    exportedAt: z.iso.datetime(),
    readings: z.array(BackupReadingSchema),
  })
  .meta({ id: 'ReadingsBackup' });

export type CreateReading = z.infer<typeof CreateReadingSchema>;
export type ListReadingsQuery = z.infer<typeof ListReadingsQuerySchema>;
export type ExportReadingsQuery = z.infer<typeof ExportReadingsQuerySchema>;
export type ListCostsQuery = z.infer<typeof ListCostsQuerySchema>;
export type ReadingParams = z.infer<typeof ReadingParamsSchema>;
export type SendReading = z.infer<typeof SendReadingSchema>;
export type UpdateReading = z.infer<typeof UpdateReadingSchema>;
export type ReadingEmailResponse = z.infer<typeof ReadingEmailResponseSchema>;
export type EmailDefaultsResponse = z.infer<typeof EmailDefaultsResponseSchema>;
export type ReadingStatus = (typeof READING_STATUSES)[number];
export type ReadingResponse = z.infer<typeof ReadingResponseSchema>;
export type ReadingNeighbour = z.infer<typeof ReadingNeighbourSchema>;
export type ReadingDetailsResponse = z.infer<typeof ReadingDetailsResponseSchema>;
export type ReadingListResponse = z.infer<typeof ReadingListResponseSchema>;
export type CostListResponse = z.infer<typeof CostListResponseSchema>;
export type BackupReading = z.infer<typeof BackupReadingSchema>;
export type ReadingsBackupResponse = z.infer<typeof ReadingsBackupResponseSchema>;
