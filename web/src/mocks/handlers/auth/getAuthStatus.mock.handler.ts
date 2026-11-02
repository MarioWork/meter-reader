import { http, HttpResponse } from 'msw/http';
import { delay } from 'msw/utils/delay';
import type { AuthStatusApiModel } from '@app-types/models';
import { MOCK_DELAY } from '@mocks/handlers';
import { getMockAuthState } from './authMockState';

export default (baseUrl: string) => [
  http.get(`${baseUrl}/auth/status`, async (): Promise<HttpResponse<AuthStatusApiModel>> => {
    await delay(MOCK_DELAY);

    return HttpResponse.json({ state: getMockAuthState() });
  }),
];
