// Test helper: what a zip holds, read back with yauzl (the reading side of yazl). A folder maps to null.
import { buffer } from 'node:stream/consumers';
import { fromBuffer, type Entry, type ZipFile } from 'yauzl';

export type ZipContents = Map<string, Buffer | null>;

const FOLDER_SUFFIX = '/';

function openZip(contents: Buffer): Promise<ZipFile> {
  return new Promise((resolve, reject) => {
    fromBuffer(contents, { lazyEntries: true }, (error, zipFile) => (error ? reject(error) : resolve(zipFile)));
  });
}

// The next entry, or undefined after the last one.
function nextEntry(zipFile: ZipFile): Promise<Entry | undefined> {
  return new Promise((resolve, reject) => {
    zipFile.once('entry', resolve);
    zipFile.once('end', () => resolve(undefined));
    zipFile.once('error', reject);
    zipFile.readEntry();
  });
}

async function readEntryContents(zipFile: ZipFile, entry: Entry): Promise<Buffer | null> {
  if (entry.fileName.endsWith(FOLDER_SUFFIX)) return null;

  return buffer(await zipFile.openReadStreamPromise(entry));
}

// Every entry by its path, in the order the zip holds them.
export async function readZip(contents: Buffer): Promise<ZipContents> {
  const zipFile = await openZip(contents);
  const entries: ZipContents = new Map();

  for (let entry = await nextEntry(zipFile); entry; entry = await nextEntry(zipFile)) {
    entries.set(entry.fileName, await readEntryContents(zipFile, entry));
  }

  return entries;
}
