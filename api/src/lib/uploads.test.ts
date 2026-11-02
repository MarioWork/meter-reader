import { readFile } from 'node:fs/promises';
import { buffer } from 'node:stream/consumers';
import { openUpload, removeUpload, saveUpload, uploadPath } from './uploads.ts';

const CONTENTS = Buffer.from('the photo of the meter');
const JPEG_EXTENSION = '.jpg';

describe('saveUpload', () => {
  it('keeps the contents under a name the server chose when a file is saved', async () => {
    const fileName = await saveUpload(CONTENTS, JPEG_EXTENSION);

    expect(fileName).toMatch(/^[0-9a-f-]{36}\.jpg$/);
    expect(await readFile(uploadPath(fileName))).toEqual(CONTENTS);
  });
});

describe('openUpload', () => {
  it('streams the contents back with their size when the file exists', async () => {
    const fileName = await saveUpload(CONTENTS, JPEG_EXTENSION);

    const upload = await openUpload(fileName);

    expect(upload?.sizeBytes).toBe(CONTENTS.length);
    expect(await buffer(upload!.stream)).toEqual(CONTENTS);
  });

  it('answers undefined when the file is gone', async () => {
    const fileName = await saveUpload(CONTENTS, JPEG_EXTENSION);
    await removeUpload(fileName);

    expect(await openUpload(fileName)).toBeUndefined();
  });
});

describe('removeUpload', () => {
  it('does nothing when the file is already gone', async () => {
    await expect(removeUpload('00000000-0000-0000-0000-000000000000.jpg')).resolves.toBeUndefined();
  });
});

describe('uploadPath', () => {
  it('throws INVALID_UPLOAD_NAME when the name would leave the uploads folder', () => {
    expect(() => uploadPath('../.env')).toThrow(expect.objectContaining({ code: 'INVALID_UPLOAD_NAME' }));
  });
});
