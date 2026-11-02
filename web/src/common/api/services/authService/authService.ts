import type {
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
} from '@simplewebauthn/browser';
import axios from 'axios';
import { axiosActions } from '@api/axiosActions';
import type { AuthStatusApiModel } from '@app-types/models';
import { HttpVerbsUtil, type JSONResponseUtil } from '@app-types/utility';
import type { PasskeySignIn, PasswordSignIn, SetUp, StartPasskeySetup } from './authService.type';

const BASE_AUTH_URL = '/auth';

// The one-user login (ADR 0002): a password, a passkey, or both. Every passkey "start" call returns the options for
// the browser's passkey prompt; the matching call after it sends the browser's answer. The session is an HttpOnly
// cookie the API sets and clears itself: nothing here ever sees a token.
export default {
  getStatus: async (): Promise<AuthStatusApiModel> => {
    const response = await axios.get<AuthStatusApiModel>(`${BASE_AUTH_URL}/status`);

    return response.data;
  },

  startPasskeySetup: async (
    fields: StartPasskeySetup,
  ): Promise<JSONResponseUtil<PublicKeyCredentialCreationOptionsJSON>> =>
    axiosActions<PublicKeyCredentialCreationOptionsJSON>({
      url: `${BASE_AUTH_URL}/setup/options`,
      method: HttpVerbsUtil.POST,
      data: fields,
    }),

  setUp: async (fields: SetUp): Promise<JSONResponseUtil> =>
    axiosActions({ url: `${BASE_AUTH_URL}/setup`, method: HttpVerbsUtil.POST, data: fields }),

  signInWithPassword: async (fields: PasswordSignIn): Promise<JSONResponseUtil> =>
    axiosActions({ url: `${BASE_AUTH_URL}/login/password`, method: HttpVerbsUtil.POST, data: fields }),

  startPasskeySignIn: async (): Promise<JSONResponseUtil<PublicKeyCredentialRequestOptionsJSON>> =>
    axiosActions<PublicKeyCredentialRequestOptionsJSON>({
      url: `${BASE_AUTH_URL}/login/options`,
      method: HttpVerbsUtil.POST,
    }),

  signInWithPasskey: async (fields: PasskeySignIn): Promise<JSONResponseUtil> =>
    axiosActions({ url: `${BASE_AUTH_URL}/login/passkey`, method: HttpVerbsUtil.POST, data: fields }),

  logout: async (): Promise<JSONResponseUtil> =>
    axiosActions({ url: `${BASE_AUTH_URL}/logout`, method: HttpVerbsUtil.POST }),
};
