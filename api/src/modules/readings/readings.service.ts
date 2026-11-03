import type { Readable } from 'node:stream';
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
import { openUpload, readUpload, removeUpload } from '../../lib/uploads.ts';
import { toZipStream, ZIP_EXTENSION, type ZipEntry } from '../../lib/zip.ts';
import { toBillContentType } from '../bills/bills.service.ts';
import { assertMailConnected, sendMail } from '../mail/mail.service.ts';
import {
  fillMessageTemplate,
  formatMessageDate,
  getMessageSettings,
  getProviderEmail,
  requireProviderEmail,
} from '../settings/settings.service.ts';
import type { MessageSettings, MessageValues } from '../settings/settings.type.ts';
import type { MailAttachment, OutgoingMail } from '../mail/mail.type.ts';
import { readingsRepository, type ReadingFilter, type ReadingRow, type SentEmail } from './readings.repository.ts';
import {
  BILLS_FOLDER,
  CSV_EXTENSION,
  JSON_EXTENSION,
  PHOTOS_FOLDER,
  readingsBackupFileName,
  toCostEuros,
  toReadingsBackupCsv,
} from './readings.backup.ts';
import { readingsSpreadsheetFileName, toReadingsSpreadsheet, type ReadingSheetLine } from './readings.spreadsheet.ts';
import type {
  BackupReading,
  CostListResponse,
  CreateReading,
  ReadingsBackupResponse,
  ExportReadingsQuery,
  ListCostsQuery,
  ListReadingsQuery,
  ReadingEmailResponse,
  ReadingListResponse,
  ReadingResponse,
  ReadingStatus,
  SendReading,
  UpdateReading,
  EmailDefaultsResponse,
} from './readings.schema.ts';

const log = logger.child({ module: 'readings' });

const ENTITY = 'Reading';
const PHOTO_NOT_AVAILABLE_MESSAGE = 'This photo does not exist or already belongs to another reading';
const BILL_NOT_AVAILABLE_MESSAGE = 'This bill does not exist or already belongs to another reading';

// An ISO timestamp's first ten characters are its calendar day.
const ISO_DATE_LENGTH = 10;

const JPEG_CONTENT_TYPE = 'image/jpeg';
const ALREADY_SENT_MESSAGE = 'This reading was sent already';
const BEING_SENT_MESSAGE = 'This reading is being sent already';
const NO_PHOTO_MESSAGE = 'This reading has no photo to attach';
const PHOTO_FILE_MISSING_MESSAGE = 'The photo is missing on the server. Send the reading without it';
// How a failed send answers, by its code. Anything else is Microsoft's doing: a bad gateway.
const SEND_FAILURE_ERRORS: Record<string, (message: string, code: string) => HttpError> = {
  MAIL_TOO_LARGE: (message, code) => new ContentTooLargeError(message, code),
  PHOTO_FILE_MISSING: (message, code) => new ConflictError(message, code),
};

// The readings whose email is going out right now, so a double tap cannot send one twice. The api is one process,
// so this set sees every send.
const readingsBeingSent = new Set<number>();

// The filters alone, whichever query carries them.
type ReadingFilterQuery = Pick<ListReadingsQuery, 'from' | 'to' | 'status'>;

// The spreadsheet's bytes, and the name the download saves it under.
export type ReadingsSpreadsheet = { fileName: string; content: Buffer };

// A backup download: what is in it, and the name the browser saves it under.
export type ReadingsBackupFile<Content> = { fileName: string; content: Content };

// One stored file for the files zip: the folder it goes in, its name on disk, and the ids a log line may carry.
type BackupFile = {
  folder: typeof PHOTOS_FOLDER | typeof BILLS_FOLDER;
  fileName: string;
  logIds: { readingId: number; photoId?: number; billId?: number };
};

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

function toBillResponse({ bill }: ReadingRow): ReadingResponse['bill'] {
  if (!bill) return null;

  return { id: bill.id, contentType: toBillContentType(bill.fileType), sizeBytes: bill.sizeBytes };
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
    costCents: row.costCents,
    bill: toBillResponse(row),
  };
}

function toAttachmentName(row: ReadingRow): string {
  return `meter-${toIsoDate(row.date)}.jpg`;
}

// The subject and the body, filled in from the templates in Settings with the reading exactly as read (leading zeros
// and all) and its day written in the date format chosen there. One builder for the preview and the send, so they
// cannot drift apart.
function toMailText(row: ReadingRow, settings: MessageSettings): Pick<OutgoingMail, 'subject' | 'body'> {
  const values: MessageValues = { reading: row.digits, date: formatMessageDate(row.date, settings.dateFormat) };

  return { subject: fillMessageTemplate(settings.subject, values), body: fillMessageTemplate(settings.body, values) };
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

// A file left behind on disk is only wasted space, and the change is saved by now: logged, never a failed update.
async function removeFile(fileName: string, logFields: object, message: string): Promise<void> {
  try {
    await removeUpload(fileName);
  } catch (error: unknown) {
    // Ids only: the error's message holds the file's path, never anything the user typed.
    log.warn({ ...logFields, err: error }, message);
  }
}

// Sets, changes or removes (null) the reading's cost and its bill. A bill replaced or removed is deleted, its file
// too. Nothing here touches its email: the cost and the bill are never sent.
export async function updateReading(id: number, { costCents, billId }: UpdateReading): Promise<ReadingResponse> {
  const update = await readingsRepository.update(id, { costCents, billId });

  if (update.outcome === 'notFound') throw new NotFoundError(ENTITY, id);

  if (update.outcome === 'billNotAvailable') throw new ConflictError(BILL_NOT_AVAILABLE_MESSAGE, 'BILL_NOT_AVAILABLE');

  if (update.removedBillFileName) {
    await removeFile(update.removedBillFileName, { readingId: id }, 'file of a replaced bill not removed');
  }

  // The id only: the cost is the user's data.
  log.info({ readingId: id }, 'reading updated');

  return toResponse(update.row);
}

function toFilter({ from, to, status }: ReadingFilterQuery): ReadingFilter {
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

function sumCostCents(rows: ReadingRow[]): number {
  return rows.reduce((totalCents, row) => totalCents + (row.costCents ?? 0), 0);
}

// The Costs page: every reading with a Cost in the range, and what they cost together.
export async function getCosts(query: ListCostsQuery): Promise<CostListResponse> {
  const rows = await readingsRepository.findWithCost(toFilter(query));

  return { data: rows.map(toResponse), totalCostCents: sumCostCents(rows) };
}

function toSheetLine(row: ReadingRow): ReadingSheetLine {
  return { date: row.date, digits: row.digits, status: STATUS_MAP[row.status], sentAt: row.sentAt };
}

// Every reading Home's filters match, not only the pages it has loaded, newest first, as an .xlsx file named
// after the filters.
export async function getReadingsSpreadsheet(query: ExportReadingsQuery): Promise<ReadingsSpreadsheet> {
  const rows = await readingsRepository.findAll(toFilter(query));
  const content = await toReadingsSpreadsheet(rows.map(toSheetLine), query.timeZone);
  const fileName = readingsSpreadsheetFileName(query);

  return { fileName, content };
}

// The one place a row becomes a backed-up reading: the JSON holds it as is, and the CSV's columns read off it.
function toBackupReading(row: ReadingRow): BackupReading {
  return {
    id: row.id,
    digits: row.digits,
    date: toIsoDate(row.date),
    status: STATUS_MAP[row.status],
    sentAt: row.sentAt?.toISOString() ?? null,
    sentEmail: toSentEmailResponse(row),
    photoFileName: row.photo?.fileName ?? null,
    costEuros: row.costCents === null ? null : toCostEuros(row.costCents),
    billFileName: row.bill?.fileName ?? null,
  };
}

// Every reading, whatever Home is filtered to: no filter, no page.
async function getBackupReadings(): Promise<BackupReading[]> {
  const rows = await readingsRepository.findAll({});

  // A count only: the readings are the user's data.
  log.info({ readingCount: rows.length }, 'backup made');

  return rows.map(toBackupReading);
}

export async function getReadingsBackup(): Promise<ReadingsBackupFile<ReadingsBackupResponse>> {
  const exportedAt = new Date();
  const readings = await getBackupReadings();

  return {
    fileName: readingsBackupFileName(exportedAt, JSON_EXTENSION),
    content: { exportedAt: exportedAt.toISOString(), readings },
  };
}

// The same readings, one CSV line each.
export async function getReadingsBackupCsv(): Promise<ReadingsBackupFile<string>> {
  const exportedAt = new Date();
  const readings = await getBackupReadings();

  return { fileName: readingsBackupFileName(exportedAt, CSV_EXTENSION), content: toReadingsBackupCsv(readings) };
}

// The reading's Photo and Bill, whichever it has.
function toBackupFiles({ id, photo, bill }: ReadingRow): BackupFile[] {
  const files: BackupFile[] = [];

  if (photo)
    files.push({ folder: PHOTOS_FOLDER, fileName: photo.fileName, logIds: { readingId: id, photoId: photo.id } });

  if (bill) files.push({ folder: BILLS_FOLDER, fileName: bill.fileName, logIds: { readingId: id, billId: bill.id } });

  return files;
}

// Each file opened only when the zip is ready for it. One missing on disk is left out, and the download goes on.
async function* openBackupFiles(files: BackupFile[]): AsyncGenerator<ZipEntry> {
  for (const { folder, fileName, logIds } of files) {
    const upload = await openUpload(fileName);

    // The ids only: the file's name is the user's data.
    if (!upload) {
      log.warn(logIds, 'file missing on disk, left out of the files backup');
      continue;
    }

    yield { path: `${folder}${fileName}`, stream: upload.stream };
  }
}

// Every Photo in photos/ and every Bill in bills/, under the names the JSON and the CSV list, streamed as it is made.
export async function getReadingsFilesBackup(): Promise<ReadingsBackupFile<Readable>> {
  const exportedAt = new Date();
  const rows = await readingsRepository.findAll({});
  const files = rows.flatMap(toBackupFiles);

  // A count only: the files are the user's data.
  log.info({ fileCount: files.length }, 'files backup started');

  return {
    fileName: readingsBackupFileName(exportedAt, ZIP_EXTENSION),
    content: toZipStream([PHOTOS_FOLDER, BILLS_FOLDER], openBackupFiles(files)),
  };
}

// Deleting the reading already deleted its photo and bill rows (cascade); this removes their files from the uploads
// folder. The rows are gone by then, so a file that cannot be removed is logged, not turned into a failed delete.
async function removeReadingFiles({ id, photo, bill }: ReadingRow): Promise<void> {
  if (photo) {
    await removeFile(
      photo.fileName,
      { readingId: id, photoId: photo.id },
      'photo file of a deleted reading not removed',
    );
  }

  if (bill) {
    await removeFile(bill.fileName, { readingId: id, billId: bill.id }, 'bill file of a deleted reading not removed');
  }
}

export async function deleteReading(id: number): Promise<void> {
  const row = await readingsRepository.deleteById(id);

  if (!row) throw new NotFoundError(ENTITY, id);

  await removeReadingFiles(row);

  log.info({ readingId: id }, 'reading deleted');
}

// Exactly what sending the reading emails, so the user sees it before it goes. `to` is null while no address is saved
// in Settings: the web app then turns Send off.
export async function getReadingEmail(id: number): Promise<ReadingEmailResponse> {
  const row = await findReading(id);
  const attachment = row.photo ? { photoId: row.photo.id, name: toAttachmentName(row) } : null;
  const [to, messageSettings] = await Promise.all([getProviderEmail(), getMessageSettings()]);

  return { from: env.MAIL_FROM ?? null, to, ...toMailText(row, messageSettings), attachment };
}

// The parts of every email that do not depend on a reading, with the templates still to fill in and the date format
// to fill {date} in with.
export async function getEmailDefaults(): Promise<EmailDefaultsResponse> {
  const [to, { subject, body, dateFormat }] = await Promise.all([getProviderEmail(), getMessageSettings()]);

  return { from: env.MAIL_FROM ?? null, to, subjectTemplate: subject, bodyTemplate: body, dateFormat };
}

async function readPhotoAttachment(row: ReadingRow): Promise<MailAttachment> {
  const contents = row.photo ? await readUpload(row.photo.fileName) : undefined;

  if (!contents) throw new AppError(PHOTO_FILE_MISSING_MESSAGE, { code: 'PHOTO_FILE_MISSING' });

  return { name: toAttachmentName(row), contentType: JPEG_CONTENT_TYPE, contents };
}

// The subject and body filled in from the current templates, unless the user edited them in the preview. The address
// is the one in Settings, never the preview's to change.
async function toOutgoingMail(
  { row, to }: SendableReading,
  { attachPhoto, subject, body }: SendReading,
): Promise<OutgoingMail> {
  const defaultText = toMailText(row, await getMessageSettings());
  const mail = { to, subject: subject ?? defaultText.subject, body: body ?? defaultText.body };

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

// A reading that passed every check before a send, with the address it goes to.
type SendableReading = { row: ReadingRow; to: string };

// Refusals that try nothing, and so change nothing: unknown, sent already, no photo to attach, no provider address,
// Hotmail not connected.
async function findSendableReading(id: number, { attachPhoto }: SendReading): Promise<SendableReading> {
  const row = await findReading(id);

  if (row.status === 'SENT') throw new ConflictError(ALREADY_SENT_MESSAGE, 'READING_ALREADY_SENT');

  const isPhotoMissing = attachPhoto && !row.photo;

  if (isPhotoMissing) throw new BadRequestError(NO_PHOTO_MESSAGE, 'NO_PHOTO_TO_ATTACH');

  const to = await requireProviderEmail();

  await assertMailConnected();

  return { row, to };
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
  const sendable = await findSendableReading(id, fields);
  let mail: OutgoingMail;

  try {
    mail = await toOutgoingMail(sendable, fields);
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
