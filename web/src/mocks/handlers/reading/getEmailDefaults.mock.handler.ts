import { http, HttpResponse } from 'msw/http';
import { delay } from 'msw/utils/delay';
import { MOCK_DELAY } from '@mocks/handlers';
import { getMockSettings } from '@mocks/handlers/settings/settingsMockState';
import { createEmailDefaultsMockModel } from './models/readingEmailMockModel.mock';

// Before getReading's handler, which would otherwise take "email-defaults" for a reading id.
export default (baseUrl: string) => [
  http.get(`${baseUrl}/readings/email-defaults`, async () => {
    await delay(MOCK_DELAY);

    return HttpResponse.json(createEmailDefaultsMockModel(getMockSettings()));
  }),
];
