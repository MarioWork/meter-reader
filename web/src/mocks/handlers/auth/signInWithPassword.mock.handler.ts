import { http, HttpResponse } from 'msw/http';
import { delay } from 'msw/utils/delay';
import { AuthStateUtil } from '@app-types/utility';
import { MOCK_DELAY } from '@mocks/handlers';
import { setMockAuthState } from './authMockState';

// The mock has no password of its own: any password signs in, so the demo can always get back in. A test that needs
// a wrong password overrides this handler with server.use(...).
export default (baseUrl: string) => [
  http.post(`${baseUrl}/auth/login/password`, async () => {
    await delay(MOCK_DELAY);

    setMockAuthState(AuthStateUtil.SIGNED_IN);

    return new HttpResponse(null, { status: 204 });
  }),
];
