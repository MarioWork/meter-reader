import { http, HttpResponse } from 'msw/http';
import { server, TEST_BASE_API_URL } from '@mocks/server';
import { SortingDirectionUtil } from '@app-types/utility';
import itemService, { ItemApiSearchFields, ItemApiSortingFields } from './itemService';

const API = TEST_BASE_API_URL;

describe('getItems', () => {
  it('sends the page, the sort and the search fields under their wire names', async () => {
    let receivedQuery = new URLSearchParams();
    server.use(
      http.get(`${API}/items`, ({ request }) => {
        receivedQuery = new URL(request.url).searchParams;
        return HttpResponse.json({ data: [], currentPage: 2, totalResultNumber: 0 });
      }),
    );

    await itemService.getItems({
      pagination: { page: '2', size: '20' },
      sortingField: ItemApiSortingFields.NAME,
      direction: SortingDirectionUtil.ASC,
      [ItemApiSearchFields.NAME]: 'pen',
    });

    expect(receivedQuery.get('page')).toBe('2');
    expect(receivedQuery.get('size')).toBe('20');
    expect(receivedQuery.get('sorting_fields')).toBe(ItemApiSortingFields.NAME);
    expect(receivedQuery.get('direction')).toBe(SortingDirectionUtil.ASC);
    expect(receivedQuery.get(ItemApiSearchFields.NAME)).toBe('pen');
  });

  it('returns the page the API sent', async () => {
    const response = await itemService.getItems({ pagination: { page: '1', size: '10' } });

    expect(response.data).toHaveLength(10);
    expect(response.totalResultNumber).toBe(25);
  });
});

describe('addItem', () => {
  const item = { name: 'Desk organiser' };

  it('posts the item and returns a success envelope', async () => {
    let receivedBody: unknown;
    server.use(
      http.post(`${API}/items`, async ({ request }) => {
        receivedBody = await request.json();
        return HttpResponse.json({ ...item, id: 30, creationDate: '2026-10-01T09:00:00.000Z' }, { status: 201 });
      }),
    );

    const response = await itemService.addItem(item);

    expect(receivedBody).toEqual(item);
    expect(response.success).toBe(true);
    expect(response.data?.id).toBe(30);
  });

  it('returns a failure envelope instead of throwing', async () => {
    server.use(http.post(`${API}/items`, () => HttpResponse.json({ message: 'Name already in use' }, { status: 409 })));

    const response = await itemService.addItem(item);

    expect(response).toEqual({
      success: false,
      error: { statusCode: 409 },
    });
  });
});
