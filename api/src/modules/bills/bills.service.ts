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

type BillFileType = BillRow['fileType'];

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

export type BillFile = OpenUpload & { contentType: BillContentType; downloadName: string };

// What a bill of this kind is sent as. For the readings, which answer their bill too.
export function toBillContentType(fileType: BillFileType): BillContentType {
  return BILL_FORMATS[fileType].contentType;
}

// The absolute address a bill opens at, for a link outside the web app (a spreadsheet's). Built from a numeric id only.
export function toBillUrl(id: number): string {
  return `${APP_API_URL}${BILLS_PATH}/${id}`;
}

function toResponse(row: BillRow): BillResponse {
  return {
    id: row.id,
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

// Keeps the bill, not yet linked to a reading: updating the reading with its id links them. The size limit is the
// route's body limit.
export async function addBill(contents: Buffer): Promise<BillResponse> {
  const fileType = detectFileType(contents);
  const fileName = await saveUpload(contents, BILL_FORMATS[fileType].extension);

  try {
    const row = await billsRepository.create({ fileName, fileType, sizeBytes: contents.length });

    log.info({ billId: row.id }, 'bill saved');

    return toResponse(row);
  } catch (error: unknown) {
    // No row points at the file, so nothing would ever remove it.
    await removeUpload(fileName);

    throw error;
  }
}

// "bill-2026-11-03.pdf": the reading's day, so a folder of downloaded bills sorts by date. Built by the server, never
// from the name the file had on the user's device.
function toDownloadName(row: BillRow): string {
  const { extension } = BILL_FORMATS[row.fileType];

  if (!row.reading) return `${DOWNLOAD_NAME_PREFIX}${extension}`;

  return `${DOWNLOAD_NAME_PREFIX}-${row.reading.date.toISOString().slice(0, ISO_DATE_LENGTH)}${extension}`;
}

export async function getBillFile(id: number): Promise<BillFile> {
  const row = await billsRepository.findById(id);

  if (!row) throw new NotFoundError(ENTITY, id);

  const upload = await openUpload(row.fileName);

  if (!upload) {
    log.warn({ billId: id }, 'bill file missing from the uploads folder');

    throw new NotFoundError(ENTITY, id);
  }

  return { ...upload, contentType: toBillContentType(row.fileType), downloadName: toDownloadName(row) };
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
