import { http, HttpResponse } from 'msw/http';
import { delay } from 'msw/utils/delay';
import type { UpdateReading } from '@services/readingService/readingService.type';
import { MOCK_DELAY } from '@mocks/handlers';
import { createReadingNotFoundMockModel } from './models/readingErrorMockModel.mock';
import { updateMockReading } from './readingMockState';

const NOT_FOUND = 404;

// Like the API: sets, changes or removes (null) the reading's cost, and answers the reading as it is now.
export default (baseUrl: string) => [
  http.patch(`${baseUrl}/readings/:id`, async ({ params, request }) => {
    await delay(MOCK_DELAY);

    const id = Number(params.id);
    const { costCents } = (await request.json()) as UpdateReading;
    const updated = updateMockReading(id, { costCents });

    if (!updated) return HttpResponse.json(createReadingNotFoundMockModel(id), { status: NOT_FOUND });

    return HttpResponse.json(updated);
  }),
];
