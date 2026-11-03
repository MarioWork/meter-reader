// What the Costs page's two mock endpoints share, as the API's share one query: the day range from the url, and the
// readings with a Cost or a Bill in it.
import type { ReadingApiModel } from '@app-types/models';
import { ApiUrlParamsUtil } from '@app-types/utility';
import { getMockReadings } from './readingMockState';

export type MockDayRange = { dateFrom: string | null; dateTo: string | null };

export function readMockDayRange(request: Request): MockDayRange {
  const params = new URL(request.url).searchParams;

  return { dateFrom: params.get(ApiUrlParamsUtil.dateFrom), dateTo: params.get(ApiUrlParamsUtil.dateTo) };
}

// A range that ends before it starts, which the API refuses.
export function isMockRangeBackwards({ dateFrom, dateTo }: MockDayRange): boolean {
  return Boolean(dateFrom && dateTo && dateFrom > dateTo);
}

// YYYY-MM-DD strings sort as the days do; an end left out is open.
function isInRange(reading: ReadingApiModel, { dateFrom, dateTo }: MockDayRange): boolean {
  const isOnOrAfterFrom = !dateFrom || reading.date >= dateFrom;
  const isOnOrBeforeTo = !dateTo || reading.date <= dateTo;

  return isOnOrAfterFrom && isOnOrBeforeTo;
}

function hasCostOrBill(reading: ReadingApiModel): boolean {
  return reading.costCents !== null || reading.bill !== null;
}

// Every reading with a Cost or a Bill in the range (both ends inclusive), newest first.
export function getMockCostReadings(range: MockDayRange): ReadingApiModel[] {
  return getMockReadings().filter((reading) => hasCostOrBill(reading) && isInRange(reading, range));
}

export function sumMockCostCents(readings: ReadingApiModel[]): number {
  return readings.reduce((totalCents, reading) => totalCents + (reading.costCents ?? 0), 0);
}
