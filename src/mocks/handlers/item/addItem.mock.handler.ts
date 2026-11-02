import { http, HttpResponse } from 'msw/http';
import { delay } from 'msw/utils/delay';
import type { ItemApiModel } from '@app-types/models';
import type { CreateItem } from '@services/itemService/itemService.type';
import { MOCK_DELAY } from '@mocks/handlers';
import { createItemMockModel } from './models/itemMockModel.mock';

const NEW_ITEM_ID = 1001;

export default (baseUrl: string) => [
  http.post(`${baseUrl}/items`, async ({ request }): Promise<HttpResponse<ItemApiModel>> => {
    await delay(MOCK_DELAY);

    const item = (await request.json()) as CreateItem;

    return HttpResponse.json(createItemMockModel({ ...item, id: NEW_ITEM_ID }), { status: 201 });
  }),
];
