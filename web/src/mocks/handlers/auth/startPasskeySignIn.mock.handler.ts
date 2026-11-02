import type { PublicKeyCredentialRequestOptionsJSON } from '@simplewebauthn/browser';
import { http, HttpResponse } from 'msw/http';
import { delay } from 'msw/utils/delay';
import { AuthStateUtil } from '@app-types/utility';
import { MOCK_DELAY } from '@mocks/handlers';
import { getMockAuthState } from './authMockState';
import { createAuthErrorMockModel } from './models/authErrorMockModel.mock';
import { createAuthenticationOptionsMockModel } from './models/passkeyOptionsMockModel.mock';

export default (baseUrl: string) => [
  http.post(
    `${baseUrl}/auth/login/options`,
    async (): Promise<HttpResponse<PublicKeyCredentialRequestOptionsJSON | object>> => {
      await delay(MOCK_DELAY);

      if (getMockAuthState() === AuthStateUtil.SETUP) {
        return HttpResponse.json(createAuthErrorMockModel('notSetUp'), { status: 409 });
      }

      return HttpResponse.json(createAuthenticationOptionsMockModel());
    },
  ),
];
