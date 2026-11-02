import { access } from 'node:fs/promises';
import type { InjectOptions } from 'fastify';
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
  await resetAuthTables();
  token = await setUpWithPassword(app);
});

afterEach(() => {
  microsoftServer.resetHandlers();
});

describe('POST /readings', () => {
  it('saves the reading as not sent and answers it when the digits and date are valid', async () => {
    const response = await addReading({ digits: '00123', date: '2026-10-31' });

    expect(response.statusCode).toBe(201);
    expect(Object.keys(response.json<object>()).sort()).toEqual([
      'createdAt',
      'date',
      'digits',
      'id',
      'photoId',
      'sentAt',
      'status',
    ]);
    expect(response.json()).toMatchObject({
      digits: '00123',
      date: '2026-10-31',
      status: 'notSent',
      photoId: null,
      sentAt: null,
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

describe('GET /readings/:id/email', () => {
  it('answers the address, the subject and the body, with the photo to attach, when the reading has a photo', async () => {
    const photoId = await addPhoto();
    const readingId = (await addReading({ digits: '00123', date: '2026-10-31', photoId })).json<{ id: number }>().id;

    const response = await getReadingEmail(readingId);

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      to: PROVIDER_EMAIL,
      subject: 'test',
      body: 'Date: 31 October 2026\nReading: 00123',
      attachment: { photoId, name: 'meter-2026-10-31.jpg' },
    });
  });

  it('answers no attachment when the reading has no photo', async () => {
    const readingId = await addReadingId('000045');

    const response = await getReadingEmail(readingId);

    expect(response.json()).toMatchObject({ body: 'Date: 31 October 2026\nReading: 000045', attachment: null });
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
        subject: 'test',
        body: { content: 'Date: 31 October 2026\nReading: 00123' },
        toRecipients: [{ emailAddress: { address: PROVIDER_EMAIL } }],
      },
    });
    expect(attachmentsOf(received[0])).toEqual([]);
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
