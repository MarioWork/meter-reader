import { env } from '../../config/env.ts';
import { getErrorLogFields } from '../../lib/databaseErrors.ts';
import { AppError } from '../../lib/errors.ts';
import {
  BadGatewayError,
  BadRequestError,
  ConflictError,
  ContentTooLargeError,
  HttpError,
  NotFoundError,
} from '../../lib/httpErrors.ts';
import { logger } from '../../lib/logger.ts';
import { toSkipTake } from '../../lib/pagination.ts';
import { readUpload, removeUpload } from '../../lib/uploads.ts';
import { assertMailConnected, sendMail } from '../mail/mail.service.ts';
import type { MailAttachment, OutgoingMail } from '../mail/mail.type.ts';
import { readingsRepository, type ReadingFilter, type ReadingRow, type SentEmail } from './readings.repository.ts';
import type {
  CreateReading,
  ListReadingsQuery,
  ReadingEmailResponse,
  ReadingListResponse,
  ReadingResponse,
  ReadingStatus,
  SendReading,
  EmailDefaultsResponse,
} from './readings.schema.ts';

const log = logger.child({ module: 'readings' });

const ENTITY = 'Reading';
const PHOTO_NOT_AVAILABLE_MESSAGE = 'This photo does not exist or already belongs to another reading';

// An ISO timestamp's first ten characters are its calendar day.
const ISO_DATE_LENGTH = 10;

const JPEG_CONTENT_TYPE = 'image/jpeg';
const ALREADY_SENT_MESSAGE = 'This reading was sent already';
const BEING_SENT_MESSAGE = 'This reading is being sent already';
const NO_PHOTO_MESSAGE = 'This reading has no photo to attach';
const PHOTO_FILE_MISSING_MESSAGE = 'The photo is missing on the server. Send the reading without it';
// The day in the email, spelled out so the provider cannot misread it: "31 October 2026". A calendar day, so UTC.
const EMAIL_DATE_FORMAT = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});
// How a failed send answers, by its code. Anything else is Microsoft's doing: a bad gateway.
const SEND_FAILURE_ERRORS: Record<string, (message: string, code: string) => HttpError> = {
  MAIL_TOO_LARGE: (message, code) => new ContentTooLargeError(message, code),
  PHOTO_FILE_MISSING: (message, code) => new ConflictError(message, code),
};

// The readings whose email is going out right now, so a double tap cannot send one twice. The api is one process,
// so this set sees every send.
const readingsBeingSent = new Set<number>();

const STATUS_MAP: Record<ReadingRow['status'], ReadingStatus> = {
  NOT_SENT: 'notSent',
  SENT: 'sent',
  FAILED: 'failed',
};

// The other way round, for a status filter.
const ROW_STATUS_MAP: Record<ReadingStatus, ReadingRow['status']> = {
  notSent: 'NOT_SENT',
  sent: 'SENT',
  failed: 'FAILED',
};

// A Postgres `date` comes back as midnight UTC of that day, and goes in the same way.
function toDate(isoDate: string): Date {
  return new Date(`${isoDate}T00:00:00.000Z`);
}

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, ISO_DATE_LENGTH);
}

// Null while any part is missing: a reading sent before the email was kept has none of them. `from` may be null on
// its own: MAIL_FROM is optional.
function toSentEmailResponse(row: ReadingRow): ReadingResponse['sentEmail'] {
  const { sentFrom, sentTo, sentSubject, sentBody, sentWithPhoto } = row;
  const isKept = sentTo !== null && sentSubject !== null && sentBody !== null && sentWithPhoto !== null;

  if (!isKept) return null;

  return { from: sentFrom, to: sentTo, subject: sentSubject, body: sentBody, hasPhoto: sentWithPhoto };
}

function toResponse(row: ReadingRow): ReadingResponse {
  return {
    id: row.id,
    digits: row.digits,
    date: toIsoDate(row.date),
    status: STATUS_MAP[row.status],
    createdAt: row.createdAt.toISOString(),
    photoId: row.photo?.id ?? null,
    sentAt: row.sentAt?.toISOString() ?? null,
    sentEmail: toSentEmailResponse(row),
  };
}

// The body is the date and the reading exactly as read (ADR 0001), leading zeros and all.
function toEmailBody(row: ReadingRow): string {
  return `Date: ${EMAIL_DATE_FORMAT.format(row.date)}\nReading: ${row.digits}`;
}

function toAttachmentName(row: ReadingRow): string {
  return `meter-${toIsoDate(row.date)}.jpg`;
}

// The address, the subject and the body: one builder for the preview and the send, so they cannot drift apart.
function toMailContent(row: ReadingRow): OutgoingMail {
  return { to: env.PROVIDER_EMAIL, subject: env.MAIL_SUBJECT, body: toEmailBody(row) };
}

async function findReading(id: number): Promise<ReadingRow> {
  const row = await readingsRepository.findById(id);

  if (!row) throw new NotFoundError(ENTITY, id);

  return row;
}

export async function getReading(id: number): Promise<ReadingResponse> {
  return toResponse(await findReading(id));
}

export async function addReading({ digits, date, photoId }: CreateReading): Promise<ReadingResponse> {
  const row = await readingsRepository.create({ digits, date: toDate(date), photoId });

  if (!row) throw new ConflictError(PHOTO_NOT_AVAILABLE_MESSAGE, 'PHOTO_NOT_AVAILABLE');

  // The id only: the digits are the user's data.
  log.info({ readingId: row.id }, 'reading saved');

  return toResponse(row);
}

function toFilter({ from, to, status }: ListReadingsQuery): ReadingFilter {
  return {
    from: from === undefined ? undefined : toDate(from),
    to: to === undefined ? undefined : toDate(to),
    statuses: status?.map((wireStatus) => ROW_STATUS_MAP[wireStatus]),
  };
}

export async function getReadings(query: ListReadingsQuery): Promise<ReadingListResponse> {
  const { rows, total } = await readingsRepository.findPage(toSkipTake(query), toFilter(query));

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

// Exactly what sending the reading emails, so the user sees it before it goes.
export async function getReadingEmail(id: number): Promise<ReadingEmailResponse> {
  const row = await findReading(id);
  const attachment = row.photo ? { photoId: row.photo.id, name: toAttachmentName(row) } : null;

  return { from: env.MAIL_FROM ?? null, ...toMailContent(row), attachment };
}

// The parts of every email that do not depend on a reading.
export function getEmailDefaults(): EmailDefaultsResponse {
  return { from: env.MAIL_FROM ?? null, to: env.PROVIDER_EMAIL, subject: env.MAIL_SUBJECT };
}

async function readPhotoAttachment(row: ReadingRow): Promise<MailAttachment> {
  const contents = row.photo ? await readUpload(row.photo.fileName) : undefined;

  if (!contents) throw new AppError(PHOTO_FILE_MISSING_MESSAGE, { code: 'PHOTO_FILE_MISSING' });

  return { name: toAttachmentName(row), contentType: JPEG_CONTENT_TYPE, contents };
}

// The server's subject and body, unless the user edited them in the preview. The address is never the user's to change.
async function toOutgoingMail(row: ReadingRow, { attachPhoto, subject, body }: SendReading): Promise<OutgoingMail> {
  const defaultMail = toMailContent(row);
  const mail = { ...defaultMail, subject: subject ?? defaultMail.subject, body: body ?? defaultMail.body };

  if (!attachPhoto) return mail;

  return { ...mail, attachment: await readPhotoAttachment(row) };
}

// What the user is told when the email did not go out: the mail module's own message, never more. A bug stays a
// bug (500).
function toHttpSendError(error: unknown): unknown {
  if (error instanceof HttpError) return error;

  const isExpected = error instanceof AppError && error.isOperational;

  if (!isExpected) return error;

  const toHttpError = SEND_FAILURE_ERRORS[error.code] ?? ((message, code) => new BadGatewayError(message, code));

  return toHttpError(error.message, error.code);
}

// Refusals that try nothing, and so change nothing: unknown, sent already, no photo to attach, Hotmail not connected.
async function findSendableReading(id: number, { attachPhoto }: SendReading): Promise<ReadingRow> {
  const row = await findReading(id);

  if (row.status === 'SENT') throw new ConflictError(ALREADY_SENT_MESSAGE, 'READING_ALREADY_SENT');

  const isPhotoMissing = attachPhoto && !row.photo;

  if (isPhotoMissing) throw new BadRequestError(NO_PHOTO_MESSAGE, 'NO_PHOTO_TO_ATTACH');

  await assertMailConnected();

  return row;
}

// Saving the failure must not hide why the send failed: a database error here is logged, and the user still hears
// Microsoft's reason.
async function saveFailure(id: number): Promise<void> {
  try {
    await readingsRepository.markFailed(id);
  } catch (error: unknown) {
    log.error({ readingId: id, ...getErrorLogFields(error) }, 'failed send not saved on the reading');
  }
}

// Microsoft has the email by now, so a database error here must be loud: the reading still looks unsent, and sending
// it again would email the provider twice.
async function saveSent(id: number, email: SentEmail): Promise<ReadingRow | null> {
  try {
    return await readingsRepository.markSent(id, new Date(), email);
  } catch (error: unknown) {
    log.error({ readingId: id, ...getErrorLogFields(error) }, 'reading sent, but not saved as sent');

    throw error;
  }
}

async function sendOnce(id: number, fields: SendReading): Promise<ReadingResponse> {
  const row = await findSendableReading(id, fields);
  let mail: OutgoingMail;

  try {
    mail = await toOutgoingMail(row, fields);
    await sendMail(mail);
  } catch (error: unknown) {
    await saveFailure(id);
    // The id and the stable code only: the message may name the provider.
    log.warn({ readingId: id, code: error instanceof AppError ? error.code : undefined }, 'reading not sent');

    throw toHttpSendError(error);
  }

  const sentEmail = {
    from: env.MAIL_FROM ?? null,
    to: mail.to,
    subject: mail.subject,
    body: mail.body,
    withPhoto: mail.attachment !== undefined,
  };
  const sent = await saveSent(id, sentEmail);

  if (!sent) throw new NotFoundError(ENTITY, id);

  log.info({ readingId: id }, 'reading sent');

  return toResponse(sent);
}

// Emails the reading to the provider from the user's Hotmail. Sent: the reading is marked sent, with the time. Not
// sent: it is marked failed, and the error says why, so the user can try again. Failed covers every try that did not
// reach the provider, a photo too large or missing included; only the checks in findSendableReading change nothing.
export async function sendReading(id: number, fields: SendReading): Promise<ReadingResponse> {
  if (readingsBeingSent.has(id)) throw new ConflictError(BEING_SENT_MESSAGE, 'READING_BEING_SENT');

  readingsBeingSent.add(id);

  try {
    return await sendOnce(id, fields);
  } finally {
    readingsBeingSent.delete(id);
  }
}
