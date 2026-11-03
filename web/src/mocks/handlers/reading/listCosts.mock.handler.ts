import { http, HttpResponse } from 'msw/http';
import { delay } from 'msw/utils/delay';
import type { CostListApiModel, ReadingApiModel } from '@app-types/models';
import { ApiUrlParamsUtil } from '@app-types/utility';
import { MOCK_DELAY } from '@mocks/handlers';
import { createReadingValidationErrorMockModel, type ReadingErrorMockModel } from './models/readingErrorMockModel.mock';
import { getMockReadings } from './readingMockState';

const BAD_REQUEST = 400;

type ListCostsMockResponse = CostListApiModel | ReadingErrorMockModel;

type DayRange = { dateFrom: string | null; dateTo: string | null };

// YYYY-MM-DD strings sort as the days do; an end left out is open.
function isInRange(reading: ReadingApiModel, { dateFrom, dateTo }: DayRange): boolean {
  const isOnOrAfterFrom = !dateFrom || reading.date >= dateFrom;
  const isOnOrBeforeTo = !dateTo || reading.date <= dateTo;

  return isOnOrAfterFrom && isOnOrBeforeTo;
}

function sumCostCents(readings: ReadingApiModel[]): number {
  return readings.reduce((totalCents, reading) => totalCents + (reading.costCents ?? 0), 0);
}

// Like the endpoint: every reading with a cost in the day range (both ends inclusive), newest first, and their sum.
// Not paged. A range that ends before it starts is refused, as the API refuses it.
export default (baseUrl: string) => [
  http.get(`${baseUrl}/readings/costs`, async ({ request }): Promise<HttpResponse<ListCostsMockResponse>> => {
    await delay(MOCK_DELAY);

    const params = new URL(request.url).searchParams;
    const range = { dateFrom: params.get(ApiUrlParamsUtil.dateFrom), dateTo: params.get(ApiUrlParamsUtil.dateTo) };
    const isRangeBackwards = Boolean(range.dateFrom && range.dateTo && range.dateFrom > range.dateTo);

    if (isRangeBackwards) {
      return HttpResponse.json(createReadingValidationErrorMockModel(), { status: BAD_REQUEST });
    }

    const readingsWithCost = getMockReadings().filter(
      (reading) => reading.costCents !== null && isInRange(reading, range),
    );

    return HttpResponse.json({ data: readingsWithCost, totalCostCents: sumCostCents(readingsWithCost) });
  }),
];
