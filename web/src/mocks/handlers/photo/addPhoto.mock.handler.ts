import { http, HttpResponse } from 'msw/http';
import { delay } from 'msw/utils/delay';
import type { PhotoApiModel } from '@app-types/models';
import { MOCK_DELAY } from '@mocks/handlers';
import { addMockPhoto } from './photoMockState';

export default (baseUrl: string) => [
  http.post(`${baseUrl}/photos`, async ({ request }): Promise<HttpResponse<PhotoApiModel>> => {
    await delay(MOCK_DELAY);

    const saved = addMockPhoto(await request.blob());

    return HttpResponse.json(saved, { status: 201 });
  }),
];
