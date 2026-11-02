import { buildApp, type App } from '../../../app.ts';
import {
  TEST_PASSWORD,
  newSetupCode,
  nextAddress,
  registerPasskey,
  resetAuthTables,
  sessionTokenOf,
  setUpWithPassword,
  withSession,
} from '../auth.fixture.ts';
import type { RegistrationOptionsResponse } from '../auth.schema.ts';
import { TestPasskey } from '../TestPasskey.ts';

const URL = '/auth/setup';
// On the bundled common-password list, and 15+ characters long.
const COMMON_PASSWORD = 'password1234567';

let app: App;

function setUp(payload: Record<string, unknown>) {
  return app.inject({ method: 'POST', url: URL, remoteAddress: nextAddress(), payload });
}

function getStatus(token?: string) {
  return app.inject({ method: 'GET', url: '/auth/status', ...(token ? withSession(token) : {}) });
}

function signInWithPassword(password: string) {
  return app.inject({
    method: 'POST',
    url: '/auth/login/password',
    remoteAddress: nextAddress(),
    payload: { password },
  });
}

beforeAll(async () => {
  app = await buildApp();
});

afterAll(async () => {
  await app.close();
});

beforeEach(async () => {
  await resetAuthTables();
});

describe('POST /auth/setup', () => {
  it('saves the password, signs in and ends the setup link when only a password is given', async () => {
    const code = await newSetupCode();

    const response = await setUp({ code, password: TEST_PASSWORD });

    expect(response.statusCode).toBe(204);
    const token = sessionTokenOf(response);
    expect((await getStatus(token)).json()).toEqual({ state: 'signedIn' });
    expect((await setUp({ code, password: TEST_PASSWORD })).statusCode).toBe(409);
    expect((await signInWithPassword(TEST_PASSWORD)).statusCode).toBe(204);
  });

  it('saves the passkey and signs in when only a passkey is given', async () => {
    const code = await newSetupCode();
    const passkey = new TestPasskey();
    const registration = await registerPasskey(app, code, passkey);

    const response = await setUp({ code, passkey: registration });

    expect(response.statusCode).toBe(204);
    expect((await getStatus(sessionTokenOf(response))).json()).toEqual({ state: 'signedIn' });
    expect((await signInWithPassword(TEST_PASSWORD)).statusCode).toBe(401);
  });

  it('saves both when a password and a passkey are given', async () => {
    const code = await newSetupCode();
    const registration = await registerPasskey(app, code, new TestPasskey());

    const response = await setUp({ code, password: TEST_PASSWORD, passkey: registration });

    expect(response.statusCode).toBe(204);
    expect((await signInWithPassword(TEST_PASSWORD)).statusCode).toBe(204);
  });

  it('returns 401 INVALID_SETUP_CODE and saves nothing when the code is wrong', async () => {
    await newSetupCode();

    const response = await setUp({ code: 'not-the-code', password: TEST_PASSWORD });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toMatchObject({ code: 'INVALID_SETUP_CODE' });
    expect((await getStatus()).json()).toEqual({ state: 'setup' });
  });

  it('returns 400 VALIDATION_ERROR when the password is shorter than 15 characters', async () => {
    const code = await newSetupCode();

    const response = await setUp({ code, password: 'fourteen chars' });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({ code: 'VALIDATION_ERROR' });
  });

  it('returns 400 VALIDATION_ERROR when combining accents pad a 14-character password to 15', async () => {
    const code = await newSetupCode();
    // 13 letters plus "e" and a combining acute accent: 15 code units, 14 characters once normalised.
    const padded = 'meterreadings' + 'e\u0301';

    const response = await setUp({ code, password: padded });

    expect(response.statusCode).toBe(400);
  });

  it('returns 400 COMMON_PASSWORD when the password is on the common list, whatever its case', async () => {
    const code = await newSetupCode();

    const response = await setUp({ code, password: COMMON_PASSWORD.toUpperCase() });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({ code: 'COMMON_PASSWORD' });
  });

  it('returns 400 VALIDATION_ERROR when neither a password nor a passkey is given', async () => {
    const code = await newSetupCode();

    const response = await setUp({ code });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({ code: 'VALIDATION_ERROR' });
  });

  it('returns 401 PASSKEY_FAILED when the passkey signed for another site', async () => {
    const code = await newSetupCode();
    const options = await app.inject({ method: 'POST', url: `${URL}/options`, payload: { code } });
    const registration = new TestPasskey().register(options.json<RegistrationOptionsResponse>(), {
      origin: 'https://evil.example',
    });

    const response = await setUp({ code, passkey: registration });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toMatchObject({ code: 'PASSKEY_FAILED' });
  });
});

describe('POST /auth/setup/options', () => {
  it('returns passkey options for this site when the code is right', async () => {
    const code = await newSetupCode();

    const response = await app.inject({ method: 'POST', url: `${URL}/options`, payload: { code } });

    expect(response.statusCode).toBe(200);
    const options = response.json<RegistrationOptionsResponse>();
    expect(options).toMatchObject({ rp: { id: 'localhost' } });
    expect(options.challenge).not.toBe('');
  });

  it('returns 401 INVALID_SETUP_CODE when the code is wrong', async () => {
    await newSetupCode();

    const response = await app.inject({ method: 'POST', url: `${URL}/options`, payload: { code: 'nope' } });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toMatchObject({ code: 'INVALID_SETUP_CODE' });
  });

  it('returns 409 ALREADY_SET_UP when the app is already set up', async () => {
    await setUpWithPassword(app);

    const response = await app.inject({ method: 'POST', url: `${URL}/options`, payload: { code: 'any' } });

    expect(response.statusCode).toBe(409);
    expect(response.json()).toMatchObject({ code: 'ALREADY_SET_UP' });
  });
});
