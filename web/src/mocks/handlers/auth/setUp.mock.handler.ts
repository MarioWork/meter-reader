import { http, HttpResponse } from 'msw/http';
import { delay } from 'msw/utils/delay';
import { AuthStateUtil } from '@app-types/utility';
import type { SetUp } from '@services/authService/authService.type';
import { MOCK_DELAY } from '@mocks/handlers';
import { getMockAuthState, MOCK_SETUP_CODE, setMockAuthState } from './authMockState';
import { createAuthErrorMockModel } from './models/authErrorMockModel.mock';

export default (baseUrl: string) => [
  http.post(`${baseUrl}/auth/setup`, async ({ request }) => {
    await delay(MOCK_DELAY);

    if (getMockAuthState() !== AuthStateUtil.SETUP) {
      return HttpResponse.json(createAuthErrorMockModel('alreadySetUp'), { status: 409 });
    }

    const { code } = (await request.json()) as SetUp;

    if (code !== MOCK_SETUP_CODE)
      return HttpResponse.json(createAuthErrorMockModel('invalidSetupCode'), { status: 401 });

    setMockAuthState(AuthStateUtil.SIGNED_IN);

    return new HttpResponse(null, { status: 204 });
  }),
];
