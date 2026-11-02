import type { InjectOptions } from 'fastify';
import { buildApp, type App } from '../../app.ts';
import { fakeJpeg } from '../../lib/jpeg.fixture.ts';
import { prisma } from '../../lib/prisma.ts';
import { resetAuthTables, setUpWithPassword, withSession } from '../auth/auth.fixture.ts';

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

beforeAll(async () => {
  app = await buildApp();
});

afterAll(async () => {
  await app.close();
});

beforeEach(async () => {
  await prisma.photo.deleteMany();
  await prisma.reading.deleteMany();
  await resetAuthTables();
  token = await setUpWithPassword(app);
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
      'status',
    ]);
    expect(response.json()).toMatchObject({ digits: '00123', date: '2026-10-31', status: 'notSent', photoId: null });
  });

  it('links the photo to the reading when the photo id is given', async () => {
    const photoId = await addPhoto();

    const response = await addReading({ digits: '00123', date: '2026-10-31', photoId });

    expect(response.statusCode).toBe(201);
    expect(response.json()).toMatchObject({ photoId });
    const photo = await prisma.photo.findUniqueOrThrow({ where: { id: photoId } });
    expect(photo.readingId).toBe(response.json<{ id: number }>().id);
  });

  it('returns 404 NOT_FOUND and saves nothing when no photo has the id', async () => {
    const response = await addReading({ digits: '00123', date: '2026-10-31', photoId: 999_999 });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toMatchObject({ code: 'NOT_FOUND' });
    expect(await prisma.reading.count()).toBe(0);
  });

  it('returns 404 NOT_FOUND and keeps the first link when the photo already belongs to a reading', async () => {
    const photoId = await addPhoto();
    const first = await addReading({ digits: '00123', date: '2026-10-30', photoId });

    const response = await addReading({ digits: '00124', date: '2026-10-31', photoId });

    expect(response.statusCode).toBe(404);
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
