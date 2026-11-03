import type { BackupReadingApiModel } from './backupReadingApiModel.type';

// The JSON backup: every reading, newest first, whatever Home is filtered to. `exportedAt` is an ISO timestamp.
export interface ReadingsBackupApiModel {
  exportedAt: string;
  readings: BackupReadingApiModel[];
}
