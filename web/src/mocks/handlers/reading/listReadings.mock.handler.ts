import { http, HttpResponse } from 'msw/http';
import { delay } from 'msw/utils/delay';
import type { ReadingApiModel } from '@app-types/models';
import { ApiUrlParamsUtil, type ResponseWithPaginationUtil } from '@app-types/utility';
import { paginateMockList } from '@mocks/mockListUtils';
import { MOCK_DELAY } from '@mocks/handlers';
import { createReadingValidationErrorMockModel, type ReadingErrorMockModel } from './models/readingErrorMockModel.mock';
import { ReadingApiSearchFields } from '@services/readingService/readingService';
import { getMockReadings } from './readingMockState';

const BAD_REQUEST = 400;

type ListReadingsMockResponse = ResponseWithPaginationUtil<ReadingApiModel> | ReadingErrorMockModel;

// Like the endpoint: a day range (both ends inclusive) and any of several statuses, then a page. No sort fields: the
// history is always newest first. A range that ends before it starts is refused, as the API refuses it.
export default (baseUrl: string) => [
  http.get(`${baseUrl}/readings`, async ({ request }): Promise<HttpResponse<ListReadingsMockResponse>> => {
    await delay(MOCK_DELAY);

    const params = new URL(request.url).searchParams;
    const dateFrom = params.get(ApiUrlParamsUtil.dateFrom);
    const dateTo = params.get(ApiUrlParamsUtil.dateTo);
    const isRangeBackwards = Boolean(dateFrom && dateTo && dateFrom > dateTo);

    if (isRangeBackwards) {
      return HttpResponse.json(createReadingValidationErrorMockModel(), { status: BAD_REQUEST });
    }

    return HttpResponse.json(
      paginateMockList(request, getMockReadings(), {
        choices: { [ReadingApiSearchFields.STATUS]: (reading) => reading.status },
        ranges: [{ from: ApiUrlParamsUtil.dateFrom, to: ApiUrlParamsUtil.dateTo, read: (reading) => reading.date }],
      }),
    );
  }),
];
