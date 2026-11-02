import type { ReadingStatusUtil } from '@app-types/utility';

// One reading of the meter. `digits` is text, never a number, so leading zeros survive ("00123"). `date` is the
// calendar day it was read (YYYY-MM-DD).
export interface ReadingApiModel {
  id: number;
  digits: string;
  date: string;
  status: ReadingStatusUtil;
  createdAt: string;
}
