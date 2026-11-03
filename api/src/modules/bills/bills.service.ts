import { APP_API_URL } from '../../lib/appOrigin.ts';
import { BadRequestError, NotFoundError } from '../../lib/httpErrors.ts';
import { logger } from '../../lib/logger.ts';
import { openUpload, removeUpload, saveUpload, type OpenUpload } from '../../lib/uploads.ts';
import { billsRepository, type BillRow } from './bills.repository.ts';
import type { BillResponse } from './bills.schema.ts';
import type { BillContentType } from './bills.type.ts';

const log = logger.child({ module: 'bills' });

// A bill uploaded but never saved with a reading (the save failed, or the page was left) is gone after a day.
const UNLINKED_BILL_LIFETIME_MS = 24 * 60 * 60 * 1000;
const NOT_SUPPORTED_MESSAGE = 'The bill must be a PDF, JPEG or PNG';
const ENTITY = 'Bill';
// An ISO timestamp's first ten characters are its calendar day.
const ISO_DATE_LENGTH = 10;
const DOWNLOAD_NAME_PREFIX = 'bill';
// Where the bills routes are mounted (app.ts).
const BILLS_PATH = '/bills';
// Long enough for any real file name, short enough for one line of the app.
const ORIGINAL_NAME_MAX_LENGTH = 200;
// Both systems' path separators: only what comes after the last one is the file's own name.
const PATH_SEPARATORS = /[/\\]/;
const WHITESPACE_RUNS = /\s+/g;
// Control and invisible format characters. A right-to-left override would make "bill\u202Efdp.exe" show as
// "billexe.pdf".
const HIDDEN_CHARACTERS = /[\p{Cc}\p{Cf}]/gu;
const ONLY_DOTS = /^\.+$/;
// A file name's own extension: a dot and a few letters or digits at its end (".pdf", ".jpeg").
const EXTENSION = /\.[\p{L}\p{N}]{1,10}$/u;

type BillFileType = BillRow['fileType'];

// What a bill's name is made from: the name it came with, else its kind (and its reading's day, when it has one).
type NamedBill = Pick<BillRow, 'originalName' | 'fileType'>;

// What each kind of bill is on the wire and on disk, and the first bytes every file of that kind starts with.
type BillFormat = { contentType: BillContentType; extension: string; signature: Buffer };

const BILL_FORMATS: Record<BillFileType, BillFormat> = {
  PDF: { contentType: 'application/pdf', extension: '.pdf', signature: Buffer.from('%PDF-') },
  JPEG: { contentType: 'image/jpeg', extension: '.jpg', signature: Buffer.from([0xff, 0xd8, 0xff]) },
  PNG: {
    contentType: 'image/png',
    extension: '.png',
    signature: Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  },
};

const BILL_FILE_TYPES = Object.keys(BILL_FORMATS) as BillFileType[];

// `downloadName` is ASCII, for the browsers that cannot read `name`.
export type BillFile = OpenUpload & { contentType: BillContentType; name: string; downloadName: string };

// What a bill of this kind is sent as. For the readings, which answer their bill too.
export function toBillContentType(fileType: BillFileType): BillContentType {
  return BILL_FORMATS[fileType].contentType;
}

// The absolute address a bill opens at, for a link outside the web app (a spreadsheet's). Built from a numeric id only.
export function toBillUrl(id: number): string {
  return `${APP_API_URL}${BILLS_PATH}/${id}`;
}

// "bill-2026-11-03.pdf": the reading's day, so a folder of saved bills sorts by date; "bill.pdf" before it has one.
// Built by the server, so it is plain ASCII.
function toDownloadName(fileType: BillFileType, readingDate: Date | null): string {
  const { extension } = BILL_FORMATS[fileType];

  if (!readingDate) return `${DOWNLOAD_NAME_PREFIX}${extension}`;

  return `${DOWNLOAD_NAME_PREFIX}-${readingDate.toISOString().slice(0, ISO_DATE_LENGTH)}${extension}`;
}

// What the app calls the bill: the name it had on the user's device, else its download name. For the readings too.
export function toBillName(bill: NamedBill, readingDate: Date | null): string {
  return bill.originalName ?? toDownloadName(bill.fileType, readingDate);
}

function toResponse(row: BillRow): BillResponse {
  return {
    id: row.id,
    name: toBillName(row, row.reading?.date ?? null),
    contentType: toBillContentType(row.fileType),
    sizeBytes: row.sizeBytes,
    createdAt: row.createdAt.toISOString(),
  };
}

function startsWith(contents: Buffer, signature: Buffer): boolean {
  return contents.subarray(0, signature.length).equals(signature);
}

// The kind of file the bytes are, read from how they start: never from the client's content type or file name.
function detectFileType(contents: Buffer): BillFileType {
  const fileType = BILL_FILE_TYPES.find((type) => startsWith(contents, BILL_FORMATS[type].signature));

  if (!fileType) throw new BadRequestError(NOT_SUPPORTED_MESSAGE, 'BILL_NOT_SUPPORTED');

  return fileType;
}

function decodeName(sentName: string): string | null {
  try {
    return decodeURIComponent(sentName);
  } catch {
    return null;
  }
}

// At most 200 characters, counted as the user sees them. A longer name loses the end of its stem, not its extension,
// so "….pdf" still says what it is.
function capLength(name: string): string {
  const characters = Array.from(name);

  if (characters.length <= ORIGINAL_NAME_MAX_LENGTH) return name;

  const extension = EXTENSION.exec(name)?.[0] ?? '';
  const stemLength = ORIGINAL_NAME_MAX_LENGTH - Array.from(extension).length;

  return `${characters.slice(0, stemLength).join('').trimEnd()}${extension}`;
}

// The name the client sent, made safe to show: its last path part only, on one line, nothing hidden in it, at most
// 200 characters. Null when nothing is left. Only ever shown and sent back, never used as a path.
function toOriginalName(sentName: string | undefined): string | null {
  const decoded = sentName === undefined ? null : decodeName(sentName);

  if (decoded === null) return null;

  const ownName = decoded.split(PATH_SEPARATORS).at(-1) ?? '';
  // Spaces first, so a tab or a line break still parts two words once the hidden characters are gone.
  const visible = ownName.normalize('NFC').replace(WHITESPACE_RUNS, ' ').replace(HIDDEN_CHARACTERS, '');
  const cleaned = capLength(visible.replace(WHITESPACE_RUNS, ' ')).trim();
  const isNameless = cleaned === '' || ONLY_DOTS.test(cleaned);

  return isNameless ? null : cleaned;
}

// Keeps the bill, not yet linked to a reading: updating the reading with its id links them. The size limit is the
// route's body limit. `sentName` is the name the file had on the user's device, percent-encoded.
export async function addBill(contents: Buffer, sentName?: string): Promise<BillResponse> {
  const fileType = detectFileType(contents);
  const originalName = toOriginalName(sentName);
  const fileName = await saveUpload(contents, BILL_FORMATS[fileType].extension);

  try {
    const row = await billsRepository.create({ fileName, fileType, originalName, sizeBytes: contents.length });

    log.info({ billId: row.id }, 'bill saved');

    return toResponse(row);
  } catch (error: unknown) {
    // No row points at the file, so nothing would ever remove it.
    await removeUpload(fileName);

    throw error;
  }
}

export async function getBillFile(id: number): Promise<BillFile> {
  const row = await billsRepository.findById(id);

  if (!row) throw new NotFoundError(ENTITY, id);

  const upload = await openUpload(row.fileName);

  if (!upload) {
    log.warn({ billId: id }, 'bill file missing from the uploads folder');

    throw new NotFoundError(ENTITY, id);
  }

  const readingDate = row.reading?.date ?? null;

  return {
    ...upload,
    contentType: toBillContentType(row.fileType),
    name: toBillName(row, readingDate),
    downloadName: toDownloadName(row.fileType, readingDate),
  };
}

async function removeUnlinkedFile(fileName: string): Promise<void> {
  try {
    await removeUpload(fileName);
  } catch (error: unknown) {
    log.warn({ err: error }, 'file of an unlinked bill not removed');
  }
}

// Run at start: the bills no reading took within a day, rows and files.
export async function deleteUnlinkedBills(now = new Date()): Promise<void> {
  const cutoff = new Date(now.getTime() - UNLINKED_BILL_LIFETIME_MS);
  const fileNames = await billsRepository.deleteUnlinkedBefore(cutoff);

  for (const fileName of fileNames) {
    await removeUnlinkedFile(fileName);
  }

  if (fileNames.length > 0) log.info({ count: fileNames.length }, 'unlinked bills removed');
}
