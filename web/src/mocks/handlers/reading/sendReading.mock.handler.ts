import { http, HttpResponse } from 'msw/http';
import { delay } from 'msw/utils/delay';
import { ReadingStatusUtil } from '@app-types/utility';
import { MOCK_DELAY } from '@mocks/handlers';
import { createReadingAlreadySentMockModel, createReadingNotFoundMockModel } from './models/readingErrorMockModel.mock';
import { findMockReading, updateMockReading } from './readingMockState';

const NOT_FOUND = 404;
const CONFLICT = 409;
// A fixed send time keeps the mocks deterministic.
const MOCK_SENT_AT = '2026-11-02T09:00:00.000Z';

// The mock mail service always accepts: a failed send is a test's own `server.use(...)`.
export default (baseUrl: string) => [
  http.post(`${baseUrl}/readings/:id/send`, async ({ params }) => {
    await delay(MOCK_DELAY);

    const id = Number(params.id);
    const reading = findMockReading(id);

    if (!reading) return HttpResponse.json(createReadingNotFoundMockModel(id), { status: NOT_FOUND });

    if (reading.status === ReadingStatusUtil.SENT) {
      return HttpResponse.json(createReadingAlreadySentMockModel(), { status: CONFLICT });
    }

    return HttpResponse.json(updateMockReading(id, { status: ReadingStatusUtil.SENT, sentAt: MOCK_SENT_AT }));
  }),
];
