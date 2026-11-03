import { http, HttpResponse } from 'msw/http';
import { delay } from 'msw/utils/delay';
import type { SettingsApiModel } from '@app-types/models';
import type { UpdateSettings } from '@services/settingsService/settingsService.type';
import { MOCK_DELAY } from '@mocks/handlers';
import { updateMockSettings } from './settingsMockState';

// The mock trusts the form's check: a refused field is a test's own `server.use(...)`. Trimmed, as the API saves it.
export default (baseUrl: string) => [
  http.put(`${baseUrl}/settings`, async ({ request }): Promise<HttpResponse<SettingsApiModel>> => {
    await delay(MOCK_DELAY);

    const { to, subjectTemplate, bodyTemplate, dateFormat } = (await request.json()) as UpdateSettings;

    return HttpResponse.json(
      updateMockSettings({
        to: to.trim(),
        subjectTemplate: subjectTemplate.trim(),
        bodyTemplate: bodyTemplate.trim(),
        dateFormat,
      }),
    );
  }),
];
