// Reads a JPEG's pixel size from its header, without decoding the picture. Domain-free.
export type JpegSize = { width: number; height: number };

const MARKER_PREFIX = 0xff;
const START_OF_IMAGE = 0xd8;
const START_OF_SCAN = 0xda;
const END_OF_IMAGE = 0xd9;
// The "start of frame" markers that carry the size: C0–CF, except C4 (Huffman tables), C8 (reserved) and CC
// (arithmetic coding conditions).
const FRAME_MARKERS = new Set([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf]);
// After a frame marker: 2 bytes of length, 1 of precision, then the height and the width, 2 bytes each.
const HEIGHT_OFFSET = 5;
const WIDTH_OFFSET = 7;
const FRAME_HEADER_BYTES = 9;
const MARKER_BYTES = 2;

function startsAsJpeg(contents: Buffer): boolean {
  return contents[0] === MARKER_PREFIX && contents[1] === START_OF_IMAGE;
}

function readFrameSize(contents: Buffer, markerOffset: number): JpegSize | undefined {
  const isComplete = markerOffset + FRAME_HEADER_BYTES <= contents.length;

  if (!isComplete) return undefined;

  return {
    height: contents.readUInt16BE(markerOffset + HEIGHT_OFFSET),
    width: contents.readUInt16BE(markerOffset + WIDTH_OFFSET),
  };
}

// The size of a JPEG, or undefined when the bytes are not one (or end before its size). Walks the segments from the
// start of the file to the first frame header; the picture data after it is never read.
export function readJpegSize(contents: Buffer): JpegSize | undefined {
  if (!startsAsJpeg(contents)) return undefined;

  let offset = MARKER_BYTES;

  while (offset + MARKER_BYTES + MARKER_BYTES <= contents.length) {
    if (contents[offset] !== MARKER_PREFIX) return undefined;

    const marker = contents[offset + 1] ?? END_OF_IMAGE;
    const isPictureData = marker === START_OF_SCAN || marker === END_OF_IMAGE;

    if (FRAME_MARKERS.has(marker)) return readFrameSize(contents, offset);

    if (isPictureData) return undefined;

    offset += MARKER_BYTES + contents.readUInt16BE(offset + MARKER_BYTES);
  }

  return undefined;
}
