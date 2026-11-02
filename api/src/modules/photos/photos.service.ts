import { BadRequestError, NotFoundError } from '../../lib/httpErrors.ts';
import { readJpegSize } from '../../lib/jpeg.ts';
import { logger } from '../../lib/logger.ts';
import { openUpload, removeUpload, saveUpload, type OpenUpload } from '../../lib/uploads.ts';
import { photosRepository, type PhotoRow } from './photos.repository.ts';
import { PHOTO_MAX_SIDE_PX, type PhotoResponse } from './photos.schema.ts';

const log = logger.child({ module: 'photos' });

const JPEG_EXTENSION = '.jpg';
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
