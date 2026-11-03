import type { PhotoSize } from './photoShrinkUtils';
import type { BoxSizeChange, CropBox, CropPoint, PhotoCrop, PixelBox, PixelShift, QuarterTurn } from './types';

// The smallest box, so a slip of the finger never leaves nothing to read.
const MIN_BOX_SIDE = 0.05;
const QUARTER_TURN_DEGREES = 90;
const QUARTER_TURN_RADIANS = Math.PI / 2;
const MIN_PIXELS = 1;

// The whole photo as it was taken: what OCR read before the crop step, and what Skip reads.
export const WHOLE_PHOTO: PhotoCrop = { turn: 0, box: { x: 0, y: 0, width: 1, height: 1 } };

// Where the box starts: a wide, short strip across the middle, the shape of a meter's digit window.
export const DEFAULT_CROP: PhotoCrop = { turn: 0, box: { x: 0.2, y: 0.4, width: 0.6, height: 0.2 } };

const NEXT_TURN_RIGHT: Record<QuarterTurn, QuarterTurn> = { 0: 90, 90: 180, 180: 270, 270: 0 };
const NEXT_TURN_LEFT: Record<QuarterTurn, QuarterTurn> = { 0: 270, 90: 0, 180: 90, 270: 180 };

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

// Turned a quarter clockwise, a point at (x, y) lands at (1 - y, x): the box follows the part of the photo it was on.
export function turnCropRight({ turn, box }: PhotoCrop): PhotoCrop {
  const turnedBox = { x: 1 - box.y - box.height, y: box.x, width: box.height, height: box.width };

  return { turn: NEXT_TURN_RIGHT[turn], box: turnedBox };
}

// Turned a quarter anticlockwise, a point at (x, y) lands at (y, 1 - x).
export function turnCropLeft({ turn, box }: PhotoCrop): PhotoCrop {
  const turnedBox = { x: box.y, y: 1 - box.x - box.width, width: box.height, height: box.width };

  return { turn: NEXT_TURN_LEFT[turn], box: turnedBox };
}

// Moved by `by`, but never off the photo.
export function moveBox(box: CropBox, by: CropPoint): CropBox {
  const x = clamp(box.x + by.x, 0, 1 - box.width);
  const y = clamp(box.y + by.y, 0, 1 - box.height);

  return { ...box, x, y };
}

// Moved so its middle is on `point`, but never off the photo.
export function moveBoxMiddleTo(box: CropBox, point: CropPoint): CropBox {
  const middleX = box.x + box.width / 2;
  const middleY = box.y + box.height / 2;

  return moveBox(box, { x: point.x - middleX, y: point.y - middleY });
}

// Grown or shrunk around its middle, never past the photo and never to nothing.
export function resizeBox(box: CropBox, by: BoxSizeChange): CropBox {
  const width = clamp(box.width + by.width, MIN_BOX_SIDE, 1);
  const height = clamp(box.height + by.height, MIN_BOX_SIDE, 1);
  const middleX = box.x + box.width / 2;
  const middleY = box.y + box.height / 2;

  const x = clamp(middleX - width / 2, 0, 1 - width);
  const y = clamp(middleY - height / 2, 0, 1 - height);

  return { x, y, width, height };
}

// The box a drag draws, from where it started to where it is now, kept on the photo.
export function boxBetween(start: CropPoint, end: CropPoint): CropBox {
  const left = clamp(Math.min(start.x, end.x), 0, 1 - MIN_BOX_SIDE);
  const top = clamp(Math.min(start.y, end.y), 0, 1 - MIN_BOX_SIDE);
  const right = clamp(Math.max(start.x, end.x), left + MIN_BOX_SIDE, 1);
  const bottom = clamp(Math.max(start.y, end.y), top + MIN_BOX_SIDE, 1);

  return { x: left, y: top, width: right - left, height: bottom - top };
}

export function isInsideBox(point: CropPoint, box: CropBox): boolean {
  const isAcross = point.x >= box.x && point.x <= box.x + box.width;
  const isDown = point.y >= box.y && point.y <= box.y + box.height;

  return isAcross && isDown;
}

// A quarter turn either way stands the photo on its side, swapping its width and height.
export function isSidewaysTurn(turn: QuarterTurn): boolean {
  return turn === 90 || turn === 270;
}

// The whole photo, unturned: read as it was before the crop step.
export function isWholePhoto({ turn, box }: PhotoCrop): boolean {
  const wholeBox = WHOLE_PHOTO.box;
  const isWholeBox =
    box.x === wholeBox.x && box.y === wholeBox.y && box.width === wholeBox.width && box.height === wholeBox.height;

  return turn === WHOLE_PHOTO.turn && isWholeBox;
}

// The photo's size once turned: a quarter turn swaps its sides.
export function turnedSize({ width, height }: PhotoSize, turn: QuarterTurn): PhotoSize {
  if (isSidewaysTurn(turn)) return { width: height, height: width };

  return { width, height };
}

// The box in whole pixels of a photo of `size`, at least one pixel each way so there is always something to draw.
export function boxInPixels(box: CropBox, size: PhotoSize): PixelBox {
  return {
    x: Math.round(box.x * size.width),
    y: Math.round(box.y * size.height),
    width: Math.max(MIN_PIXELS, Math.round(box.width * size.width)),
    height: Math.max(MIN_PIXELS, Math.round(box.height * size.height)),
  };
}

// Sets up the canvas so drawing the photo at (0, 0) draws it turned by `turn`, as `turnedSize` is. A canvas turns
// clockwise for a positive angle; the shift puts the turned photo back on the canvas.
export function turnCanvas(context: CanvasRenderingContext2D, size: PhotoSize, turn: QuarterTurn): void {
  const shifts: Record<QuarterTurn, PixelShift> = {
    0: { x: 0, y: 0 },
    90: { x: size.height, y: 0 },
    180: { x: size.width, y: size.height },
    270: { x: 0, y: size.width },
  };
  const shift = shifts[turn];
  const quarterTurns = turn / QUARTER_TURN_DEGREES;

  context.translate(shift.x, shift.y);
  context.rotate(quarterTurns * QUARTER_TURN_RADIANS);
}
