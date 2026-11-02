import { http, HttpResponse } from 'msw/http';
import { delay } from 'msw/utils/delay';
import type { ReadingApiModel } from '@app-types/models';
import { ReadingStatusUtil } from '@app-types/utility';
import type { CreateReading } from '@services/readingService/readingService.type';
import { MOCK_DELAY } from '@mocks/handlers';
import { addMockReading } from './readingMockState';

// A fixed save time keeps the mocks deterministic.
const MOCK_SAVED_AT = '2026-11-02T09:00:00.000Z';

export default (baseUrl: string) => [
  http.post(`${baseUrl}/readings`, async ({ request }): Promise<HttpResponse<ReadingApiModel>> => {
    await delay(MOCK_DELAY);

    const { photoId, ...reading } = (await request.json()) as CreateReading;
    const saved = addMockReading({
      ...reading,
      status: ReadingStatusUtil.NOT_SENT,
      createdAt: MOCK_SAVED_AT,
      photoId: photoId ?? null,
    });

    return HttpResponse.json(saved, { status: 201 });
  }),
];
