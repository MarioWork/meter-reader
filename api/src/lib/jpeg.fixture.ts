// Test helper: the bytes a JPEG starts with, enough for readJpegSize. Not a picture anyone could open.
type FakeJpegOptions = { width: number; height: number; paddingBytes?: number };

const START_OF_IMAGE = [0xff, 0xd8];
const END_OF_IMAGE = [0xff, 0xd9];
// APP0 "JFIF": the segment a camera JPEG usually opens with, so the reader has a segment to skip.
const JFIF_SEGMENT = [
  0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00,
];
const BASELINE_FRAME_MARKER = [0xff, 0xc0];
const FRAME_LENGTH = [0x00, 0x11];
const SAMPLE_PRECISION = 0x08;
const COLOUR_COMPONENTS = [0x03, 0x01, 0x22, 0x00, 0x02, 0x11, 0x01, 0x03, 0x11, 0x01];
const BYTE_SIZE = 256;

function twoBytes(value: number): number[] {
  return [Math.floor(value / BYTE_SIZE), value % BYTE_SIZE];
}

export function fakeJpeg({ width, height, paddingBytes = 0 }: FakeJpegOptions): Buffer {
  const frame = [...BASELINE_FRAME_MARKER, ...FRAME_LENGTH, SAMPLE_PRECISION, ...twoBytes(height), ...twoBytes(width)];

  return Buffer.concat([
    Buffer.from([...START_OF_IMAGE, ...JFIF_SEGMENT, ...frame, ...COLOUR_COMPONENTS]),
    Buffer.alloc(paddingBytes),
    Buffer.from(END_OF_IMAGE),
  ]);
}
