import type { Page } from '@playwright/test';

export type PhotoFile = { name: string; mimeType: string; buffer: Buffer };
export type PhotoSize = { width: number; height: number; isJpeg: boolean };

const DATA_URL_PREFIX = /^data:image\/jpeg;base64,/;
const CAMERA_QUALITY = 0.95;

// A camera-sized JPEG drawn in the browser (noise, so it does not compress to nothing), as a phone would hand over.
export async function makeCameraPhoto(page: Page, width: number, height: number): Promise<PhotoFile> {
  const dataUrl = await page.evaluate(
    ({ width, height, quality }) => {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext('2d');
      const pixels = context?.createImageData(width, height);

      if (!context || !pixels) throw new Error('No 2d canvas in this browser');

      for (let i = 0; i < pixels.data.length; i += 1) pixels.data[i] = (i * 7919) % 256;
      context.putImageData(pixels, 0, 0);

      return canvas.toDataURL('image/jpeg', quality);
    },
    { width, height, quality: CAMERA_QUALITY },
  );

  return {
    name: 'IMG_0042.jpg',
    mimeType: 'image/jpeg',
    buffer: Buffer.from(dataUrl.replace(DATA_URL_PREFIX, ''), 'base64'),
  };
}

// Decodes the bytes in the browser: the size a viewer would show, and whether they really are a JPEG.
export async function readPhotoSize(page: Page, photo: Buffer): Promise<PhotoSize> {
  return page.evaluate(async (base64) => {
    const bytes = Uint8Array.from(atob(base64), (character) => character.charCodeAt(0));
    const bitmap = await createImageBitmap(new Blob([bytes]));
    const isJpeg = bytes[0] === 0xff && bytes[1] === 0xd8;

    return { width: bitmap.width, height: bitmap.height, isJpeg };
  }, photo.toString('base64'));
}
