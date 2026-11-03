import type { BackupApiModel, BackupReadingApiModel, ReadingApiModel } from '@app-types/models';

// Fixed, so every run serves the same file: the moment the mock backup says it was made.
const MOCK_EXPORTED_AT = '2026-11-03T09:00:00.000Z';
// A photo's file name on the server is a random UUID; here one made from its id, so it stays the same every run.
const PHOTO_FILE_NAME_PREFIX = '00000000-0000-4000-8000-';
const PHOTO_ID_LENGTH = 12;
const PHOTO_EXTENSION = '.jpg';

function photoFileName(photoId: ReadingApiModel['photoId']): string | null {
  if (photoId === null) return null;

  return `${PHOTO_FILE_NAME_PREFIX}${String(photoId).padStart(PHOTO_ID_LENGTH, '0')}${PHOTO_EXTENSION}`;
}

export const createBackupReadingMockModel = (reading: ReadingApiModel): BackupReadingApiModel => ({
  id: reading.id,
  digits: reading.digits,
  date: reading.date,
  status: reading.status,
  sentAt: reading.sentAt,
  sentEmail: reading.sentEmail,
  photoFileName: photoFileName(reading.photoId),
});

// The backup of the mock history, in the order it is given (the history's, newest first).
export const createBackupMockModel = (readings: ReadingApiModel[]): BackupApiModel => ({
  exportedAt: MOCK_EXPORTED_AT,
  readings: readings.map(createBackupReadingMockModel),
});
