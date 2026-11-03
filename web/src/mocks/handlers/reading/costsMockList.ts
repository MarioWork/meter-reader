// What the Costs page's two mock endpoints share, as the API's share one query: the day range from the url, and the
// readings with a Cost or a Bill in it.
import type { ReadingApiModel } from '@app-types/models';
import { ApiUrlParamsUtil } from '@app-types/utility';
import { narrowMockList } from '@mocks/mockListUtils';
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

function hasCostOrBill(reading: ReadingApiModel): boolean {
  return reading.costCents !== null || reading.bill !== null;
}

// Every reading with a Cost or a Bill in the request's day range (both ends inclusive), newest first.
export function getMockCostReadings(request: Request): ReadingApiModel[] {
  return narrowMockList(request, getMockReadings().filter(hasCostOrBill), {
    ranges: [{ from: ApiUrlParamsUtil.dateFrom, to: ApiUrlParamsUtil.dateTo, read: (reading) => reading.date }],
  });
}

export function sumMockCostCents(readings: ReadingApiModel[]): number {
  return readings.reduce((totalCents, reading) => totalCents + (reading.costCents ?? 0), 0);
}
