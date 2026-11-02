// The API's limits (docs/adr/0001: Graph takes at most 3 MB of attachments in one mail).
export const PHOTO_MAX_SIDE_PX = 2000;
export const PHOTO_MAX_BYTES = 3_000_000;
export const PHOTO_CONTENT_TYPE = 'image/jpeg';

const PHOTO_FILE_NAME = 'meter.jpg';
// Tried in turn until the JPEG fits: the first is sharp enough to read the digits, the next ones only for a photo
// that still comes out too big.
const JPEG_QUALITIES = [0.85, 0.7, 0.55];
const NOT_A_PHOTO_MESSAGE = 'This file is not a photo the app can read. Try another one.';
const TOO_BIG_MESSAGE = 'This photo is too big to send, even shrunk. Try another one.';

export type PhotoSize = { width: number; height: number };

// A photo the app could not shrink. Its message is written for the user.
export class PhotoShrinkError extends Error {}

// The size that fits within maxSide on its longest side, keeping the shape. A smaller photo keeps its size.
export function fitWithin({ width, height }: PhotoSize, maxSide: number): PhotoSize {
  const longestSide = Math.max(width, height);
  const scale = Math.min(1, maxSide / longestSide);

  return { width: Math.round(width * scale), height: Math.round(height * scale) };
}

function canvasToJpeg(canvas: HTMLCanvasElement, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, PHOTO_CONTENT_TYPE, quality));
}

async function drawShrunk(photo: Blob): Promise<HTMLCanvasElement> {
  // Turned upright from the camera's EXIF orientation (createImageBitmap's default).
  const bitmap = await createImageBitmap(photo).catch((error: unknown) => {
    throw new PhotoShrinkError(NOT_A_PHOTO_MESSAGE, { cause: error });
  });
  const size = fitWithin(bitmap, PHOTO_MAX_SIDE_PX);
  const canvas = document.createElement('canvas');

  canvas.width = size.width;
  canvas.height = size.height;
  canvas.getContext('2d')?.drawImage(bitmap, 0, 0, size.width, size.height);
  bitmap.close();

  return canvas;
}

// On the phone, before upload: any photo (camera or file) becomes a JPEG at most 2000 px on its longest side and
// under 3 MB. Throws PhotoShrinkError when the file is not a picture or will not fit.
export async function shrinkPhoto(photo: Blob): Promise<File> {
  const canvas = await drawShrunk(photo);

  for (const quality of JPEG_QUALITIES) {
    const jpeg = await canvasToJpeg(canvas, quality);
    const fits = jpeg !== null && jpeg.size <= PHOTO_MAX_BYTES;

    if (fits) return new File([jpeg], PHOTO_FILE_NAME, { type: PHOTO_CONTENT_TYPE });
  }

  throw new PhotoShrinkError(TOO_BIG_MESSAGE);
}

// The photo as a data: URL, for a preview before it is uploaded (the app's CSP allows data: images).
export function readAsDataUrl(photo: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
    reader.onerror = () => reject(reader.error ?? new Error('The photo could not be read'));
    reader.readAsDataURL(photo);
  });
}
