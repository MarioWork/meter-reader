import { http, HttpResponse } from 'msw/http';
import { delay } from 'msw/utils/delay';
import { MOCK_DELAY } from '@mocks/handlers';
import { getMockSettings } from '@mocks/handlers/settings/settingsMockState';
import { createReadingPreviewMockModel } from './models/readingEmailMockModel.mock';
import { createReadingNotFoundMockModel } from './models/readingErrorMockModel.mock';
import { findMockReading } from './readingMockState';

const NOT_FOUND = 404;

export default (baseUrl: string) => [
  http.get(`${baseUrl}/readings/:id/email`, async ({ params }) => {
    await delay(MOCK_DELAY);

    const id = Number(params.id);
    const reading = findMockReading(id);

    if (!reading) return HttpResponse.json(createReadingNotFoundMockModel(id), { status: NOT_FOUND });

    return HttpResponse.json(createReadingPreviewMockModel(reading, getMockSettings()));
  }),
];
