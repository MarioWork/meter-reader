import { http, HttpResponse } from 'msw/http';
import { delay } from 'msw/utils/delay';
import { ItemApiSearchFields, ItemApiSortingFields } from '@services/itemService/itemService';
import type { ItemApiModel } from '@app-types/models';
import type { ResponseWithPaginationUtil } from '@app-types/utility';
import { paginateMockList } from '@mocks/mockListUtils';
import { MOCK_DELAY } from '@mocks/handlers';
import { createItemMockModelList, ITEM_MOCK_COUNT } from './models/itemMockModel.mock';

export default (baseUrl: string) => [
  http.get(`${baseUrl}/items`, async ({ request }): Promise<HttpResponse<ResponseWithPaginationUtil<ItemApiModel>>> => {
    await delay(MOCK_DELAY);

    return HttpResponse.json(
      paginateMockList(request, createItemMockModelList(ITEM_MOCK_COUNT), {
        filters: {
          [ItemApiSearchFields.NAME]: (item) => item.name,
        },
        sorts: {
          [ItemApiSortingFields.NAME]: (item) => item.name,
          [ItemApiSortingFields.CREATION_DATE]: (item) => item.creationDate,
        },
      }),
    );
  }),
];
