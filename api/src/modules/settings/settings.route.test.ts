import type { InjectOptions } from 'fastify';
import { buildApp, type App } from '../../app.ts';
import { prisma } from '../../lib/prisma.ts';
import { resetAuthTables, setUpWithPassword, withSession } from '../auth/auth.fixture.ts';

const PROVIDER_EMAIL = 'readings@water-provider.example';
// MAIL_FROM in .env.test.
const MAIL_FROM = 'me@hotmail.example';

let app: App;
let token: string;

function getSettings() {
  return app.inject({ method: 'GET', url: '/settings', ...withSession(token) });
}

function updateSettings(payload: InjectOptions['payload']) {
  return app.inject({ method: 'PUT', url: '/settings', payload, ...withSession(token) });
}

beforeAll(async () => {
  app = await buildApp();
});

afterAll(async () => {
  await app.close();
});

beforeEach(async () => {
  await prisma.settings.deleteMany();
  await resetAuthTables();
  token = await setUpWithPassword(app);
});

describe('GET /settings', () => {
  it('answers no provider address and the From label when nothing was saved yet', async () => {
    const response = await getSettings();

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ from: MAIL_FROM, to: null });
  });

  it('answers the saved provider address when one was saved', async () => {
    await updateSettings({ to: PROVIDER_EMAIL });

    const response = await getSettings();

    expect(response.json()).toEqual({ from: MAIL_FROM, to: PROVIDER_EMAIL });
  });

  it('returns 401 when the browser is not signed in', async () => {
    const response = await app.inject({ method: 'GET', url: '/settings' });

    expect(response.statusCode).toBe(401);
  });
});

describe('PUT /settings', () => {
  it('saves the provider address, trimmed, and answers the settings when it is a valid email address', async () => {
    const response = await updateSettings({ to: `  ${PROVIDER_EMAIL}  ` });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ from: MAIL_FROM, to: PROVIDER_EMAIL });
    expect(await prisma.settings.findMany({ select: { providerEmail: true } })).toEqual([
      { providerEmail: PROVIDER_EMAIL },
    ]);
  });

  it('replaces the address and keeps one settings row when it is saved again', async () => {
    await updateSettings({ to: PROVIDER_EMAIL });

    const response = await updateSettings({ to: 'meter@other-provider.example' });

    expect(response.json()).toMatchObject({ to: 'meter@other-provider.example' });
    expect(await prisma.settings.count()).toBe(1);
  });

  it('returns 400 VALIDATION_ERROR and saves nothing when the address is not an email address', async () => {
    const response = await updateSettings({ to: 'not an address' });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({ code: 'VALIDATION_ERROR' });
    expect(await prisma.settings.count()).toBe(0);
  });

  it('returns 400 VALIDATION_ERROR when the address is empty', async () => {
    const response = await updateSettings({ to: '   ' });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({ code: 'VALIDATION_ERROR' });
  });

  it('returns 400 VALIDATION_ERROR when the body has an unknown field, such as From', async () => {
    const response = await updateSettings({ to: PROVIDER_EMAIL, from: 'someone@else.example' });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({ code: 'VALIDATION_ERROR' });
  });

  it('returns 401 and saves nothing when the browser is not signed in', async () => {
    const response = await app.inject({ method: 'PUT', url: '/settings', payload: { to: PROVIDER_EMAIL } });

    expect(response.statusCode).toBe(401);
    expect(await prisma.settings.count()).toBe(0);
  });
});
