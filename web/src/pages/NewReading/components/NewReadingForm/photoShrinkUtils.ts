import { PHOTO_CONTENT_TYPE, PHOTO_MAX_BYTES, PHOTO_MAX_SIDE_PX } from '@utils/photoUtils';

const PHOTO_FILE_NAME = 'meter.jpg';
// Tried in turn until the JPEG fits: the first is sharp enough to read the digits, the next ones only for a photo
// that still comes out too big.
const JPEG_QUALITIES = [0.85, 0.7, 0.55];
const CANVAS_CONTEXT = '2d';
const NOT_A_PHOTO_MESSAGE = 'This file is not a photo the app can read. Try another one.';
const NO_CANVAS_MESSAGE = 'This browser cannot shrink the photo. Try another browser.';
const TOO_BIG_MESSAGE = 'This photo is too big to send, even shrunk. Try another one.';

export type PhotoSize = { width: number; height: number };

// A photo the app could not shrink or show. Its message is written for the user.
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

async function decodePhoto(photo: Blob): Promise<ImageBitmap> {
  try {
    // Turned upright from the camera's EXIF orientation (createImageBitmap's default).
    return await createImageBitmap(photo);
  } catch (error) {
    throw new PhotoShrinkError(NOT_A_PHOTO_MESSAGE, { cause: error });
  }
}

async function drawShrunk(photo: Blob): Promise<HTMLCanvasElement> {
  const bitmap = await decodePhoto(photo);
  const size = fitWithin(bitmap, PHOTO_MAX_SIDE_PX);
  const canvas = document.createElement('canvas');
  const context = canvas.getContext(CANVAS_CONTEXT);

  if (!context) throw new PhotoShrinkError(NO_CANVAS_MESSAGE);

  canvas.width = size.width;
  canvas.height = size.height;
  context.drawImage(bitmap, 0, 0, size.width, size.height);
  bitmap.close();

  return canvas;
}

// On the phone, before upload: any photo (camera or file) becomes a JPEG at most 2000 px on its longest side and
// under 3 MB. Throws PhotoShrinkError when the file is not a photo or will not fit.
export async function shrinkPhoto(photo: Blob): Promise<File> {
  const canvas = await drawShrunk(photo);

  for (const quality of JPEG_QUALITIES) {
    const jpeg = await canvasToJpeg(canvas, quality);
    const fits = jpeg !== null && jpeg.size <= PHOTO_MAX_BYTES;

    if (fits) return new File([jpeg], PHOTO_FILE_NAME, { type: PHOTO_CONTENT_TYPE });
  }

  throw new PhotoShrinkError(TOO_BIG_MESSAGE);
}

// The photo as a data: URL, for a preview before it is uploaded (the app's CSP allows data: images). Rejects with
// PhotoShrinkError, so the picker shows why.
export function readAsDataUrl(photo: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
    reader.onerror = () => reject(new PhotoShrinkError(NOT_A_PHOTO_MESSAGE, { cause: reader.error }));
    reader.readAsDataURL(photo);
  });
}
