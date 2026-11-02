import { readdir } from 'node:fs/promises';
import { env } from '../../config/env.ts';
import { buildApp, type App } from '../../app.ts';
import { fakeJpeg } from '../../lib/jpeg.fixture.ts';
import { prisma } from '../../lib/prisma.ts';
import { resetAuthTables, setUpWithPassword, withSession } from '../auth/auth.fixture.ts';
import { PHOTO_MAX_BYTES } from './photos.schema.ts';

let app: App;
let token: string;

const JPEG = 'image/jpeg';
const SHRUNK_PHOTO = fakeJpeg({ width: 2000, height: 1500, paddingBytes: 1000 });

function addPhoto(payload: Buffer, contentType = JPEG) {
  return app.inject({
    method: 'POST',
    url: '/photos',
    headers: { 'content-type': contentType },
    payload,
    ...withSession(token),
  });
}

function getPhoto(id: number | string) {
  return app.inject({ method: 'GET', url: `/photos/${id}`, ...withSession(token) });
}

async function storedFileNames(): Promise<string[]> {
  const names = await readdir(env.UPLOADS_DIR);

  return names.filter((name) => !name.endsWith('.partial'));
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

describe('POST /photos', () => {
  it('keeps the JPEG in the uploads folder and answers its id when the photo is shrunk', async () => {
    const response = await addPhoto(SHRUNK_PHOTO);

    expect(response.statusCode).toBe(201);
    expect(Object.keys(response.json<object>()).sort()).toEqual(['createdAt', 'id']);
    const row = await prisma.photo.findUniqueOrThrow({ where: { id: response.json<{ id: number }>().id } });
    expect(row).toMatchObject({ sizeBytes: SHRUNK_PHOTO.length, readingId: null });
    expect(await storedFileNames()).toContain(row.fileName);
  });

  it('returns 400 PHOTO_TOO_LARGE and keeps nothing when the longest side is over 2000 px', async () => {
    const response = await addPhoto(fakeJpeg({ width: 1500, height: 2001 }));

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({ code: 'PHOTO_TOO_LARGE' });
    expect(await prisma.photo.count()).toBe(0);
  });

  it('returns 413 when the file is over 3 MB', async () => {
    const response = await addPhoto(fakeJpeg({ width: 2000, height: 1500, paddingBytes: PHOTO_MAX_BYTES }));

    expect(response.statusCode).toBe(413);
    expect(await prisma.photo.count()).toBe(0);
  });

  it('returns 400 PHOTO_NOT_JPEG when the bytes are not a JPEG', async () => {
    const response = await addPhoto(Buffer.from('not a photo'));

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({ code: 'PHOTO_NOT_JPEG' });
  });

  it('returns 415 when the body is not sent as a JPEG', async () => {
    const response = await addPhoto(SHRUNK_PHOTO, 'image/png');

    expect(response.statusCode).toBe(415);
  });

  it('returns 401 and keeps nothing when the browser is not signed in', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/photos',
      headers: { 'content-type': JPEG },
      payload: SHRUNK_PHOTO,
    });

    expect(response.statusCode).toBe(401);
    expect(await prisma.photo.count()).toBe(0);
  });
});

describe('GET /photos/:id', () => {
  it('answers the JPEG it kept, cacheable by this browser only', async () => {
    const { id } = (await addPhoto(SHRUNK_PHOTO)).json<{ id: number }>();

    const response = await getPhoto(id);

    expect(response.statusCode).toBe(200);
    expect(response.headers['content-type']).toBe(JPEG);
    expect(response.headers['cache-control']).toBe('private, max-age=31536000, immutable');
    expect(response.rawPayload).toEqual(SHRUNK_PHOTO);
  });

  it('returns 404 NOT_FOUND when no photo has this id', async () => {
    const response = await getPhoto(999_999);

    expect(response.statusCode).toBe(404);
    expect(response.json()).toMatchObject({ code: 'NOT_FOUND' });
  });

  it('returns 400 VALIDATION_ERROR when the id is not a number', async () => {
    const response = await getPhoto('meter');

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({ code: 'VALIDATION_ERROR' });
  });

  it('returns 401 when the browser is not signed in', async () => {
    const { id } = (await addPhoto(SHRUNK_PHOTO)).json<{ id: number }>();

    const response = await app.inject({ method: 'GET', url: `/photos/${id}` });

    expect(response.statusCode).toBe(401);
  });
});
