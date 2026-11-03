import { PassThrough, Readable } from 'node:stream';
import { buffer } from 'node:stream/consumers';
import { readZip } from './zip.fixture.ts';
import { toZipStream, type ZipEntry } from './zip.ts';

const FOLDERS = ['photos/', 'bills/'];
const PRIVATE_PATH = '/uploads/7b0c2f4e-1d3a-4e5b-9f6a-2c8d1e0b3a4f.jpg';

function entryOf(path: string, contents: string): ZipEntry {
  return { path, stream: Readable.from([Buffer.from(contents)]) };
}

async function* entriesOf(...entries: ZipEntry[]): AsyncGenerator<ZipEntry> {
  for (const entry of entries) yield await Promise.resolve(entry);
}

async function* failingEntries(): AsyncGenerator<ZipEntry> {
  yield await Promise.resolve(entryOf('photos/a.jpg', 'the first photo'));

  throw Object.assign(new Error(`EACCES: permission denied, open '${PRIVATE_PATH}'`), { code: 'EACCES' });
}

describe('toZipStream', () => {
  it('holds every folder and every file under its path when files are given', async () => {
    const entries = entriesOf(entryOf('photos/a.jpg', 'the photo'), entryOf('bills/b.pdf', 'the bill'));

    const zip = await readZip(await buffer(toZipStream(FOLDERS, entries)));

    expect(zip).toEqual(
      new Map([
        ['photos/', null],
        ['bills/', null],
        ['photos/a.jpg', Buffer.from('the photo')],
        ['bills/b.pdf', Buffer.from('the bill')],
      ]),
    );
  });

  it('holds only the empty folders when there are no files', async () => {
    const zip = await readZip(await buffer(toZipStream(FOLDERS, entriesOf())));

    expect([...zip.keys()]).toEqual(FOLDERS);
  });

  it('closes the file being read when the download stops part way', async () => {
    const neverEnding = new PassThrough();
    const output = toZipStream(FOLDERS, entriesOf({ path: 'photos/a.jpg', stream: neverEnding }));

    output.destroy();

    await vi.waitFor(() => expect(neverEnding.destroyed).toBe(true));
  });

  it('fails the stream with the error code only, never the file path, when a file cannot be opened', async () => {
    const failure = buffer(toZipStream(FOLDERS, failingEntries()));

    await expect(failure).rejects.toMatchObject({
      code: 'ZIP_FAILED',
      message: 'A file could not be added to the zip (EACCES)',
      cause: undefined,
    });
  });
});
