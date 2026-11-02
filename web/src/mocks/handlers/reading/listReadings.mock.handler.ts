import { http, HttpResponse } from 'msw/http';
import { delay } from 'msw/utils/delay';
import type { ReadingApiModel } from '@app-types/models';
import type { ResponseWithPaginationUtil } from '@app-types/utility';
import { paginateMockList } from '@mocks/mockListUtils';
import { MOCK_DELAY } from '@mocks/handlers';
import { getMockReadings } from './readingMockState';

// The endpoint takes a page only: no filters, no sort fields (the history is always newest first).
export default (baseUrl: string) => [
  http.get(
    `${baseUrl}/readings`,
    async ({ request }): Promise<HttpResponse<ResponseWithPaginationUtil<ReadingApiModel>>> => {
      await delay(MOCK_DELAY);

      return HttpResponse.json(paginateMockList(request, getMockReadings()));
    },
  ),
];
