const CANVAS_CONTEXT = '2d';
const NO_CANVAS_MESSAGE = 'This browser cannot prepare the photo for reading.';
const CHANNELS = 4;
const LEVELS = 256;
const BLACK = 0;
const WHITE = 255;
const OPAQUE = 255;
// How bright each colour looks to the eye (ITU-R BT.601), so red digits come out dark, as they look.
const RED_WEIGHT = 0.299;
const GREEN_WEIGHT = 0.587;
const BLUE_WEIGHT = 0.114;

type GraySplit = { count: number; sum: number };

function toGray(pixels: Uint8ClampedArray): Uint8ClampedArray {
  const grays = new Uint8ClampedArray(pixels.length / CHANNELS);

  for (let i = 0; i < grays.length; i += 1) {
    const offset = i * CHANNELS;

    grays[i] = pixels[offset] * RED_WEIGHT + pixels[offset + 1] * GREEN_WEIGHT + pixels[offset + 2] * BLUE_WEIGHT;
  }

  return grays;
}

function countLevels(grays: Uint8ClampedArray): number[] {
  const counts = new Array<number>(LEVELS).fill(0);

  for (const gray of grays) counts[gray] += 1;

  return counts;
}

function spreadBetween(dark: GraySplit, light: GraySplit): number {
  const hasBothSides = dark.count > 0 && light.count > 0;

  if (!hasBothSides) return 0;

  const meanGap = dark.sum / dark.count - light.sum / light.count;

  return dark.count * light.count * meanGap * meanGap;
}

// Otsu's method: the gray level that splits the photo into the two most distinct groups (digits and wheel). It is
// worked out from each photo's own spread of grays, so a dim or washed-out photo still splits cleanly: this is
// the contrast step. A pixel below the returned level is a digit.
function findSplitLevel(grays: Uint8ClampedArray): number {
  const counts = countLevels(grays);
  const totalSum = counts.reduce((sum, count, level) => sum + count * level, 0);
  const dark: GraySplit = { count: 0, sum: 0 };
  let bestLevel = 0;
  let bestSpread = 0;

  for (let level = 1; level < LEVELS; level += 1) {
    dark.count += counts[level - 1];
    dark.sum += counts[level - 1] * (level - 1);

    const light: GraySplit = { count: grays.length - dark.count, sum: totalSum - dark.sum };
    const spread = spreadBetween(dark, light);

    if (spread > bestSpread) {
      bestSpread = spread;
      bestLevel = level;
    }
  }

  return bestLevel;
}

// Before OCR: every pixel becomes pure black or pure white (grayscale, then split at the photo's own threshold),
// which is the input Tesseract reads best. Changes the RGBA pixels in place, as a canvas's ImageData holds them.
// A photo of one flat colour has nothing to split, so it all turns white.
export function toBlackAndWhite(pixels: Uint8ClampedArray): void {
  const grays = toGray(pixels);
  const splitLevel = findSplitLevel(grays);

  for (let i = 0; i < grays.length; i += 1) {
    const offset = i * CHANNELS;
    const shade = grays[i] < splitLevel ? BLACK : WHITE;

    pixels.fill(shade, offset, offset + CHANNELS - 1);
    pixels[offset + CHANNELS - 1] = OPAQUE;
  }
}

// The photo on a canvas, black and white, ready for Tesseract. It is already shrunk, so it is drawn at its own size.
export async function drawForReading(photo: Blob): Promise<HTMLCanvasElement> {
  const bitmap = await createImageBitmap(photo);
  const canvas = document.createElement('canvas');
  const context = canvas.getContext(CANVAS_CONTEXT, { willReadFrequently: true });

  if (!context) throw new Error(NO_CANVAS_MESSAGE);

  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  context.drawImage(bitmap, 0, 0);
  bitmap.close();

  const image = context.getImageData(0, 0, canvas.width, canvas.height);

  toBlackAndWhite(image.data);
  context.putImageData(image, 0, 0);

  return canvas;
}
