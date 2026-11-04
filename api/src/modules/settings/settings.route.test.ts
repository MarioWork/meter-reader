import type { InjectOptions } from 'fastify';
import { buildApp, type App } from '../../app.ts';
import { prisma } from '../../lib/prisma.ts';
import { resetAuthTables, setUpWithPassword, withSession } from '../auth/auth.fixture.ts';

const PROVIDER_EMAIL = 'readings@water-provider.example';
// MAIL_FROM in .env.test.
const MAIL_FROM = 'me@hotmail.example';
// A fresh install's templates (the issue: "Leitura {date}" and "Leitura - {reading} - {date} - {client}").
const DEFAULT_TEMPLATES = {
  subjectTemplate: 'Leitura {date}',
  bodyTemplate: 'Leitura - {reading} - {date} - {client}',
};
const TEMPLATES = { subjectTemplate: 'Meter reading {date}', bodyTemplate: 'Date: {date}\nReading: {reading}' };
// A fresh install's date format: "31 October 2026".
const DEFAULT_DATE_FORMAT = 'longMonth';
// A fresh install's date language.
const DEFAULT_DATE_LANGUAGE = 'en';
const CLIENT_NUMBER = '0042-7';
const SETTINGS = {
  to: PROVIDER_EMAIL,
  clientNumber: CLIENT_NUMBER,
  ...TEMPLATES,
  dateFormat: 'dayMonthYear',
  dateLanguage: 'pt',
};

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
    expect(response.json()).toEqual({
      from: MAIL_FROM,
      to: null,
      clientNumber: null,
      ...DEFAULT_TEMPLATES,
      dateFormat: DEFAULT_DATE_FORMAT,
      dateLanguage: DEFAULT_DATE_LANGUAGE,
    });
  });

  it('answers the saved provider address, templates and date format when they were saved', async () => {
    await updateSettings(SETTINGS);

    const response = await getSettings();

    expect(response.json()).toEqual({ from: MAIL_FROM, ...SETTINGS });
  });

  it('answers the default templates and date format when the settings row was made before they existed', async () => {
    await prisma.settings.create({ data: { id: 1, providerEmail: PROVIDER_EMAIL } });

    const response = await getSettings();

    expect(response.json()).toEqual({
      from: MAIL_FROM,
      to: PROVIDER_EMAIL,
      clientNumber: null,
      ...DEFAULT_TEMPLATES,
      dateFormat: DEFAULT_DATE_FORMAT,
      dateLanguage: DEFAULT_DATE_LANGUAGE,
    });
  });

  it('returns 401 when the browser is not signed in', async () => {
    const response = await app.inject({ method: 'GET', url: '/settings' });

    expect(response.statusCode).toBe(401);
  });
});

describe('PUT /settings', () => {
  it('saves every field, the templates trimmed, and answers the settings when they are valid', async () => {
    const response = await updateSettings({
      to: `  ${PROVIDER_EMAIL}  `,
      clientNumber: ` ${CLIENT_NUMBER} `,
      subjectTemplate: `  ${TEMPLATES.subjectTemplate} `,
      bodyTemplate: `\n${TEMPLATES.bodyTemplate}  `,
      dateFormat: SETTINGS.dateFormat,
      dateLanguage: SETTINGS.dateLanguage,
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ from: MAIL_FROM, ...SETTINGS });
    expect(
      await prisma.settings.findMany({
        select: {
          providerEmail: true,
          clientNumber: true,
          subjectTemplate: true,
          bodyTemplate: true,
          dateFormat: true,
          dateLanguage: true,
        },
      }),
    ).toEqual([
      {
        providerEmail: PROVIDER_EMAIL,
        clientNumber: CLIENT_NUMBER,
        ...TEMPLATES,
        dateFormat: 'DAY_MONTH_YEAR',
        dateLanguage: 'PORTUGUESE',
      },
    ]);
  });

  it('saves English when the date language is left out', async () => {
    const response = await updateSettings({ ...SETTINGS, dateLanguage: undefined });

    expect(response.json()).toMatchObject({ dateLanguage: 'en' });
  });

  it.each(['english', 'fr', ''])(
    'returns 400 VALIDATION_ERROR naming the field when the date language is %j',
    async (dateLanguage) => {
      const response = await updateSettings({ ...SETTINGS, dateLanguage });

      expect(response.statusCode).toBe(400);
      expect(response.json()).toMatchObject({ code: 'VALIDATION_ERROR', issues: [{ path: '/dateLanguage' }] });
    },
  );

  it.each([['   '], [undefined]])('saves no client number when it is %j', async (clientNumber) => {
    const response = await updateSettings({ ...SETTINGS, clientNumber });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ clientNumber: null });
  });

  it('returns 400 VALIDATION_ERROR naming the field when the client number is too long', async () => {
    const response = await updateSettings({ ...SETTINGS, clientNumber: '1'.repeat(51) });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({ code: 'VALIDATION_ERROR', issues: [{ path: '/clientNumber' }] });
  });

  it.each(['longMonth', 'shortMonth', 'dayMonthYear', 'iso'])(
    'saves and answers the date format when it is %s',
    async (dateFormat) => {
      const response = await updateSettings({ ...SETTINGS, dateFormat });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toMatchObject({ dateFormat });
    },
  );

  it.each(['dd/mm/yyyy', 'LONG_MONTH', ''])(
    'returns 400 VALIDATION_ERROR naming the field and saves nothing when the date format is %j',
    async (dateFormat) => {
      const response = await updateSettings({ ...SETTINGS, dateFormat });

      expect(response.statusCode).toBe(400);
      expect(response.json()).toMatchObject({ code: 'VALIDATION_ERROR', issues: [{ path: '/dateFormat' }] });
      expect(await prisma.settings.count()).toBe(0);
    },
  );

  it('returns 400 VALIDATION_ERROR when the date format is left out', async () => {
    const response = await updateSettings({ to: PROVIDER_EMAIL, ...TEMPLATES });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({ code: 'VALIDATION_ERROR', issues: [{ path: '/dateFormat' }] });
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
        issues: [{ path: `/${field}`, message: '{readng} is not a placeholder. Use {reading}, {date} or {client}.' }],
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
    const response = await updateSettings({
      to: PROVIDER_EMAIL,
      subjectTemplate: TEMPLATES.subjectTemplate,
      dateFormat: SETTINGS.dateFormat,
    });

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
