import { access } from 'node:fs/promises';
import type { InjectOptions } from 'fastify';
import { readSheet } from 'read-excel-file/node';
import { buildApp, type App } from '../../app.ts';
import { fakeJpeg } from '../../lib/jpeg.fixture.ts';
import { prisma } from '../../lib/prisma.ts';
import { uploadPath } from '../../lib/uploads.ts';
import { resetAuthTables, setUpWithPassword, withSession } from '../auth/auth.fixture.ts';
import { answerSendMail, graphErrorAnswer, type ReceivedSendMail } from '../mail/mail.microsoftGraph.mock.ts';
import { microsoftServer } from '../mail/mail.microsoftIdentity.mock.ts';

const HOUR_MS = 3_600_000;
const PROVIDER_EMAIL = 'readings@water-provider.example';
const STORED_ACCESS_TOKEN = 'stored-access-token';
// The readings spreadsheet's header, and what its tests need to build readings and read times back.
const SPREADSHEET_HEADER = ['Date', 'Digits', 'Status', 'Sent at'];
const MINUTE_MS = 60_000;
const READINGS_PAST_ONE_PAGE = 12;
const DATE_PART_LENGTH = 2;
const DIGIT_COUNT = 5;
// The templates the tests save in Settings, with both placeholders in the subject too.
const TEMPLATES = { subjectTemplate: 'Meter reading {date}', bodyTemplate: 'Date: {date}\nReading: {reading}' };
// What they fill in to for 00123, read on 31 October 2026.
const SUBJECT = 'Meter reading 31 October 2026';

let app: App;
let token: string;

function addReading(payload: InjectOptions['payload']) {
  return app.inject({ method: 'POST', url: '/readings', payload, ...withSession(token) });
}

async function addPhoto(): Promise<number> {
  const response = await app.inject({
    method: 'POST',
    url: '/photos',
    headers: { 'content-type': 'image/jpeg' },
    payload: fakeJpeg({ width: 2000, height: 1500 }),
    ...withSession(token),
  });

  return response.json<{ id: number }>().id;
}

function getReadings(query = '') {
  return app.inject({ method: 'GET', url: `/readings${query}`, ...withSession(token) });
}

function deleteReading(id: number | string) {
  return app.inject({ method: 'DELETE', url: `/readings/${id}`, ...withSession(token) });
}

async function addReadingId(digits: string): Promise<number> {
  const response = await addReading({ digits, date: '2026-10-31' });

  return response.json<{ id: number }>().id;
}

// Sent or failed straight in the database: how a reading gets there is POST /readings/:id/send's business.
async function addReadingWithStatus(digits: string, date: string, status: 'SENT' | 'FAILED'): Promise<void> {
  const id = (await addReading({ digits, date })).json<{ id: number }>().id;

  await prisma.reading.update({ where: { id }, data: { status } });
}

async function addReadingWithPhotoId(): Promise<number> {
  const photoId = await addPhoto();
  const response = await addReading({ digits: '00123', date: '2026-10-31', photoId });

  return response.json<{ id: number }>().id;
}

function getReading(id: number | string) {
  return app.inject({ method: 'GET', url: `/readings/${id}`, ...withSession(token) });
}

function updateReading(id: number | string, payload: InjectOptions['payload']) {
  return app.inject({ method: 'PATCH', url: `/readings/${id}`, payload, ...withSession(token) });
}

function getReadingEmail(id: number | string) {
  return app.inject({ method: 'GET', url: `/readings/${id}/email`, ...withSession(token) });
}

function sendReading(id: number | string, payload: InjectOptions['payload'] = { attachPhoto: false }) {
  return app.inject({ method: 'POST', url: `/readings/${id}/send`, payload, ...withSession(token) });
}

// Hotmail connected, with an access token good for the next hour: a send asks Microsoft for nothing but sendMail.
async function connectHotmail(): Promise<void> {
  await prisma.mailConnection.create({
    data: {
      refreshToken: 'stored-refresh-token',
      accessToken: STORED_ACCESS_TOKEN,
      accessTokenExpiresAt: new Date(Date.now() + HOUR_MS),
    },
  });
}

// The provider's address and the templates, as the user saves them on the Settings page.
// Any field left out is the tests' own address or template.
type SettingsChanges = Partial<typeof TEMPLATES & { to: string }>;

async function saveSettings(settings: SettingsChanges = {}): Promise<void> {
  const payload = { to: PROVIDER_EMAIL, ...TEMPLATES, ...settings };

  await app.inject({ method: 'PUT', url: '/settings', payload, ...withSession(token) });
}

async function saveProviderEmail(providerEmail: string): Promise<void> {
  await saveSettings({ to: providerEmail });
}

function attachmentsOf(received: ReceivedSendMail | undefined): unknown {
  const body = received?.body as { message?: { attachments?: unknown } } | undefined;

  return body?.message?.attachments;
}

beforeAll(async () => {
  microsoftServer.listen({ onUnhandledFrame: 'error' });
  app = await buildApp();
});

afterAll(async () => {
  await app.close();
  microsoftServer.close();
});

beforeEach(async () => {
  await prisma.photo.deleteMany();
  await prisma.reading.deleteMany();
  await prisma.mailConnection.deleteMany();
  await prisma.settings.deleteMany();
  await resetAuthTables();
  token = await setUpWithPassword(app);
  await saveSettings();
});

afterEach(() => {
  microsoftServer.resetHandlers();
});

describe('POST /readings', () => {
  it('saves the reading as not sent and answers it when the digits and date are valid', async () => {
    const response = await addReading({ digits: '00123', date: '2026-10-31' });

    expect(response.statusCode).toBe(201);
    expect(Object.keys(response.json<object>()).sort()).toEqual([
      'costCents',
      'createdAt',
      'date',
      'digits',
      'id',
      'photoId',
      'sentAt',
      'sentEmail',
      'status',
    ]);
    expect(response.json()).toMatchObject({
      digits: '00123',
      date: '2026-10-31',
      status: 'notSent',
      photoId: null,
      sentAt: null,
      sentEmail: null,
      costCents: null,
    });
  });

  it('links the photo to the reading when the photo id is given', async () => {
    const photoId = await addPhoto();

    const response = await addReading({ digits: '00123', date: '2026-10-31', photoId });

    expect(response.statusCode).toBe(201);
    expect(response.json()).toMatchObject({ photoId });
    const photo = await prisma.photo.findUniqueOrThrow({ where: { id: photoId } });
    expect(photo.readingId).toBe(response.json<{ id: number }>().id);
  });

  it('returns 409 PHOTO_NOT_AVAILABLE and saves nothing when no photo has the id', async () => {
    const response = await addReading({ digits: '00123', date: '2026-10-31', photoId: 999_999 });

    expect(response.statusCode).toBe(409);
    expect(response.json()).toMatchObject({ code: 'PHOTO_NOT_AVAILABLE' });
    expect(await prisma.reading.count()).toBe(0);
  });

  it('returns 409 PHOTO_NOT_AVAILABLE and keeps the first link when the photo already belongs to a reading', async () => {
    const photoId = await addPhoto();
    const first = await addReading({ digits: '00123', date: '2026-10-30', photoId });

    const response = await addReading({ digits: '00124', date: '2026-10-31', photoId });

    expect(response.statusCode).toBe(409);
    expect(response.json()).toMatchObject({ code: 'PHOTO_NOT_AVAILABLE' });
    const photo = await prisma.photo.findUniqueOrThrow({ where: { id: photoId } });
    expect(photo.readingId).toBe(first.json<{ id: number }>().id);
    expect(await prisma.reading.count()).toBe(1);
  });

  it('keeps the leading zeros when the reading is read back', async () => {
    await addReading({ digits: '000045', date: '2026-10-31' });

    const response = await getReadings();

    expect(response.json<{ data: { digits: string }[] }>().data[0]?.digits).toBe('000045');
  });

  it('returns 400 VALIDATION_ERROR when the reading has something other than digits', async () => {
    const response = await addReading({ digits: '12.5', date: '2026-10-31' });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({ code: 'VALIDATION_ERROR' });
  });

  it('returns 400 VALIDATION_ERROR when the date is not a calendar date', async () => {
    const response = await addReading({ digits: '00123', date: '2026-02-30' });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({ code: 'VALIDATION_ERROR' });
  });

  it('returns 400 VALIDATION_ERROR when the body has an unknown field', async () => {
    const response = await addReading({ digits: '00123', date: '2026-10-31', status: 'sent' });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({ code: 'VALIDATION_ERROR' });
  });

  it('returns 401 and saves nothing when the browser is not signed in', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/readings',
      payload: { digits: '00123', date: '2026-10-31' },
    });

    expect(response.statusCode).toBe(401);
    expect(await prisma.reading.count()).toBe(0);
  });
});

describe('GET /readings', () => {
  it("lists each reading's photo id, or null when it has none", async () => {
    const photoId = await addPhoto();
    await addReading({ digits: '00100', date: '2026-09-01' });
    await addReading({ digits: '00200', date: '2026-10-01', photoId });

    const response = await getReadings();

    expect(response.json()).toMatchObject({
      data: [
        { digits: '00200', photoId },
        { digits: '00100', photoId: null },
      ],
    });
  });

  it('lists the history newest first, by date then by save order, when several readings exist', async () => {
    await addReading({ digits: '00100', date: '2026-09-01' });
    await addReading({ digits: '00300', date: '2026-10-31' });
    await addReading({ digits: '00200', date: '2026-10-01' });
    await addReading({ digits: '00301', date: '2026-10-31' });

    const response = await getReadings();

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      totalResultNumber: 4,
      currentPage: 1,
      data: [{ digits: '00301' }, { digits: '00300' }, { digits: '00200' }, { digits: '00100' }],
    });
  });

  it('answers the asked page when page and size are given', async () => {
    await addReading({ digits: '00100', date: '2026-08-01' });
    await addReading({ digits: '00200', date: '2026-09-01' });
    await addReading({ digits: '00300', date: '2026-10-01' });

    const response = await getReadings('?page=2&size=2');

    expect(response.json()).toMatchObject({ totalResultNumber: 3, currentPage: 2, data: [{ digits: '00100' }] });
  });

  it('returns 400 VALIDATION_ERROR when the page size is over the cap', async () => {
    const response = await getReadings('?size=1000');

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({ code: 'VALIDATION_ERROR' });
  });

  it('returns 401 when the browser is not signed in', async () => {
    const response = await app.inject({ method: 'GET', url: '/readings' });

    expect(response.statusCode).toBe(401);
  });

  it('lists only the readings on or after the from day when from is given', async () => {
    await addReading({ digits: '00100', date: '2026-08-31' });
    await addReading({ digits: '00200', date: '2026-09-01' });
    await addReading({ digits: '00300', date: '2026-10-01' });

    const response = await getReadings('?from=2026-09-01');

    expect(response.json()).toMatchObject({ totalResultNumber: 2, data: [{ digits: '00300' }, { digits: '00200' }] });
  });

  it('lists only the readings on or before the to day when to is given', async () => {
    await addReading({ digits: '00100', date: '2026-08-31' });
    await addReading({ digits: '00200', date: '2026-09-01' });
    await addReading({ digits: '00300', date: '2026-09-02' });

    const response = await getReadings('?to=2026-09-01');

    expect(response.json()).toMatchObject({ totalResultNumber: 2, data: [{ digits: '00200' }, { digits: '00100' }] });
  });

  it('lists the readings of that one day when from and to are the same day', async () => {
    await addReading({ digits: '00100', date: '2026-08-31' });
    await addReading({ digits: '00200', date: '2026-09-01' });
    await addReading({ digits: '00300', date: '2026-09-02' });

    const response = await getReadings('?from=2026-09-01&to=2026-09-01');

    expect(response.json()).toMatchObject({ totalResultNumber: 1, data: [{ digits: '00200' }] });
  });

  it('lists only the readings with the status when one status is given', async () => {
    await addReading({ digits: '00100', date: '2026-09-01' });
    await addReadingWithStatus('00200', '2026-09-02', 'SENT');
    await addReadingWithStatus('00300', '2026-09-03', 'FAILED');

    const response = await getReadings('?status=notSent');

    expect(response.json()).toMatchObject({ totalResultNumber: 1, data: [{ digits: '00100', status: 'notSent' }] });
  });

  it('lists the readings with any of the statuses when several are given, comma-separated', async () => {
    await addReading({ digits: '00100', date: '2026-09-01' });
    await addReadingWithStatus('00200', '2026-09-02', 'SENT');
    await addReadingWithStatus('00300', '2026-09-03', 'FAILED');

    const response = await getReadings('?status=notSent,failed');

    expect(response.json()).toMatchObject({
      totalResultNumber: 2,
      data: [
        { digits: '00300', status: 'failed' },
        { digits: '00100', status: 'notSent' },
      ],
    });
  });

  it('pages the filtered readings and counts only them when the filters are combined', async () => {
    await addReading({ digits: '00100', date: '2026-08-31' });
    await addReading({ digits: '00200', date: '2026-09-01' });
    await addReadingWithStatus('00300', '2026-09-02', 'SENT');
    await addReading({ digits: '00400', date: '2026-09-03' });
    await addReading({ digits: '00500', date: '2026-09-04' });
    await addReading({ digits: '00600', date: '2026-10-01' });

    const response = await getReadings('?from=2026-09-01&to=2026-09-30&status=notSent&page=2&size=2');

    expect(response.json()).toMatchObject({ totalResultNumber: 3, currentPage: 2, data: [{ digits: '00200' }] });
  });

  it('treats an empty filter as no filter when a param is sent empty', async () => {
    await addReading({ digits: '00100', date: '2026-09-01' });

    const response = await getReadings('?from=&to=&status=');

    expect(response.json()).toMatchObject({ totalResultNumber: 1 });
  });

  it('trims a filter when a param is sent with spaces around it', async () => {
    await addReading({ digits: '00100', date: '2026-09-01' });
    await addReading({ digits: '00200', date: '2026-10-01' });

    const response = await getReadings('?from=%202026-10-01%20&status=%20notSent,%20failed%20');

    expect(response.json()).toMatchObject({ totalResultNumber: 1, data: [{ digits: '00200' }] });
  });

  it('returns 400 VALIDATION_ERROR when from is later than to', async () => {
    const response = await getReadings('?from=2026-10-01&to=2026-09-01');

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({ code: 'VALIDATION_ERROR' });
  });

  it('returns 400 VALIDATION_ERROR when a day is not a calendar date', async () => {
    const response = await getReadings('?from=2026-13-01');

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({ code: 'VALIDATION_ERROR' });
  });

  it('returns 400 VALIDATION_ERROR when a status is unknown', async () => {
    const response = await getReadings('?status=sent,lost');

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({ code: 'VALIDATION_ERROR' });
  });
});

describe('GET /readings/export.xlsx', () => {
  function exportReadings(query = '') {
    return app.inject({ method: 'GET', url: `/readings/export.xlsx${query}`, ...withSession(token) });
  }

  // A spreadsheet keeps a time as a fraction of a day, so it reads back a hair off the minute it shows.
  function toNearestMinute(cell: unknown): unknown {
    if (!(cell instanceof Date)) return cell;

    return new Date(Math.round(cell.getTime() / MINUTE_MS) * MINUTE_MS);
  }

  // The sheet as rows of cells, header first.
  async function sheetRows(query = ''): Promise<unknown[][]> {
    const response = await exportReadings(query);
    const rows = await readSheet(response.rawPayload);

    return rows.map((row) => row.map(toNearestMinute));
  }

  function digitsColumn(rows: unknown[][]): unknown[] {
    return rows.slice(1).map((row) => row[1]);
  }

  async function addSentReading(digits: string, date: string, sentAt: string): Promise<void> {
    const id = (await addReading({ digits, date })).json<{ id: number }>().id;

    await prisma.reading.update({ where: { id }, data: { status: 'SENT', sentAt: new Date(sentAt) } });
  }

  it('answers an .xlsx download named water-readings.xlsx when there are no filters', async () => {
    const response = await exportReadings();

    expect(response.statusCode).toBe(200);
    expect(response.headers['content-type']).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    expect(response.headers['content-disposition']).toBe('attachment; filename="water-readings.xlsx"');
  });

  it('holds the date, the digits as text, the status and when it was sent, newest first, when readings exist', async () => {
    await addReading({ digits: '00123', date: '2026-09-01' });
    await addReadingWithStatus('00456', '2026-10-01', 'FAILED');
    await addSentReading('00789', '2026-10-31', '2026-10-31T09:05:00.000Z');

    const rows = await sheetRows();

    expect(rows).toEqual([
      SPREADSHEET_HEADER,
      [new Date('2026-10-31T00:00:00.000Z'), '00789', 'Sent', new Date('2026-10-31T09:05:00.000Z')],
      [new Date('2026-10-01T00:00:00.000Z'), '00456', 'Failed', null],
      [new Date('2026-09-01T00:00:00.000Z'), '00123', 'Not sent', null],
    ]);
  });

  it("shows when a reading was sent as the user's clock showed it when a time zone is given", async () => {
    await addSentReading('00789', '2026-07-31', '2026-07-31T09:05:00.000Z');

    const rows = await sheetRows('?timeZone=Europe/Lisbon');

    // Lisbon is an hour ahead of UTC in summer.
    expect(rows[1]?.[3]).toEqual(new Date('2026-07-31T10:05:00.000Z'));
  });

  it('holds every reading, past the first page, when there are more than a page of them', async () => {
    for (let month = 1; month <= READINGS_PAST_ONE_PAGE; month++) {
      const monthPart = String(month).padStart(DATE_PART_LENGTH, '0');

      await addReading({ digits: String(month).padStart(DIGIT_COUNT, '0'), date: `2025-${monthPart}-01` });
    }

    const rows = await sheetRows();

    expect(rows).toHaveLength(READINGS_PAST_ONE_PAGE + 1);
  });

  it('holds only the readings in the day range and with the statuses asked for when filtered', async () => {
    await addReading({ digits: '00100', date: '2026-08-31' });
    await addReading({ digits: '00200', date: '2026-09-01' });
    await addReadingWithStatus('00300', '2026-09-15', 'FAILED');
    await addReadingWithStatus('00400', '2026-09-30', 'SENT');
    await addReading({ digits: '00500', date: '2026-10-01' });

    const rows = await sheetRows('?from=2026-09-01&to=2026-09-30&status=notSent,failed');

    expect(digitsColumn(rows)).toEqual(['00300', '00200']);
  });

  it('is named after the filters when filtered', async () => {
    const response = await exportReadings('?from=2026-01-01&to=2026-03-31&status=notSent,failed');

    expect(response.headers['content-disposition']).toBe(
      'attachment; filename="water-readings-2026-01-01-to-2026-03-31-not-sent-failed.xlsx"',
    );
  });

  it('is named after the open end of the range when only one day is given', async () => {
    const fromResponse = await exportReadings('?from=2026-01-01');
    const toResponse = await exportReadings('?to=2026-03-31');

    expect(fromResponse.headers['content-disposition']).toBe(
      'attachment; filename="water-readings-from-2026-01-01.xlsx"',
    );
    expect(toResponse.headers['content-disposition']).toBe(
      'attachment; filename="water-readings-until-2026-03-31.xlsx"',
    );
  });

  it('returns 400 VALIDATION_ERROR when the range ends before it starts', async () => {
    const response = await exportReadings('?from=2026-10-01&to=2026-09-01');

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({ code: 'VALIDATION_ERROR' });
  });

  it('returns 400 VALIDATION_ERROR when the time zone is not one the server knows', async () => {
    const response = await exportReadings('?timeZone=Mars/Olympus');

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({ code: 'VALIDATION_ERROR' });
  });

  it('returns 401 when the browser is not signed in', async () => {
    const response = await app.inject({ method: 'GET', url: '/readings/export.xlsx' });

    expect(response.statusCode).toBe(401);
  });
});

describe('DELETE /readings/:id', () => {
  it('removes the reading from the history and answers 204 when the reading exists', async () => {
    const keptId = await addReadingId('00100');
    const deletedId = await addReadingId('00200');

    const response = await deleteReading(deletedId);

    expect(response.statusCode).toBe(204);
    expect(response.body).toBe('');
    expect(await prisma.reading.findMany({ select: { id: true } })).toEqual([{ id: keptId }]);
  });

  it('removes the photo and its file with the reading when the reading has a photo', async () => {
    const photoId = await addPhoto();
    const { fileName } = await prisma.photo.findUniqueOrThrow({ where: { id: photoId } });
    const readingId = (await addReading({ digits: '00123', date: '2026-10-31', photoId })).json<{ id: number }>().id;

    const response = await deleteReading(readingId);

    expect(response.statusCode).toBe(204);
    expect(await prisma.photo.count()).toBe(0);
    await expect(access(uploadPath(fileName))).rejects.toMatchObject({ code: 'ENOENT' });
  });

  it('returns 404 NOT_FOUND when the reading does not exist', async () => {
    const deletedId = await addReadingId('00100');
    await deleteReading(deletedId);

    const response = await deleteReading(deletedId);

    expect(response.statusCode).toBe(404);
    expect(response.json()).toMatchObject({ code: 'NOT_FOUND' });
  });

  it('returns 400 VALIDATION_ERROR when the id is not a whole number', async () => {
    const response = await deleteReading('abc');

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({ code: 'VALIDATION_ERROR' });
  });

  it('returns 401 and keeps the reading when the browser is not signed in', async () => {
    const readingId = await addReadingId('00100');

    const response = await app.inject({ method: 'DELETE', url: `/readings/${readingId}` });

    expect(response.statusCode).toBe(401);
    expect(await prisma.reading.count()).toBe(1);
  });
});

describe('GET /readings/email-defaults', () => {
  it('answers who the email is from and to, and the saved templates, when Settings were saved', async () => {
    const response = await app.inject({ method: 'GET', url: '/readings/email-defaults', ...withSession(token) });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ from: 'me@hotmail.example', to: PROVIDER_EMAIL, ...TEMPLATES });
  });

  it("answers no address and a fresh install's templates when Settings were never saved", async () => {
    await prisma.settings.deleteMany();

    const response = await app.inject({ method: 'GET', url: '/readings/email-defaults', ...withSession(token) });

    expect(response.json()).toMatchObject({
      to: null,
      subjectTemplate: 'Leitura {date}',
      bodyTemplate: 'Leitura - {reading} - {date}',
    });
  });

  it('returns 401 when the browser is not signed in', async () => {
    const response = await app.inject({ method: 'GET', url: '/readings/email-defaults' });

    expect(response.statusCode).toBe(401);
  });
});

describe('GET /readings/:id', () => {
  it('answers the reading with its photo id, status and save time', async () => {
    const photoId = await addPhoto();
    const readingId = (await addReading({ digits: '00123', date: '2026-10-31', photoId })).json<{ id: number }>().id;

    const response = await getReading(readingId);

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      id: readingId,
      digits: '00123',
      date: '2026-10-31',
      status: 'notSent',
      photoId,
      sentAt: null,
      sentEmail: null,
    });
    expect(Date.parse(response.json<{ createdAt: string }>().createdAt)).not.toBeNaN();
  });

  it('returns 400 VALIDATION_ERROR when the id is not a whole number', async () => {
    const response = await getReading('abc');

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({ code: 'VALIDATION_ERROR' });
  });

  it('returns 404 NOT_FOUND when the reading does not exist', async () => {
    const response = await getReading(999_999);

    expect(response.statusCode).toBe(404);
    expect(response.json()).toMatchObject({ code: 'NOT_FOUND' });
  });

  it('returns 401 when the browser is not signed in', async () => {
    const readingId = await addReadingId('00100');

    const response = await app.inject({ method: 'GET', url: `/readings/${readingId}` });

    expect(response.statusCode).toBe(401);
  });
});

describe('PATCH /readings/:id', () => {
  it('sets the cost and answers the reading with it when the reading has none', async () => {
    const readingId = await addReadingId('00123');

    const response = await updateReading(readingId, { costCents: 4210 });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ id: readingId, digits: '00123', costCents: 4210 });
    expect((await getReading(readingId)).json()).toMatchObject({ costCents: 4210 });
  });

  it('changes the cost when the reading has one already', async () => {
    const readingId = await addReadingId('00123');
    await updateReading(readingId, { costCents: 4210 });

    const response = await updateReading(readingId, { costCents: 3999 });

    expect(response.json()).toMatchObject({ costCents: 3999 });
  });

  it('sets a cost of 0 when the reading cost nothing', async () => {
    const readingId = await addReadingId('00123');

    const response = await updateReading(readingId, { costCents: 0 });

    expect(response.json()).toMatchObject({ costCents: 0 });
  });

  it('removes the cost when it is sent as null', async () => {
    const readingId = await addReadingId('00123');
    await updateReading(readingId, { costCents: 4210 });

    const response = await updateReading(readingId, { costCents: null });

    expect(response.json()).toMatchObject({ costCents: null });
    expect((await getReading(readingId)).json()).toMatchObject({ costCents: null });
  });

  it('keeps the cost when the body leaves it out', async () => {
    const readingId = await addReadingId('00123');
    await updateReading(readingId, { costCents: 4210 });

    const response = await updateReading(readingId, {});

    expect(response.json()).toMatchObject({ costCents: 4210 });
  });

  it.each([
    ['below 0', -1],
    ['not a whole number of cents', 42.1],
    ['a string', '42,10'],
    ['over the cap', 2_147_483_648],
  ])('returns 400 VALIDATION_ERROR and keeps the cost when the cost is %s', async (_scenario, costCents) => {
    const readingId = await addReadingId('00123');
    await updateReading(readingId, { costCents: 4210 });

    const response = await updateReading(readingId, { costCents });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({ code: 'VALIDATION_ERROR' });
    expect((await getReading(readingId)).json()).toMatchObject({ costCents: 4210 });
  });

  it('returns 400 VALIDATION_ERROR when the body has an unknown field', async () => {
    const readingId = await addReadingId('00123');

    const response = await updateReading(readingId, { digits: '99999' });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({ code: 'VALIDATION_ERROR' });
  });

  it('returns 400 VALIDATION_ERROR when the id is not a whole number', async () => {
    const response = await updateReading('abc', { costCents: 4210 });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({ code: 'VALIDATION_ERROR' });
  });

  it('returns 404 NOT_FOUND when the reading does not exist', async () => {
    const response = await updateReading(999_999, { costCents: 4210 });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toMatchObject({ code: 'NOT_FOUND' });
  });

  it('returns 401 and keeps the reading as it was when the browser is not signed in', async () => {
    const readingId = await addReadingId('00123');

    const response = await app.inject({ method: 'PATCH', url: `/readings/${readingId}`, payload: { costCents: 4210 } });

    expect(response.statusCode).toBe(401);
    expect((await getReading(readingId)).json()).toMatchObject({ costCents: null });
  });
});

describe('GET /readings/:id/email', () => {
  it('leaves the cost out of the email when the reading has one', async () => {
    const readingId = await addReadingId('000045');
    await updateReading(readingId, { costCents: 4210 });

    const response = await getReadingEmail(readingId);

    expect(response.json()).toMatchObject({ body: 'Date: 31 October 2026\nReading: 000045' });
    expect(response.body).not.toMatch(/42[.,]10|4210/);
  });

  it('answers the address, the subject and the body, with the photo to attach, when the reading has a photo', async () => {
    const photoId = await addPhoto();
    const readingId = (await addReading({ digits: '00123', date: '2026-10-31', photoId })).json<{ id: number }>().id;

    const response = await getReadingEmail(readingId);

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      from: 'me@hotmail.example',
      to: PROVIDER_EMAIL,
      subject: SUBJECT,
      body: 'Date: 31 October 2026\nReading: 00123',
      attachment: { photoId, name: 'meter-2026-10-31.jpg' },
    });
  });

  it("fills in a fresh install's templates when Settings were never saved", async () => {
    const readingId = await addReadingId('00123');
    await prisma.settings.deleteMany();

    const response = await getReadingEmail(readingId);

    expect(response.json()).toMatchObject({
      subject: 'Leitura 31 October 2026',
      body: 'Leitura - 00123 - 31 October 2026',
    });
  });

  it('fills in the templates saved last when they were changed after the reading was saved', async () => {
    const readingId = await addReadingId('00123');
    await saveSettings({ subjectTemplate: '{reading} on {date}', bodyTemplate: 'Reading {reading}, {reading}' });

    const response = await getReadingEmail(readingId);

    expect(response.json()).toMatchObject({ subject: '00123 on 31 October 2026', body: 'Reading 00123, 00123' });
  });

  it('answers no attachment when the reading has no photo', async () => {
    const readingId = await addReadingId('000045');

    const response = await getReadingEmail(readingId);

    expect(response.json()).toMatchObject({ body: 'Date: 31 October 2026\nReading: 000045', attachment: null });
  });

  it('answers no address when the provider address is not set', async () => {
    await prisma.settings.deleteMany();
    const readingId = await addReadingId('00123');

    const response = await getReadingEmail(readingId);

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ to: null });
  });

  it('returns 400 VALIDATION_ERROR when the id is not a whole number', async () => {
    const response = await getReadingEmail('abc');

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({ code: 'VALIDATION_ERROR' });
  });

  it('returns 404 NOT_FOUND when the reading does not exist', async () => {
    const response = await getReadingEmail(999_999);

    expect(response.statusCode).toBe(404);
    expect(response.json()).toMatchObject({ code: 'NOT_FOUND' });
  });

  it('returns 401 when the browser is not signed in', async () => {
    const readingId = await addReadingId('00100');

    const response = await app.inject({ method: 'GET', url: `/readings/${readingId}/email` });

    expect(response.statusCode).toBe(401);
  });
});

describe('POST /readings/:id/send', () => {
  it('sends the email without the photo and marks the reading sent with the time when it was sent', async () => {
    await connectHotmail();
    const readingId = await addReadingWithPhotoId();
    const received = answerSendMail();
    const startedAt = Date.now();

    const response = await sendReading(readingId, { attachPhoto: false });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ id: readingId, status: 'sent' });
    const sentAt = Date.parse(response.json<{ sentAt: string }>().sentAt);
    expect(sentAt).toBeGreaterThanOrEqual(startedAt);
    expect(received).toHaveLength(1);
    expect(received[0]?.authorization).toBe(`Bearer ${STORED_ACCESS_TOKEN}`);
    expect(received[0]?.body).toMatchObject({
      message: {
        subject: SUBJECT,
        body: { content: 'Date: 31 October 2026\nReading: 00123' },
        toRecipients: [{ emailAddress: { address: PROVIDER_EMAIL } }],
      },
    });
    expect(attachmentsOf(received[0])).toEqual([]);
  });

  it('leaves the cost out of what Graph receives when the reading has a cost', async () => {
    await connectHotmail();
    const readingId = await addReadingId('00123');
    await updateReading(readingId, { costCents: 4210 });
    const received = answerSendMail();

    const response = await sendReading(readingId, { attachPhoto: false });

    expect(response.json()).toMatchObject({ status: 'sent', costCents: 4210 });
    expect(JSON.stringify(received[0]?.body)).not.toMatch(/42[.,]10|4210/);
  });

  it("emails the user's own subject and body when they edited the preview", async () => {
    await connectHotmail();
    const readingId = await addReadingWithPhotoId();
    const received = answerSendMail();

    const response = await sendReading(readingId, {
      attachPhoto: false,
      subject: '  Water meter reading  ',
      body: 'Hello,\nthe meter shows 00123.',
    });

    expect(response.statusCode).toBe(200);
    expect(received[0]?.body).toMatchObject({
      message: { subject: 'Water meter reading', body: { content: 'Hello,\nthe meter shows 00123.' } },
    });
  });

  it('returns 400 VALIDATION_ERROR and sends nothing when the edited subject is blank', async () => {
    await connectHotmail();
    const readingId = await addReadingWithPhotoId();
    const received = answerSendMail();

    const response = await sendReading(readingId, { attachPhoto: false, subject: '   ' });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({ code: 'VALIDATION_ERROR' });
    expect(received).toHaveLength(0);
  });

  it('keeps the email exactly as it went out on the reading, the edits included', async () => {
    await connectHotmail();
    const readingId = await addReadingWithPhotoId();
    answerSendMail();

    await sendReading(readingId, { attachPhoto: true, subject: 'Water meter reading', body: 'The meter shows 00123.' });
    const response = await getReading(readingId);

    expect(response.json()).toMatchObject({
      status: 'sent',
      sentEmail: {
        from: 'me@hotmail.example',
        to: PROVIDER_EMAIL,
        subject: 'Water meter reading',
        body: 'The meter shows 00123.',
        hasPhoto: true,
      },
    });
  });

  it("attaches the photo's file when the photo is asked for", async () => {
    await connectHotmail();
    const readingId = await addReadingWithPhotoId();
    const received = answerSendMail();

    const response = await sendReading(readingId, { attachPhoto: true });

    expect(response.statusCode).toBe(200);
    const jpeg = fakeJpeg({ width: 2000, height: 1500 });
    expect(attachmentsOf(received[0])).toEqual([
      {
        '@odata.type': '#microsoft.graph.fileAttachment',
        name: 'meter-2026-10-31.jpg',
        contentType: 'image/jpeg',
        contentBytes: jpeg.toString('base64'),
      },
    ]);
  });

  it("marks the reading failed and answers Microsoft's reason when Microsoft refuses the email", async () => {
    await connectHotmail();
    const readingId = await addReadingId('00123');
    answerSendMail(graphErrorAnswer('ErrorInvalidRecipients'));

    const response = await sendReading(readingId);

    expect(response.statusCode).toBe(502);
    expect(response.json()).toMatchObject({ code: 'MAIL_REFUSED' });
    expect(response.json<{ message: string }>().message).toContain('ErrorInvalidRecipients');
    expect(response.body).not.toContain(PROVIDER_EMAIL);
    const reading = await prisma.reading.findUniqueOrThrow({ where: { id: readingId } });
    expect(reading).toMatchObject({ status: 'FAILED', sentAt: null });
  });

  it('sends a failed reading again and marks it sent when the user tries again', async () => {
    await connectHotmail();
    const readingId = await addReadingId('00123');
    const received = answerSendMail(graphErrorAnswer('ErrorMessageSubmissionBlocked'), { status: 202 });
    await sendReading(readingId);

    const response = await sendReading(readingId);

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ status: 'sent' });
    expect(received).toHaveLength(2);
  });

  it('returns 409 MAIL_NOT_CONNECTED, sends nothing and keeps the reading not sent when Hotmail is not connected', async () => {
    const readingId = await addReadingId('00123');
    const received = answerSendMail();

    const response = await sendReading(readingId);

    expect(response.statusCode).toBe(409);
    expect(response.json()).toMatchObject({ code: 'MAIL_NOT_CONNECTED' });
    expect(received).toEqual([]);
    const reading = await prisma.reading.findUniqueOrThrow({ where: { id: readingId } });
    expect(reading.status).toBe('NOT_SENT');
  });

  it('sends to the address saved last when the provider address was changed in Settings', async () => {
    await connectHotmail();
    await saveProviderEmail('meter@other-provider.example');
    const readingId = await addReadingId('00123');
    const received = answerSendMail();

    await sendReading(readingId);

    expect(received[0]?.body).toMatchObject({
      message: { toRecipients: [{ emailAddress: { address: 'meter@other-provider.example' } }] },
    });
  });

  it('keeps the address a reading went out with when the provider address changes afterwards', async () => {
    await connectHotmail();
    const readingId = await addReadingId('00123');
    answerSendMail();
    await sendReading(readingId);

    await saveProviderEmail('meter@other-provider.example');
    const response = await getReading(readingId);

    expect(response.json()).toMatchObject({ sentEmail: { to: PROVIDER_EMAIL } });
  });

  it('keeps the subject and body a reading went out with when the templates change afterwards', async () => {
    await connectHotmail();
    const readingId = await addReadingId('00123');
    answerSendMail();
    await sendReading(readingId);
    await saveSettings({ subjectTemplate: 'New subject', bodyTemplate: 'New body' });

    const response = await getReading(readingId);

    expect(response.json()).toMatchObject({
      sentEmail: { subject: SUBJECT, body: 'Date: 31 October 2026\nReading: 00123' },
    });
  });

  it('returns 409 PROVIDER_EMAIL_NOT_SET, sends nothing and keeps the reading not sent when no address is set', async () => {
    await connectHotmail();
    await prisma.settings.deleteMany();
    const readingId = await addReadingId('00123');
    const received = answerSendMail();

    const response = await sendReading(readingId);

    expect(response.statusCode).toBe(409);
    expect(response.json()).toEqual({
      code: 'PROVIDER_EMAIL_NOT_SET',
      message: "Set the provider's address in Settings.",
    });
    expect(received).toEqual([]);
    const reading = await prisma.reading.findUniqueOrThrow({ where: { id: readingId } });
    expect(reading.status).toBe('NOT_SENT');
  });

  it('returns 409 READING_ALREADY_SENT and sends nothing more when the reading was sent already', async () => {
    await connectHotmail();
    const readingId = await addReadingId('00123');
    const received = answerSendMail();
    await sendReading(readingId);

    const response = await sendReading(readingId);

    expect(response.statusCode).toBe(409);
    expect(response.json()).toMatchObject({ code: 'READING_ALREADY_SENT' });
    expect(received).toHaveLength(1);
  });

  it('returns 400 NO_PHOTO_TO_ATTACH and sends nothing when the photo is asked for a reading without one', async () => {
    await connectHotmail();
    const readingId = await addReadingId('00123');
    const received = answerSendMail();

    const response = await sendReading(readingId, { attachPhoto: true });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({ code: 'NO_PHOTO_TO_ATTACH' });
    expect(received).toEqual([]);
  });

  it('returns 404 NOT_FOUND when the reading does not exist', async () => {
    await connectHotmail();

    const response = await sendReading(999_999);

    expect(response.statusCode).toBe(404);
    expect(response.json()).toMatchObject({ code: 'NOT_FOUND' });
  });

  it('returns 400 VALIDATION_ERROR when the body does not say whether to attach the photo', async () => {
    const readingId = await addReadingId('00123');

    const response = await sendReading(readingId, {});

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({ code: 'VALIDATION_ERROR' });
  });

  it('returns 401 and sends nothing when the browser is not signed in', async () => {
    await connectHotmail();
    const readingId = await addReadingId('00123');
    const received = answerSendMail();

    const response = await app.inject({
      method: 'POST',
      url: `/readings/${readingId}/send`,
      payload: { attachPhoto: false },
    });

    expect(response.statusCode).toBe(401);
    expect(received).toEqual([]);
  });
});
