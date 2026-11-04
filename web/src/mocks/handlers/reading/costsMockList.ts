// What the Costs page's two mock endpoints share, as the API's share one query: the day range from the url, and the
// readings in it, with or without a Cost or a Bill.
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

// Every reading in the request's day range (both ends inclusive), newest first; only the Costs count in the sum.
export function getMockCostReadings(request: Request): ReadingApiModel[] {
  return narrowMockList(request, getMockReadings(), {
    ranges: [{ from: ApiUrlParamsUtil.dateFrom, to: ApiUrlParamsUtil.dateTo, read: (reading) => reading.date }],
  });
}

export function sumMockCostCents(readings: ReadingApiModel[]): number {
  return readings.reduce((totalCents, reading) => totalCents + (reading.costCents ?? 0), 0);
}
