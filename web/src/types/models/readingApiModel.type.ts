import type { ReadingStatusUtil } from '@app-types/utility';
import type { ReadingBillApiModel } from './readingBillApiModel.type';
import type { PhotoId } from './photoApiModel.type';
import type { SentEmailApiModel } from './sentEmailApiModel.type';

// One reading of the meter. `digits` is text, never a number, so leading zeros survive ("00123"). `date` is the
// calendar day it was read (YYYY-MM-DD). `photoId` is the photo it was read from, null when it was saved without one.
// `sentAt` is when the mail service accepted its email (an ISO timestamp), null until it is sent. `sentEmail` is that
// email as it went out; null until it is sent, and for readings sent before the API kept it. `costCents` is what the
// reading cost (docs/GLOSSARY.md: Cost) in euro cents, a whole number (4210 is €42.10); null until the user adds one.
// `bill` is the provider's bill for it (docs/GLOSSARY.md: Bill); null until the user adds one. Never part of its email.
// `failedAt` is when its last send failed (an ISO timestamp) and `failureReason` what the user was told then; both null
// unless it is failed, and for readings that failed before the API kept them. The reason is null too after a server bug.
export interface ReadingApiModel {
  id: number;
  digits: string;
  date: string;
  status: ReadingStatusUtil;
  createdAt: string;
  photoId: PhotoId | null;
  sentAt: string | null;
  sentEmail: SentEmailApiModel | null;
  failedAt: string | null;
  failureReason: string | null;
  costCents: number | null;
  bill: ReadingBillApiModel | null;
}

export type ReadingId = ReadingApiModel['id'];
