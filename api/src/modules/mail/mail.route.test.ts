import { buildApp, type App } from '../../app.ts';
import { prisma } from '../../lib/prisma.ts';
import { resetAuthTables, setUpWithPassword, withSession } from '../auth/auth.fixture.ts';

const HOUR_MS = 3_600_000;

let app: App;
let token: string;

function getMailStatus(sessionToken?: string) {
  return app.inject({ method: 'GET', url: '/mail/status', ...(sessionToken ? withSession(sessionToken) : {}) });
}

beforeAll(async () => {
  app = await buildApp();
});

afterAll(async () => {
  await app.close();
});

beforeEach(async () => {
  await resetAuthTables();
  await prisma.mailConnection.deleteMany();
  token = await setUpWithPassword(app);
});

describe('GET /mail/status', () => {
  it('answers notConnected when yarn mail:connect has not run', async () => {
    const response = await getMailStatus(token);

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ state: 'notConnected' });
  });

  it('answers connected, and never a token, when Hotmail is connected', async () => {
    await prisma.mailConnection.create({
      data: {
        refreshToken: 'stored-refresh-token',
        accessToken: 'stored-access-token',
        accessTokenExpiresAt: new Date(Date.now() + HOUR_MS),
      },
    });

    const response = await getMailStatus(token);

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ state: 'connected' });
    expect(response.body).not.toContain('stored-');
  });

  it('returns 401 with code UNAUTHORIZED when the browser is not signed in', async () => {
    const response = await getMailStatus();

    expect(response.statusCode).toBe(401);
    expect(response.json()).toMatchObject({ code: 'UNAUTHORIZED' });
  });
});
