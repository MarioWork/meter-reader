// How far the photo is turned clockwise before it is read, in degrees: a meter photographed sideways or upside
// down is turned until its digits read left to right.
export type QuarterTurn = 0 | 90 | 180 | 270;

// The digit window the user marks, as fractions (0 to 1) of the turned photo's width and height, from its top left.
export type CropBox = {
  x: number;
  y: number;
  width: number;
  height: number;
};

// The part of the photo OCR reads: the photo turned clockwise by `turn`, then cut down to `box`.
export type PhotoCrop = {
  turn: QuarterTurn;
  box: CropBox;
};

// A point on the turned photo, as fractions (0 to 1) of its width and height, from its top left.
export type CropPoint = { x: number; y: number };

// How much a box grows (or shrinks, below 0), as fractions of the photo.
export type BoxSizeChange = { width: number; height: number };

// A box in whole pixels of the turned photo: the crop OCR's canvas is cut to.
export type PixelBox = {
  x: number;
  y: number;
  width: number;
  height: number;
};

// A shift on the canvas, in pixels.
export type PixelShift = { x: number; y: number };
