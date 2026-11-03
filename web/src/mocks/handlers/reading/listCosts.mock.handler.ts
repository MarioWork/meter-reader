import { http, HttpResponse } from 'msw/http';
import { delay } from 'msw/utils/delay';
import type { CostListApiModel } from '@app-types/models';
import { MOCK_DELAY } from '@mocks/handlers';
import { getMockCostReadings, isMockRangeBackwards, readMockDayRange, sumMockCostCents } from './costsMockList';
import { createReadingValidationErrorMockModel, type ReadingErrorMockModel } from './models/readingErrorMockModel.mock';

const BAD_REQUEST = 400;

type ListCostsMockResponse = CostListApiModel | ReadingErrorMockModel;

// Like the endpoint: every reading with a Cost or a Bill in the day range (both ends inclusive), newest first, and the
// sum of their costs. Not paged. A range that ends before it starts is refused, as the API refuses it.
export default (baseUrl: string) => [
  http.get(`${baseUrl}/readings/costs`, async ({ request }): Promise<HttpResponse<ListCostsMockResponse>> => {
    await delay(MOCK_DELAY);

    const range = readMockDayRange(request);

    if (isMockRangeBackwards(range)) {
      return HttpResponse.json(createReadingValidationErrorMockModel(), { status: BAD_REQUEST });
    }

    const readings = getMockCostReadings(request);

    return HttpResponse.json({ data: readings, totalCostCents: sumMockCostCents(readings) });
  }),
];
