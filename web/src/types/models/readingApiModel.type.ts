import type { ReadingStatusUtil } from '@app-types/utility';
import type { PhotoId } from './photoApiModel.type';
import type { SentEmailApiModel } from './sentEmailApiModel.type';

// One reading of the meter. `digits` is text, never a number, so leading zeros survive ("00123"). `date` is the
// calendar day it was read (YYYY-MM-DD). `photoId` is the photo it was read from, null when it was saved without one.
// `sentAt` is when the mail service accepted its email (an ISO timestamp), null until it is sent. `sentEmail` is that
// email as it went out; null until it is sent, and for readings sent before the API kept it. `costCents` is what the
// reading cost (docs/GLOSSARY.md: Cost) in euro cents, a whole number (4210 is €42.10); null until the user adds one.
export interface ReadingApiModel {
  id: number;
  digits: string;
  date: string;
  status: ReadingStatusUtil;
  createdAt: string;
  photoId: PhotoId | null;
  sentAt: string | null;
  sentEmail: SentEmailApiModel | null;
  costCents: number | null;
}

export type ReadingId = ReadingApiModel['id'];
