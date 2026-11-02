import { http, HttpResponse } from 'msw/http';
import { delay } from 'msw/utils/delay';
import { AuthStateUtil } from '@app-types/utility';
import { MOCK_DELAY } from '@mocks/handlers';
import { getMockAuthState, setMockAuthState } from './authMockState';

// Like the API: always 204, and a signed-in browser is signed out.
export default (baseUrl: string) => [
  http.post(`${baseUrl}/auth/logout`, async () => {
    await delay(MOCK_DELAY);

    if (getMockAuthState() === AuthStateUtil.SIGNED_IN) setMockAuthState(AuthStateUtil.SIGNED_OUT);

    return new HttpResponse(null, { status: 204 });
  }),
];
