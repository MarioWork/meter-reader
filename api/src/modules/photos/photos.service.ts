import { BadRequestError, NotFoundError } from '../../lib/httpErrors.ts';
import { readJpegSize } from '../../lib/jpeg.ts';
import { logger } from '../../lib/logger.ts';
import { openUpload, removeUpload, saveUpload, type OpenUpload } from '../../lib/uploads.ts';
import { photosRepository, type PhotoRow } from './photos.repository.ts';
import { PHOTO_MAX_SIDE_PX, type PhotoResponse } from './photos.schema.ts';

const log = logger.child({ module: 'photos' });

const JPEG_EXTENSION = '.jpg';
// A photo uploaded but never saved with a reading (the save failed, or the page was left) is gone after a day.
const UNLINKED_PHOTO_LIFETIME_MS = 24 * 60 * 60 * 1000;
const NOT_A_JPEG_MESSAGE = 'The photo must be a JPEG';
const TOO_LARGE_MESSAGE = `The photo must be at most ${PHOTO_MAX_SIDE_PX} px on its longest side`;
const ENTITY = 'Photo';

function toResponse(row: PhotoRow): PhotoResponse {
  return { id: row.id, createdAt: row.createdAt.toISOString() };
}

// The phone already shrank it; the server only checks that it did, so every kept photo fits in one mail.
function assertShrunkJpeg(contents: Buffer): void {
  const size = readJpegSize(contents);

  if (!size) throw new BadRequestError(NOT_A_JPEG_MESSAGE, 'PHOTO_NOT_JPEG');

  const longestSide = Math.max(size.width, size.height);

  if (longestSide > PHOTO_MAX_SIDE_PX) throw new BadRequestError(TOO_LARGE_MESSAGE, 'PHOTO_TOO_LARGE');
}

// Keeps the photo, not yet linked to a reading: saving the reading with its id links them.
export async function addPhoto(contents: Buffer): Promise<PhotoResponse> {
  assertShrunkJpeg(contents);

  const fileName = await saveUpload(contents, JPEG_EXTENSION);

  try {
    const row = await photosRepository.create({ fileName, sizeBytes: contents.length });

    log.info({ photoId: row.id }, 'photo saved');

    return toResponse(row);
  } catch (error: unknown) {
    // No row points at the file, so nothing would ever remove it.
    await removeUpload(fileName);

    throw error;
  }
}

export async function getPhotoFile(id: number): Promise<OpenUpload> {
  const row = await photosRepository.findById(id);

  if (!row) throw new NotFoundError(ENTITY, id);

  const upload = await openUpload(row.fileName);

  if (!upload) {
    log.warn({ photoId: id }, 'photo file missing from the uploads folder');

    throw new NotFoundError(ENTITY, id);
  }

  return upload;
}

async function removeUnlinkedFile(fileName: string): Promise<void> {
  try {
    await removeUpload(fileName);
  } catch (error: unknown) {
    log.warn({ err: error }, 'file of an unlinked photo not removed');
  }
}

// Run at start: the photos no reading took within a day, rows and files.
export async function deleteUnlinkedPhotos(now = new Date()): Promise<void> {
  const cutoff = new Date(now.getTime() - UNLINKED_PHOTO_LIFETIME_MS);
  const fileNames = await photosRepository.deleteUnlinkedBefore(cutoff);

  for (const fileName of fileNames) {
    await removeUnlinkedFile(fileName);
  }

  if (fileNames.length > 0) log.info({ count: fileNames.length }, 'unlinked photos removed');
}
