import type { PublicKeyCredentialCreationOptionsJSON } from '@simplewebauthn/browser';
import { http, HttpResponse } from 'msw/http';
import { delay } from 'msw/utils/delay';
import { AuthStateUtil } from '@app-types/utility';
import type { StartPasskeySetup } from '@services/authService/authService.type';
import { MOCK_DELAY } from '@mocks/handlers';
import { getMockAuthState, MOCK_SETUP_CODE } from './authMockState';
import { createAuthErrorMockModel } from './models/authErrorMockModel.mock';
import { createRegistrationOptionsMockModel } from './models/passkeyOptionsMockModel.mock';

export default (baseUrl: string) => [
  http.post(
    `${baseUrl}/auth/setup/options`,
    async ({ request }): Promise<HttpResponse<PublicKeyCredentialCreationOptionsJSON | object>> => {
      await delay(MOCK_DELAY);

      if (getMockAuthState() !== AuthStateUtil.SETUP) {
        return HttpResponse.json(createAuthErrorMockModel('alreadySetUp'), { status: 409 });
      }

      const { code } = (await request.json()) as StartPasskeySetup;

      if (code !== MOCK_SETUP_CODE)
        return HttpResponse.json(createAuthErrorMockModel('invalidSetupCode'), { status: 401 });

      return HttpResponse.json(createRegistrationOptionsMockModel());
    },
  ),
];
