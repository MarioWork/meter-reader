import type { ReadingStatusUtil } from '@app-types/utility';
import type { SentEmailApiModel } from './sentEmailApiModel.type';

// One reading in the JSON backup, with everything kept about it. `photoFileName` is its photo's file name on the
// server, null when it was saved without one.
export interface BackupReadingApiModel {
  id: number;
  digits: string;
  date: string;
  status: ReadingStatusUtil;
  sentAt: string | null;
  sentEmail: SentEmailApiModel | null;
  photoFileName: string | null;
}
