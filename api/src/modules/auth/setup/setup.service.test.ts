import { buildApp, type App } from '../../../app.ts';
import {
  TEST_PASSWORD,
  newSetupCode,
  nextAddress,
  resetAuthTables,
  setUpWithPassword,
  withSession,
} from '../auth.fixture.ts';
import { addSetupCode, getSetupLink, resetLogin } from './setup.service.ts';

// The service functions server.ts and yarn auth:reset call, against the test database. The app is only used to
// check the result the way the user would meet it.
let app: App;

function setUp(payload: Record<string, unknown>) {
  return app.inject({ method: 'POST', url: '/auth/setup', remoteAddress: nextAddress(), payload });
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

describe('addSetupCode and getSetupLink', () => {
  it('points at the setup page on the app origin when a code is made', async () => {
    const code = await newSetupCode();

    expect(getSetupLink(code)).toBe(`http://localhost:5173/setup?code=${code}`);
  });

  it('is not made when the app is already set up', async () => {
    await setUpWithPassword(app);

    expect(await addSetupCode()).toBeUndefined();
  });
});

describe('resetLogin (yarn auth:reset)', () => {
  it('removes the password and every session when the login is reset, and its new code sets the app up again', async () => {
    const oldToken = await setUpWithPassword(app);

    const code = await resetLogin();

    expect((await getStatus()).json()).toEqual({ state: 'setup' });
    expect((await getStatus(oldToken)).json()).toEqual({ state: 'setup' });
    expect((await signInWithPassword(TEST_PASSWORD)).statusCode).toBe(401);
    expect((await setUp({ code, password: 'a brand new passphrase' })).statusCode).toBe(204);
  });

  it('refuses a setup code printed before the reset when it is used after it', async () => {
    const oldCode = await newSetupCode();

    await resetLogin();

    expect((await setUp({ code: oldCode, password: TEST_PASSWORD })).statusCode).toBe(401);
  });
});
