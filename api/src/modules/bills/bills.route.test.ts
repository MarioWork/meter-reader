import { readdir } from 'node:fs/promises';
import { env } from '../../config/env.ts';
import { buildApp, type App } from '../../app.ts';
import { prisma } from '../../lib/prisma.ts';
import { resetAuthTables, setUpWithPassword, withSession } from '../auth/auth.fixture.ts';
import { BILL_MAX_BYTES, BILL_NAME_HEADER } from './bills.schema.ts';

let app: App;
let token: string;

const PDF = 'application/pdf';
const PDF_BILL = Buffer.concat([Buffer.from('%PDF-1.7\n'), Buffer.alloc(1000, 0x20)]);
const JPEG_BILL = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
const PNG_BILL = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00]);

function addBill(payload: Buffer, contentType = PDF, sentName?: string) {
  const nameHeader = sentName === undefined ? {} : { [BILL_NAME_HEADER]: sentName };

  return app.inject({
    method: 'POST',
    url: '/bills',
    headers: { 'content-type': contentType, ...nameHeader },
    payload,
    ...withSession(token),
  });
}

function getBill(id: number | string, query = '') {
  return app.inject({ method: 'GET', url: `/bills/${id}${query}`, ...withSession(token) });
}

async function addBillId(payload = PDF_BILL, contentType = PDF, sentName?: string): Promise<number> {
  return (await addBill(payload, contentType, sentName)).json<{ id: number }>().id;
}

async function linkToReading(billId: number, date: string): Promise<void> {
  const reading = await prisma.reading.create({ data: { digits: '00123', date: new Date(`${date}T00:00:00Z`) } });

  await prisma.bill.update({ where: { id: billId }, data: { readingId: reading.id } });
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
  await prisma.bill.deleteMany();
  await prisma.reading.deleteMany();
  await resetAuthTables();
  token = await setUpWithPassword(app);
});

describe('POST /bills', () => {
  it('keeps the PDF in the uploads folder under a name the server chose and answers the bill when the file is a PDF', async () => {
    const response = await addBill(PDF_BILL);

    expect(response.statusCode).toBe(201);
    expect(Object.keys(response.json<object>()).sort()).toEqual([
      'contentType',
      'createdAt',
      'id',
      'name',
      'sizeBytes',
    ]);
    expect(response.json()).toMatchObject({ contentType: PDF, sizeBytes: PDF_BILL.length });
    const row = await prisma.bill.findUniqueOrThrow({ where: { id: response.json<{ id: number }>().id } });
    expect(row).toMatchObject({ fileType: 'PDF', sizeBytes: PDF_BILL.length, readingId: null });
    expect(row.fileName).toMatch(/^[0-9a-f-]{36}\.pdf$/);
    expect(await storedFileNames()).toContain(row.fileName);
  });

  it("keeps the name the file had on the user's device and answers it when the client sends one", async () => {
    const response = await addBill(PDF_BILL, PDF, encodeURIComponent('Fatura de Outubro ü.pdf'));

    expect(response.statusCode).toBe(201);
    expect(response.json()).toMatchObject({ name: 'Fatura de Outubro ü.pdf' });
    const row = await prisma.bill.findUniqueOrThrow({ where: { id: response.json<{ id: number }>().id } });
    expect(row.originalName).toBe('Fatura de Outubro ü.pdf');
    expect(row.fileName).toMatch(/^[0-9a-f-]{36}\.pdf$/);
  });

  it('keeps only the last part of the name when the client sends a path', async () => {
    const response = await addBill(PDF_BILL, PDF, encodeURIComponent('../../uploads/october.pdf'));

    expect(response.json()).toMatchObject({ name: 'october.pdf' });
  });

  it('answers a name of its own and keeps none when the client sends no name', async () => {
    const response = await addBill(PDF_BILL);

    expect(response.json()).toMatchObject({ name: 'bill.pdf' });
    const row = await prisma.bill.findUniqueOrThrow({ where: { id: response.json<{ id: number }>().id } });
    expect(row.originalName).toBeNull();
  });

  it('keeps the bill with a name of its own when the sent name is not percent-encoded right', async () => {
    const response = await addBill(PDF_BILL, PDF, '%E0%A4%A');

    expect(response.statusCode).toBe(201);
    expect(response.json()).toMatchObject({ name: 'bill.pdf' });
  });

  it.each([
    ['a JPEG', JPEG_BILL, 'image/jpeg'],
    ['a PNG', PNG_BILL, 'image/png'],
    ['a PNG sent as a PDF', PNG_BILL, PDF],
    ['a GIF', Buffer.from('GIF89a......'), 'image/gif'],
    ['text sent as a PDF', Buffer.from('not a bill'), PDF],
    ['a Word document', Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x14, 0x00]), 'application/msword'],
  ])(
    'returns 400 BILL_NOT_SUPPORTED with the reason and keeps nothing when it is %s',
    async (_scenario, payload, type) => {
      const response = await addBill(payload, type);

      expect(response.statusCode).toBe(400);
      expect(response.json()).toEqual({ code: 'BILL_NOT_SUPPORTED', message: 'Bills must be a PDF.' });
      expect(await prisma.bill.count()).toBe(0);
    },
  );

  it('returns 400 BILL_NOT_SUPPORTED and keeps nothing when the file is empty', async () => {
    const response = await addBill(Buffer.alloc(0));

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({ code: 'BILL_NOT_SUPPORTED' });
    expect(await prisma.bill.count()).toBe(0);
  });

  it('keeps the bill when the file is exactly 10 MB', async () => {
    const payload = Buffer.concat([PDF_BILL, Buffer.alloc(BILL_MAX_BYTES - PDF_BILL.length, 0x20)]);

    const response = await addBill(payload);

    expect(response.statusCode).toBe(201);
  });

  it('returns 413 BILL_TOO_LARGE with the reason and keeps nothing when the file is over 10 MB', async () => {
    const payload = Buffer.concat([PDF_BILL, Buffer.alloc(BILL_MAX_BYTES, 0x20)]);

    const response = await addBill(payload);

    expect(response.statusCode).toBe(413);
    expect(response.json()).toEqual({ code: 'BILL_TOO_LARGE', message: 'The bill must be at most 10 MB' });
    expect(await prisma.bill.count()).toBe(0);
  });

  it('returns 401 and keeps nothing when the browser is not signed in', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/bills',
      headers: { 'content-type': PDF },
      payload: PDF_BILL,
    });

    expect(response.statusCode).toBe(401);
    expect(await prisma.bill.count()).toBe(0);
  });
});

describe('GET /bills/:id', () => {
  it('answers the file to open in the browser, named after its reading’s day, when the bill exists', async () => {
    const billId = await addBillId();
    await linkToReading(billId, '2026-10-31');

    const response = await getBill(billId);

    expect(response.statusCode).toBe(200);
    expect(response.headers['content-type']).toBe(PDF);
    expect(response.headers['content-disposition']).toBe(
      'inline; filename="bill-2026-10-31.pdf"; filename*=UTF-8\'\'bill-2026-10-31.pdf',
    );
    expect(response.headers['cache-control']).toBe('private, max-age=31536000, immutable');
    expect(response.headers['content-security-policy']).toBeUndefined();
    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response.rawPayload).toEqual(PDF_BILL);
  });

  it("names the file after its name on the user's device, with the reading's day as the ASCII name, when it came with one", async () => {
    const billId = await addBillId(PDF_BILL, PDF, encodeURIComponent("Fatura (Outubro) ü's.pdf"));
    await linkToReading(billId, '2026-10-31');

    const response = await getBill(billId);

    expect(response.headers['content-disposition']).toBe(
      'inline; filename="bill-2026-10-31.pdf"; filename*=UTF-8\'\'Fatura%20%28Outubro%29%20%C3%BC%27s.pdf',
    );
  });

  it('answers the file to save when download=true', async () => {
    const billId = await addBillId();

    const response = await getBill(billId, '?download=true');

    expect(response.statusCode).toBe(200);
    expect(response.headers['content-type']).toBe(PDF);
    expect(response.headers['content-disposition']).toBe(
      'attachment; filename="bill.pdf"; filename*=UTF-8\'\'bill.pdf',
    );
  });

  it('returns 404 NOT_FOUND when no bill has this id', async () => {
    const response = await getBill(999_999);

    expect(response.statusCode).toBe(404);
    expect(response.json()).toMatchObject({ code: 'NOT_FOUND' });
  });

  it('returns 400 VALIDATION_ERROR when the id is not a whole number', async () => {
    const response = await getBill('abc');

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({ code: 'VALIDATION_ERROR' });
  });

  it('returns 401 when the browser is not signed in', async () => {
    const billId = await addBillId();

    const response = await app.inject({ method: 'GET', url: `/bills/${billId}` });

    expect(response.statusCode).toBe(401);
  });
});
