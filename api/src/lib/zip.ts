// A zip file streamed while it is made: empty folders first, then each file read from its own stream, one at a time,
// so only one file is open and nothing is held in memory whole. Domain-free: callers decide the folders and files.
import { PassThrough, type Readable } from 'node:stream';
import { finished } from 'node:stream/promises';
import { ZipFile } from 'yazl';
import { AppError } from './errors.ts';

export const ZIP_CONTENT_TYPE = 'application/zip';
export const ZIP_EXTENSION = '.zip';

// One file in the zip: where it goes ("photos/a.jpg") and its contents.
export type ZipEntry = { path: string; stream: Readable };

const UNKNOWN_CAUSE = 'UNKNOWN';

// The system error's code (EACCES, EIO), or UNKNOWN when it has none.
function systemErrorCode(error: unknown): string {
  const hasCode = typeof error === 'object' && error !== null && 'code' in error;

  if (hasCode && typeof error.code === 'string') return error.code;

  return UNKNOWN_CAUSE;
}

// A file system error's message holds the file's path, so only its code goes on: neither the message nor the error
// itself reaches the log. An AppError is the caller's own, and kept as it is.
function toZipError(error: unknown): AppError {
  if (error instanceof AppError) return error;

  return new AppError(`A file could not be added to the zip (${systemErrorCode(error)})`, {
    code: 'ZIP_FAILED',
    isOperational: false,
  });
}

// Waits until yazl has read the whole file. A download that stops part way aborts the wait and closes the file.
async function readThrough(entry: ZipEntry, signal: AbortSignal): Promise<void> {
  try {
    await finished(entry.stream, { signal });
  } catch (error: unknown) {
    entry.stream.destroy();

    throw error;
  }
}

// The next file is asked for only once the one before it was read to the end. Anything that goes wrong on the way
// (a file, the list of files) ends the output with that error.
async function addEntries(zipFile: ZipFile, entries: AsyncIterable<ZipEntry>, output: Readable): Promise<void> {
  const stopped = new AbortController();

  output.once('close', () => stopped.abort());

  try {
    for await (const entry of entries) {
      zipFile.addReadStream(entry.stream, entry.path);
      await readThrough(entry, stopped.signal);
    }

    zipFile.end();
  } catch (error: unknown) {
    output.destroy(toZipError(error));
  }
}

// The folders end in "/" ("photos/") and are there even with no file in them. A file that fails part way fails the
// zip: the stream errors, and the download stops.
export function toZipStream(folders: string[], entries: AsyncIterable<ZipEntry>): Readable {
  const zipFile = new ZipFile();
  const output = new PassThrough();

  zipFile.outputStream.pipe(output);
  zipFile.on('error', (error: unknown) => output.destroy(toZipError(error)));

  for (const folder of folders) zipFile.addEmptyDirectory(folder);

  // Not awaited: the caller starts sending the output now, and the files are added while it is read.
  void addEntries(zipFile, entries, output);

  return output;
}
