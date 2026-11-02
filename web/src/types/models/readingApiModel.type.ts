import type { ReadingStatusUtil } from '@app-types/utility';
import type { PhotoId } from './photoApiModel.type';

// One reading of the meter. `digits` is text, never a number, so leading zeros survive ("00123"). `date` is the
// calendar day it was read (YYYY-MM-DD). `photoId` is the photo it was read from, null when it was saved without one.
export interface ReadingApiModel {
  id: number;
  digits: string;
  date: string;
  status: ReadingStatusUtil;
  createdAt: string;
  photoId: PhotoId | null;
}

export type ReadingId = ReadingApiModel['id'];
