import type { Page } from '@playwright/test';

export type PhotoFile = { name: string; mimeType: string; buffer: Buffer };
export type PhotoSize = { width: number; height: number; isJpeg: boolean };

const DATA_URL_PREFIX = /^data:image\/jpeg;base64,/;
const CAMERA_QUALITY = 0.95;
// Pixel values that change from byte to byte, so the JPEG stays big, as a real photo does.
const NOISE_STEP = 7919;
const BYTE_VALUES = 256;

// A camera-sized JPEG drawn in the browser (noise, so it does not compress to nothing), as a phone would hand over.
export async function makeCameraPhoto(page: Page, width: number, height: number): Promise<PhotoFile> {
  const dataUrl = await page.evaluate(
    ({ width, height, quality, noiseStep, byteValues }) => {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext('2d');
      const pixels = context?.createImageData(width, height);

      if (!context || !pixels) throw new Error('No 2d canvas in this browser');

      for (let i = 0; i < pixels.data.length; i += 1) pixels.data[i] = (i * noiseStep) % byteValues;
      context.putImageData(pixels, 0, 0);

      return canvas.toDataURL('image/jpeg', quality);
    },
    { width, height, quality: CAMERA_QUALITY, noiseStep: NOISE_STEP, byteValues: BYTE_VALUES },
  );

  return {
    name: 'IMG_0042.jpg',
    mimeType: 'image/jpeg',
    buffer: Buffer.from(dataUrl.replace(DATA_URL_PREFIX, ''), 'base64'),
  };
}

// A plain meter face drawn in the browser: dark digits on a light wheel strip, on a grey body, with a slight
// gradient so the photo is not already pure black and white. Big enough for OCR to read without a crop.
export async function makeMeterPhoto(page: Page, digits: string): Promise<PhotoFile> {
  const dataUrl = await page.evaluate((digitsShown) => {
    const canvas = document.createElement('canvas');
    canvas.width = 1600;
    canvas.height = 1200;
    const context = canvas.getContext('2d');

    if (!context) throw new Error('No 2d canvas in this browser');

    const body = context.createLinearGradient(0, 0, canvas.width, canvas.height);
    body.addColorStop(0, '#9a9a9a');
    body.addColorStop(1, '#6f6f6f');
    context.fillStyle = body;
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = '#e8e8e0';
    context.fillRect(250, 450, 1100, 300);
    context.fillStyle = '#1a1a1a';
    context.font = 'bold 200px monospace';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(digitsShown, canvas.width / 2, 600);

    return canvas.toDataURL('image/jpeg', 0.9);
  }, digits);

  return {
    name: 'IMG_0043.jpg',
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
