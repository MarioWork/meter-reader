import type { ReadingStatusUtil } from '@app-types/utility';
import type { SentEmailApiModel } from './sentEmailApiModel.type';

// One reading in the JSON backup, with everything kept about it. `photoFileName` is its photo's file name on the
// server, null when it was saved without one. `costEuros` is its Cost in euros with exactly 2 decimals, as text
// ("42.10"), and `billFileName` its Bill's file name on the server; each null when it has none. The files zip holds
// each Photo and Bill under these same names.
export interface BackupReadingApiModel {
  id: number;
  digits: string;
  date: string;
  status: ReadingStatusUtil;
  sentAt: string | null;
  sentEmail: SentEmailApiModel | null;
  photoFileName: string | null;
  costEuros: string | null;
  billFileName: string | null;
}
