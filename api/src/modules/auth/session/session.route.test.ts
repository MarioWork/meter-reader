import { buildApp, type App } from '../../../app.ts';
import { resetAuthTables, sessionTokenOf, setUpWithPassword, withSession } from '../auth.fixture.ts';

let app: App;

function getStatus(token?: string) {
  return app.inject({ method: 'GET', url: '/auth/status', ...(token ? withSession(token) : {}) });
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

describe('GET /auth/status', () => {
  it('answers setup when the app is not set up yet', async () => {
    const response = await getStatus();

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ state: 'setup' });
  });

  it('answers signedOut when the app is set up and there is no session', async () => {
    await setUpWithPassword(app);

    expect((await getStatus()).json()).toEqual({ state: 'signedOut' });
  });

  it('answers signedOut when the cookie is not a session', async () => {
    await setUpWithPassword(app);

    expect((await getStatus('made-up-token')).json()).toEqual({ state: 'signedOut' });
  });
});

describe('POST /auth/logout', () => {
  it('ends the session and clears the cookie when the browser is signed in', async () => {
    const token = await setUpWithPassword(app);

    const response = await app.inject({ method: 'POST', url: '/auth/logout', ...withSession(token) });

    expect(response.statusCode).toBe(204);
    expect(sessionTokenOf(response)).toBe('');
    expect(response.headers['set-cookie']).toContain('session=;');
    expect((await getStatus(token)).json()).toEqual({ state: 'signedOut' });
  });

  it('answers 204 when there is no session', async () => {
    const response = await app.inject({ method: 'POST', url: '/auth/logout' });

    expect(response.statusCode).toBe(204);
  });
});
