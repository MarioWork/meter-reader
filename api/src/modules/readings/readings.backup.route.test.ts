import { buildApp, type App } from '../../app.ts';
import { prisma } from '../../lib/prisma.ts';
import { resetAuthTables, setUpWithPassword, withSession } from '../auth/auth.fixture.ts';
import type { ReadingsBackupResponse } from './readings.schema.ts';

// More than one page of the history (10), so a backup that paged would show.
const MANY_READINGS = 12;
const PHOTO_FILE_NAME = '7b0c2f4e-1d3a-4e5b-9f6a-2c8d1e0b3a4f.jpg';
const SENT_AT = '2026-11-01T09:30:00.000Z';
const SENT_BODY = 'Date: 31 October 2026\nReading: 00123';
const CSV_HEADER =
  'id,date,digits,status,sent_at,sent_from,sent_to,sent_subject,sent_body,sent_with_photo,photo_file_name';
const ATTACHMENT_FILE_NAME = /^attachment; filename="water-readings-backup-\d{4}-\d{2}-\d{2}\.(json|csv)"$/;

let app: App;
let token: string;

function getBackup(format: 'json' | 'csv') {
  return app.inject({ method: 'GET', url: `/readings/backup.${format}`, ...withSession(token) });
}

// Sent, with its email kept and its photo attached: every field a reading has today.
async function addSentReading(): Promise<number> {
  const reading = await prisma.reading.create({
    data: {
      digits: '00123',
      date: new Date('2026-10-31T00:00:00.000Z'),
      status: 'SENT',
      sentAt: new Date(SENT_AT),
      sentFrom: 'me@hotmail.example',
      sentTo: 'readings@water-provider.example',
      sentSubject: 'Water meter reading',
      sentBody: SENT_BODY,
      sentWithPhoto: true,
      photo: { create: { fileName: PHOTO_FILE_NAME, sizeBytes: 1024 } },
    },
  });

  return reading.id;
}

async function addReading(digits: string, date: string, status: 'NOT_SENT' | 'FAILED' = 'NOT_SENT'): Promise<number> {
  const reading = await prisma.reading.create({ data: { digits, date: new Date(`${date}T00:00:00.000Z`), status } });

  return reading.id;
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

describe('GET /readings/backup.json', () => {
  it('answers every reading with its sent email and photo file name, as a download, when readings exist', async () => {
    const sentId = await addSentReading();
    const notSentId = await addReading('00456', '2026-11-02');

    const response = await getBackup('json');

    expect(response.statusCode).toBe(200);
    expect(response.headers['content-disposition']).toMatch(ATTACHMENT_FILE_NAME);
    const backup = response.json<ReadingsBackupResponse>();
    expect(Number.isNaN(Date.parse(backup.exportedAt))).toBe(false);
    expect(backup.readings).toEqual([
      {
        id: notSentId,
        digits: '00456',
        date: '2026-11-02',
        status: 'notSent',
        sentAt: null,
        sentEmail: null,
        photoFileName: null,
      },
      {
        id: sentId,
        digits: '00123',
        date: '2026-10-31',
        status: 'sent',
        sentAt: SENT_AT,
        sentEmail: {
          from: 'me@hotmail.example',
          to: 'readings@water-provider.example',
          subject: 'Water meter reading',
          body: SENT_BODY,
          hasPhoto: true,
        },
        photoFileName: PHOTO_FILE_NAME,
      },
    ]);
  });

  it('answers every reading, not one page, when there are more than a page of them', async () => {
    for (let day = 1; day <= MANY_READINGS; day += 1) {
      await addReading(String(day).padStart(5, '0'), `2026-10-${String(day).padStart(2, '0')}`);
    }

    const response = await getBackup('json');

    expect(response.json<ReadingsBackupResponse>().readings).toHaveLength(MANY_READINGS);
  });

  it('answers a failed reading as failed with no sent email when its send failed', async () => {
    await addReading('00789', '2026-11-03', 'FAILED');

    const response = await getBackup('json');

    expect(response.json()).toMatchObject({ readings: [{ status: 'failed', sentAt: null, sentEmail: null }] });
  });

  it('answers no readings when none were saved', async () => {
    const response = await getBackup('json');

    expect(response.json<ReadingsBackupResponse>().readings).toEqual([]);
  });

  it('returns 401 when the browser is not signed in', async () => {
    const response = await app.inject({ method: 'GET', url: '/readings/backup.json' });

    expect(response.statusCode).toBe(401);
  });
});

describe('GET /readings/backup.csv', () => {
  it('answers a header and one line per reading, as a CSV download, when readings exist', async () => {
    const sentId = await addSentReading();
    const notSentId = await addReading('00456', '2026-11-02');

    const response = await getBackup('csv');

    expect(response.statusCode).toBe(200);
    expect(response.headers['content-type']).toBe('text/csv; charset=utf-8');
    expect(response.headers['content-disposition']).toMatch(ATTACHMENT_FILE_NAME);
    expect(response.body).toBe(
      [
        CSV_HEADER,
        `${notSentId},2026-11-02,00456,notSent,,,,,,,`,
        `${sentId},2026-10-31,00123,sent,${SENT_AT},me@hotmail.example,readings@water-provider.example,` +
          `Water meter reading,"${SENT_BODY}",true,${PHOTO_FILE_NAME}`,
        '',
      ].join('\r\n'),
    );
  });

  it('answers every reading, not one page, when there are more than a page of them', async () => {
    for (let day = 1; day <= MANY_READINGS; day += 1) {
      await addReading(String(day).padStart(5, '0'), `2026-10-${String(day).padStart(2, '0')}`);
    }

    const response = await getBackup('csv');

    expect(response.body.trimEnd().split('\r\n')).toHaveLength(MANY_READINGS + 1);
  });

  it('answers only the header when no readings were saved', async () => {
    const response = await getBackup('csv');

    expect(response.body).toBe(`${CSV_HEADER}\r\n`);
  });

  it('returns 401 when the browser is not signed in', async () => {
    const response = await app.inject({ method: 'GET', url: '/readings/backup.csv' });

    expect(response.statusCode).toBe(401);
  });
});
