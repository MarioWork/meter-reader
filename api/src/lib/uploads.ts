// The files the app keeps on disk (the photos), in UPLOADS_DIR. Domain-free: callers decide what a file is for.
import { randomUUID } from 'node:crypto';
import type { ReadStream } from 'node:fs';
import { access, constants, mkdir, open, rename, rm, writeFile } from 'node:fs/promises';
import { basename, join, resolve } from 'node:path';
import { env } from '../config/env.ts';
import { AppError } from './errors.ts';

export type OpenUpload = { stream: ReadStream; sizeBytes: number };

const UPLOADS_DIR = resolve(env.UPLOADS_DIR);
const NOT_FOUND_CODE = 'ENOENT';
// Written beside the final name, then renamed: a reader never sees half a file.
const PARTIAL_SUFFIX = '.partial';

function isFileMissing(error: unknown): boolean {
  const hasCode = typeof error === 'object' && error !== null && 'code' in error;

  return hasCode && error.code === NOT_FOUND_CODE;
}

// The full path of a stored file. Names come from saveUpload, never from a client; anything with a folder in it is
// refused all the same.
export function uploadPath(fileName: string): string {
  const isPlainName = basename(fileName) === fileName && fileName !== '' && !fileName.startsWith('.');

  if (!isPlainName) throw new AppError('Not an upload name', { code: 'INVALID_UPLOAD_NAME', isOperational: false });

  return join(UPLOADS_DIR, fileName);
}

// Run once at start: the folder exists and the api may write to it, or the start fails with a clear reason.
export async function assertUploadsWritable(): Promise<void> {
  try {
    await mkdir(UPLOADS_DIR, { recursive: true });
    await access(UPLOADS_DIR, constants.W_OK);
  } catch (error: unknown) {
    throw new AppError(`The uploads folder ${UPLOADS_DIR} is not writable (UPLOADS_DIR)`, {
      code: 'UPLOADS_NOT_WRITABLE',
      isOperational: false,
      cause: error,
    });
  }
}

// Saves the contents under a new random name with this extension (".jpg") and answers the name.
export async function saveUpload(contents: Buffer, extension: string): Promise<string> {
  const fileName = `${randomUUID()}${extension}`;
  const path = uploadPath(fileName);
  const partialPath = `${path}${PARTIAL_SUFFIX}`;

  await mkdir(UPLOADS_DIR, { recursive: true });
  await writeFile(partialPath, contents);
  await rename(partialPath, path);

  return fileName;
}

// The stored file as a stream, or undefined when it is not on disk.
export async function openUpload(fileName: string): Promise<OpenUpload | undefined> {
  try {
    const file = await open(uploadPath(fileName));
    const { size } = await file.stat();

    return { stream: file.createReadStream(), sizeBytes: size };
  } catch (error: unknown) {
    if (isFileMissing(error)) return undefined;

    throw error;
  }
}

// Removes a stored file; one that is already gone is fine.
export async function removeUpload(fileName: string): Promise<void> {
  await rm(uploadPath(fileName), { force: true });
}
