import { fakeJpeg } from './jpeg.fixture.ts';
import { readJpegSize } from './jpeg.ts';

describe('readJpegSize', () => {
  it('reads the width and the height when the file is a JPEG', () => {
    const size = readJpegSize(fakeJpeg({ width: 2000, height: 1500 }));

    expect(size).toEqual({ width: 2000, height: 1500 });
  });

  it('reads the width and the height when the JPEG is progressive', () => {
    const progressive = fakeJpeg({ width: 800, height: 600 });
    const frameMarkerIndex = progressive.indexOf(Buffer.from([0xff, 0xc0]));
    progressive[frameMarkerIndex + 1] = 0xc2;

    expect(readJpegSize(progressive)).toEqual({ width: 800, height: 600 });
  });

  it('answers undefined when the file is not a JPEG', () => {
    const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

    expect(readJpegSize(png)).toBeUndefined();
  });

  it('answers undefined when the JPEG ends before its size', () => {
    const cut = fakeJpeg({ width: 800, height: 600 }).subarray(0, 24);

    expect(readJpegSize(cut)).toBeUndefined();
  });

  it('answers undefined when the file is empty', () => {
    expect(readJpegSize(Buffer.alloc(0))).toBeUndefined();
  });
});
