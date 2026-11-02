import { buildApp, type App } from '../../../app.ts';
import {
  TEST_PASSWORD,
  nextAddress,
  resetAuthTables,
  sessionTokenOf,
  setUpWithPasskey,
  setUpWithPassword,
  withSession,
} from '../auth.fixture.ts';
import type { AuthenticationOptionsResponse } from '../auth.schema.ts';
import { TestPasskey } from '../TestPasskey.ts';

// Password tries allowed per address per minute.
const PASSWORD_LIMIT = 5;

let app: App;

function signInWithPassword(password: string, remoteAddress = nextAddress()) {
  return app.inject({ method: 'POST', url: '/auth/login/password', remoteAddress, payload: { password } });
}

async function getSignInOptions(): Promise<AuthenticationOptionsResponse> {
  const response = await app.inject({ method: 'POST', url: '/auth/login/options', remoteAddress: nextAddress() });

  return response.json<AuthenticationOptionsResponse>();
}

function verifyPasskey(response: unknown) {
  return app.inject({ method: 'POST', url: '/auth/login/verify', remoteAddress: nextAddress(), payload: { response } });
}

function getStatus(token: string) {
  return app.inject({ method: 'GET', url: '/auth/status', ...withSession(token) });
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

describe('POST /auth/login/password', () => {
  it('signs in with a session cookie when the password is right', async () => {
    await setUpWithPassword(app);

    const response = await signInWithPassword(TEST_PASSWORD);

    expect(response.statusCode).toBe(204);
    const cookie = response.cookies.find((candidate) => candidate.name === 'session');
    expect(cookie).toMatchObject({ httpOnly: true, sameSite: 'Strict', path: '/' });
    expect((await getStatus(sessionTokenOf(response))).json()).toEqual({ state: 'signedIn' });
  });

  it('returns 401 SIGN_IN_FAILED and sets no cookie when the password is wrong', async () => {
    await setUpWithPassword(app);

    const response = await signInWithPassword(`${TEST_PASSWORD}!`);

    expect(response.statusCode).toBe(401);
    expect(response.json()).toEqual({ code: 'SIGN_IN_FAILED', message: "That password doesn't match. Try again." });
    expect(sessionTokenOf(response)).toBe('');
  });

  it('returns the same 401 SIGN_IN_FAILED when the app has only a passkey', async () => {
    await setUpWithPasskey(app, new TestPasskey());

    const response = await signInWithPassword(TEST_PASSWORD);

    expect(response.statusCode).toBe(401);
    expect(response.json()).toMatchObject({ code: 'SIGN_IN_FAILED' });
  });

  it('returns 429 after 5 tries a minute from one address, but never locks the login', async () => {
    await setUpWithPassword(app);
    const remoteAddress = nextAddress();

    const responses = [];
    for (let attempt = 0; attempt <= PASSWORD_LIMIT; attempt += 1) {
      responses.push(await signInWithPassword('a wrong password, sorry', remoteAddress));
    }

    expect(responses.at(-1)?.statusCode).toBe(429);
    expect((await signInWithPassword(TEST_PASSWORD)).statusCode).toBe(204);
  });

  it('ends the old session of this browser when it signs in again', async () => {
    const oldToken = await setUpWithPassword(app);

    const response = await app.inject({
      method: 'POST',
      url: '/auth/login/password',
      remoteAddress: nextAddress(),
      payload: { password: TEST_PASSWORD },
      ...withSession(oldToken),
    });

    expect(response.statusCode).toBe(204);
    expect((await getStatus(oldToken)).json()).toEqual({ state: 'signedOut' });
  });
});

describe('POST /auth/login/options', () => {
  it('returns 409 NOT_SET_UP before setup', async () => {
    const response = await app.inject({ method: 'POST', url: '/auth/login/options' });

    expect(response.statusCode).toBe(409);
    expect(response.json()).toMatchObject({ code: 'NOT_SET_UP' });
  });
});

describe('POST /auth/login/verify', () => {
  it('signs in when the passkey answers a fresh challenge', async () => {
    const passkey = new TestPasskey();
    await setUpWithPasskey(app, passkey);

    const response = await verifyPasskey(passkey.authenticate(await getSignInOptions()));

    expect(response.statusCode).toBe(204);
    expect((await getStatus(sessionTokenOf(response))).json()).toEqual({ state: 'signedIn' });
  });

  it('returns 401 SIGN_IN_FAILED when the same challenge is used twice', async () => {
    const passkey = new TestPasskey();
    await setUpWithPasskey(app, passkey);
    const options = await getSignInOptions();
    await verifyPasskey(passkey.authenticate(options));

    const response = await verifyPasskey(passkey.authenticate(options));

    expect(response.statusCode).toBe(401);
    expect(response.json()).toMatchObject({ code: 'SIGN_IN_FAILED' });
  });

  it('returns 401 SIGN_IN_FAILED for a passkey the app never saved', async () => {
    await setUpWithPasskey(app, new TestPasskey());

    const response = await verifyPasskey(new TestPasskey().authenticate(await getSignInOptions()));

    expect(response.statusCode).toBe(401);
    expect(response.json()).toMatchObject({ code: 'SIGN_IN_FAILED' });
  });

  it('returns 401 SIGN_IN_FAILED when the user was not verified (no Face ID, Touch ID or PIN)', async () => {
    const passkey = new TestPasskey();
    await setUpWithPasskey(app, passkey);

    const response = await verifyPasskey(passkey.authenticate(await getSignInOptions(), { isUserVerified: false }));

    expect(response.statusCode).toBe(401);
  });
});
