import type { InjectOptions } from 'fastify';
import { buildApp, type App } from '../../app.ts';
import { prisma } from '../../lib/prisma.ts';
import { resetAuthTables, setUpWithPassword, withSession } from '../auth/auth.fixture.ts';

const PROVIDER_EMAIL = 'readings@water-provider.example';
// MAIL_FROM in .env.test.
const MAIL_FROM = 'me@hotmail.example';
// A fresh install's templates (the issue: "Leitura {date}" and "Leitura - {reading} - {date}").
const DEFAULT_TEMPLATES = { subjectTemplate: 'Leitura {date}', bodyTemplate: 'Leitura - {reading} - {date}' };
const TEMPLATES = { subjectTemplate: 'Meter reading {date}', bodyTemplate: 'Date: {date}\nReading: {reading}' };
const SETTINGS = { to: PROVIDER_EMAIL, ...TEMPLATES };

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
  it('answers no provider address, the From label and the default templates when nothing was saved yet', async () => {
    const response = await getSettings();

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ from: MAIL_FROM, to: null, ...DEFAULT_TEMPLATES });
  });

  it('answers the saved provider address and templates when they were saved', async () => {
    await updateSettings(SETTINGS);

    const response = await getSettings();

    expect(response.json()).toEqual({ from: MAIL_FROM, ...SETTINGS });
  });

  it('answers the default templates when the settings row was made before templates existed', async () => {
    await prisma.settings.create({ data: { id: 1, providerEmail: PROVIDER_EMAIL } });

    const response = await getSettings();

    expect(response.json()).toEqual({ from: MAIL_FROM, to: PROVIDER_EMAIL, ...DEFAULT_TEMPLATES });
  });

  it('returns 401 when the browser is not signed in', async () => {
    const response = await app.inject({ method: 'GET', url: '/settings' });

    expect(response.statusCode).toBe(401);
  });
});

describe('PUT /settings', () => {
  it('saves the provider address and the templates, trimmed, and answers the settings when they are valid', async () => {
    const response = await updateSettings({
      to: `  ${PROVIDER_EMAIL}  `,
      subjectTemplate: `  ${TEMPLATES.subjectTemplate} `,
      bodyTemplate: `\n${TEMPLATES.bodyTemplate}  `,
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ from: MAIL_FROM, ...SETTINGS });
    expect(
      await prisma.settings.findMany({ select: { providerEmail: true, subjectTemplate: true, bodyTemplate: true } }),
    ).toEqual([{ providerEmail: PROVIDER_EMAIL, ...TEMPLATES }]);
  });

  it('replaces the settings and keeps one settings row when they are saved again', async () => {
    await updateSettings(SETTINGS);

    const response = await updateSettings({ ...SETTINGS, to: 'meter@other-provider.example' });

    expect(response.json()).toMatchObject({ to: 'meter@other-provider.example' });
    expect(await prisma.settings.count()).toBe(1);
  });

  it('returns 400 VALIDATION_ERROR and saves nothing when the address is not an email address', async () => {
    const response = await updateSettings({ ...SETTINGS, to: 'not an address' });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({ code: 'VALIDATION_ERROR', issues: [{ path: '/to' }] });
    expect(await prisma.settings.count()).toBe(0);
  });

  it('returns 400 VALIDATION_ERROR when the address is empty', async () => {
    const response = await updateSettings({ ...SETTINGS, to: '   ' });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({ code: 'VALIDATION_ERROR' });
  });

  it.each(['subjectTemplate', 'bodyTemplate'])(
    'returns 400 VALIDATION_ERROR naming the field and saves nothing when %s has an unknown placeholder',
    async (field) => {
      const response = await updateSettings({ ...SETTINGS, [field]: 'Leitura {readng} {date}' });

      expect(response.statusCode).toBe(400);
      expect(response.json()).toMatchObject({
        code: 'VALIDATION_ERROR',
        issues: [{ path: `/${field}`, message: '{readng} is not a placeholder. Use {reading} or {date}.' }],
      });
      expect(await prisma.settings.count()).toBe(0);
    },
  );

  it.each([
    ['subjectTemplate', 'Write a subject template.'],
    ['bodyTemplate', 'Write a body template.'],
  ])('returns 400 VALIDATION_ERROR naming the field and why when %s is empty', async (field, message) => {
    const response = await updateSettings({ ...SETTINGS, [field]: '  ' });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({ code: 'VALIDATION_ERROR', issues: [{ path: `/${field}`, message }] });
  });

  it('returns 400 VALIDATION_ERROR when a template is left out', async () => {
    const response = await updateSettings({ to: PROVIDER_EMAIL, subjectTemplate: TEMPLATES.subjectTemplate });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({ code: 'VALIDATION_ERROR' });
  });

  it('returns 400 VALIDATION_ERROR when the body has an unknown field, such as From', async () => {
    const response = await updateSettings({ ...SETTINGS, from: 'someone@else.example' });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({ code: 'VALIDATION_ERROR' });
  });

  it('returns 401 and saves nothing when the browser is not signed in', async () => {
    const response = await app.inject({ method: 'PUT', url: '/settings', payload: SETTINGS });

    expect(response.statusCode).toBe(401);
    expect(await prisma.settings.count()).toBe(0);
  });
});
