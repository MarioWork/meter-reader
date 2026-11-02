import { http, HttpResponse } from 'msw/http';
import { AuthStateUtil } from '@app-types/utility';
import { MOCK_SETUP_CODE, setMockAuthState } from '@mocks/handlers/auth/authMockState';
import { server, TEST_BASE_API_URL } from '@mocks/server';
import authService from './authService';

const API = TEST_BASE_API_URL;
const PASSWORD = 'the meter lives under the stairs';

describe('getStatus', () => {
  it('returns where the login stands', async () => {
    setMockAuthState(AuthStateUtil.SIGNED_OUT);

    expect(await authService.getStatus()).toEqual({ state: AuthStateUtil.SIGNED_OUT });
  });
});

describe('setUp', () => {
  it('posts the code and the password and returns a success envelope', async () => {
    setMockAuthState(AuthStateUtil.SETUP);
    let receivedBody: unknown;
    server.use(
      http.post(`${API}/auth/setup`, async ({ request }) => {
        receivedBody = await request.clone().json();
      }),
    );

    const result = await authService.setUp({ code: MOCK_SETUP_CODE, password: PASSWORD });

    expect(receivedBody).toEqual({ code: MOCK_SETUP_CODE, password: PASSWORD });
    expect(result.success).toBe(true);
  });

  it('returns the API code and message when the setup link is wrong', async () => {
    setMockAuthState(AuthStateUtil.SETUP);

    const result = await authService.setUp({ code: 'not-the-code', password: PASSWORD });

    expect(result).toEqual({
      success: false,
      error: { statusCode: 401, code: 'INVALID_SETUP_CODE', message: 'This setup link is wrong or was already used' },
    });
  });
});

describe('startPasskeySetup', () => {
  it('returns the passkey options for this site', async () => {
    setMockAuthState(AuthStateUtil.SETUP);

    const result = await authService.startPasskeySetup({ code: MOCK_SETUP_CODE });

    expect(result.data).toMatchObject({ rp: { id: 'localhost' } });
  });
});

describe('signInWithPassword', () => {
  it('posts only the password', async () => {
    let receivedBody: unknown;
    server.use(
      http.post(`${API}/auth/login/password`, async ({ request }) => {
        receivedBody = await request.clone().json();
      }),
    );

    const result = await authService.signInWithPassword({ password: PASSWORD });

    expect(receivedBody).toEqual({ password: PASSWORD });
    expect(result.success).toBe(true);
  });

  it('returns the failure envelope when the password is wrong', async () => {
    server.use(
      http.post(`${API}/auth/login/password`, () =>
        HttpResponse.json({ code: 'SIGN_IN_FAILED', message: "That password doesn't match." }, { status: 401 }),
      ),
    );

    const result = await authService.signInWithPassword({ password: 'wrong' });

    expect(result).toMatchObject({ success: false, error: { statusCode: 401, code: 'SIGN_IN_FAILED' } });
  });
});

describe('startPasskeySignIn', () => {
  it('returns the 409 envelope before setup', async () => {
    setMockAuthState(AuthStateUtil.SETUP);

    expect(await authService.startPasskeySignIn()).toMatchObject({
      success: false,
      error: { statusCode: 409, code: 'NOT_SET_UP' },
    });
  });
});

describe('logout', () => {
  it('signs out, after which the status is signed out', async () => {
    expect((await authService.logout()).success).toBe(true);

    expect(await authService.getStatus()).toEqual({ state: AuthStateUtil.SIGNED_OUT });
  });
});
