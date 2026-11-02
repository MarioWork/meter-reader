import type { InjectOptions } from 'fastify';
import { buildApp, type App } from '../../app.ts';
import { prisma } from '../../lib/prisma.ts';
import { resetAuthTables, setUpWithPassword, withSession } from '../auth/auth.fixture.ts';

let app: App;
let token: string;

function addReading(payload: InjectOptions['payload']) {
  return app.inject({ method: 'POST', url: '/readings', payload, ...withSession(token) });
}

function getReadings(query = '') {
  return app.inject({ method: 'GET', url: `/readings${query}`, ...withSession(token) });
}

beforeAll(async () => {
  app = await buildApp();
});

afterAll(async () => {
  await app.close();
});

beforeEach(async () => {
  await prisma.reading.deleteMany();
  await resetAuthTables();
  token = await setUpWithPassword(app);
});

describe('POST /readings', () => {
  it('saves the reading as not sent and answers it when the digits and date are valid', async () => {
    const response = await addReading({ digits: '00123', date: '2026-10-31' });

    expect(response.statusCode).toBe(201);
    expect(Object.keys(response.json<object>()).sort()).toEqual(['createdAt', 'date', 'digits', 'id', 'status']);
    expect(response.json()).toMatchObject({ digits: '00123', date: '2026-10-31', status: 'notSent' });
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
