import { http, HttpResponse } from 'msw/http';
import { delay } from 'msw/utils/delay';
import { AuthStateUtil } from '@app-types/utility';
import { MOCK_DELAY } from '@mocks/handlers';
import { getMockAuthState, setMockAuthState } from './authMockState';
import { AUTH_ERROR_MOCKS } from './models/authErrorMockModel.mock';

export default (baseUrl: string) => [
  http.post(`${baseUrl}/auth/login/verify`, async () => {
    await delay(MOCK_DELAY);

    if (getMockAuthState() === AuthStateUtil.SETUP) {
      return HttpResponse.json(AUTH_ERROR_MOCKS.passkeyFailed, { status: 401 });
    }

    setMockAuthState(AuthStateUtil.SIGNED_IN);

    return new HttpResponse(null, { status: 204 });
  }),
];
