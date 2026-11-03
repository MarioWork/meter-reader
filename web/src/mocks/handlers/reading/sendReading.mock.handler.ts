import { http, HttpResponse } from 'msw/http';
import { delay } from 'msw/utils/delay';
import { ReadingStatusUtil } from '@app-types/utility';
import type { SendReading } from '@services/readingService/readingService.type';
import { MOCK_DELAY } from '@mocks/handlers';
import { createProviderEmailNotSetMockModel } from '@mocks/handlers/settings/models/settingsErrorMockModel.mock';
import { getMockSettings } from '@mocks/handlers/settings/settingsMockState';
import { createReadingEmailMockModel } from './models/readingEmailMockModel.mock';
import { createReadingAlreadySentMockModel, createReadingNotFoundMockModel } from './models/readingErrorMockModel.mock';
import { findMockReading, updateMockReading } from './readingMockState';

const NOT_FOUND = 404;
const CONFLICT = 409;
// A fixed send time keeps the mocks deterministic.
const MOCK_SENT_AT = '2026-11-02T09:00:00.000Z';

// The mock mail service always accepts: a failed send is a test's own `server.use(...)`. Like the API, it keeps the
// email as it went out: the user's subject and body when they edited them, the templates filled in otherwise.
export default (baseUrl: string) => [
  http.post(`${baseUrl}/readings/:id/send`, async ({ params, request }) => {
    await delay(MOCK_DELAY);

    const id = Number(params.id);
    const reading = findMockReading(id);

    if (!reading) return HttpResponse.json(createReadingNotFoundMockModel(id), { status: NOT_FOUND });

    if (reading.status === ReadingStatusUtil.SENT) {
      return HttpResponse.json(createReadingAlreadySentMockModel(), { status: CONFLICT });
    }

    const settings = getMockSettings();
    const { to } = settings;

    if (!to) return HttpResponse.json(createProviderEmailNotSetMockModel(), { status: CONFLICT });

    const { attachPhoto, subject, body } = (await request.json()) as SendReading;
    const defaultEmail = createReadingEmailMockModel(reading, settings);
    const sentEmail = {
      from: defaultEmail.from,
      to,
      subject: subject ?? defaultEmail.subject,
      body: body ?? defaultEmail.body,
      hasPhoto: attachPhoto,
    };

    return HttpResponse.json(
      updateMockReading(id, { status: ReadingStatusUtil.SENT, sentAt: MOCK_SENT_AT, sentEmail }),
    );
  }),
];
