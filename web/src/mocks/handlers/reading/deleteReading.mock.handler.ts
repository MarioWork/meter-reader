import { http, HttpResponse } from 'msw/http';
import { delay } from 'msw/utils/delay';
import { MOCK_DELAY } from '@mocks/handlers';
import { createReadingNotFoundMockModel } from './models/readingErrorMockModel.mock';
import { deleteMockReading } from './readingMockState';

const NO_CONTENT = 204;
const NOT_FOUND = 404;

export default (baseUrl: string) => [
  http.delete(`${baseUrl}/readings/:id`, async ({ params }) => {
    await delay(MOCK_DELAY);

    const id = Number(params.id);
    const wasDeleted = deleteMockReading(id);

    if (!wasDeleted) return HttpResponse.json(createReadingNotFoundMockModel(id), { status: NOT_FOUND });

    return new HttpResponse(null, { status: NO_CONTENT });
  }),
];
