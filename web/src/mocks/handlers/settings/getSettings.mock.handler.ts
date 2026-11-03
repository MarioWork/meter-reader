import { http, HttpResponse } from 'msw/http';
import { delay } from 'msw/utils/delay';
import type { SettingsApiModel } from '@app-types/models';
import { MOCK_DELAY } from '@mocks/handlers';
import { getMockSettings } from './settingsMockState';

export default (baseUrl: string) => [
  http.get(`${baseUrl}/settings`, async (): Promise<HttpResponse<SettingsApiModel>> => {
    await delay(MOCK_DELAY);

    return HttpResponse.json(getMockSettings());
  }),
];
