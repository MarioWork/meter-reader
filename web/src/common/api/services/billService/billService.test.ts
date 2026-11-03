import { AxiosError } from 'axios';
import { http, HttpResponse } from 'msw/http';
import { server, TEST_BASE_API_URL } from '@mocks/server';
import billService, { BILL_NAME_HEADER } from './billService';

const API = TEST_BASE_API_URL;
const PDF_BYTES = [0x25, 0x50, 0x44, 0x46, 0x2d];
const BILL = new File([new Uint8Array(PDF_BYTES)], 'Fatura de Março.pdf', { type: 'application/pdf' });
const SAVED_BILL = {
  id: 7,
  name: 'Fatura de Março.pdf',
  contentType: 'application/pdf',
  sizeBytes: 5,
  createdAt: '2026-11-03T09:00:00.000Z',
};

describe('addBill', () => {
  it("posts the file's bytes as the body, with its own type and name, and returns a success envelope", async () => {
    let receivedType: string | null = null;
    let receivedName: string | null = null;
    let receivedBytes = new Uint8Array();
    server.use(
      http.post(`${API}/bills`, async ({ request }) => {
        receivedType = request.headers.get('content-type');
        receivedName = request.headers.get(BILL_NAME_HEADER);
        receivedBytes = new Uint8Array(await request.arrayBuffer());
        return HttpResponse.json(SAVED_BILL, { status: 201 });
      }),
    );

    const response = await billService.addBill(BILL);

    expect(receivedType).toBe('application/pdf');
    // Percent-encoded: a header holds ASCII only.
    expect(receivedName).toBe('Fatura%20de%20Mar%C3%A7o.pdf');
    expect([...receivedBytes]).toEqual(PDF_BYTES);
    expect(response).toEqual({ success: true, data: SAVED_BILL });
  });

  it('returns a failure envelope with the server reason instead of throwing', async () => {
    server.use(
      http.post(`${API}/bills`, () =>
        HttpResponse.json({ code: 'BILL_NOT_SUPPORTED', message: 'Bills must be a PDF.' }, { status: 400 }),
      ),
    );

    const response = await billService.addBill(new File(['GIF89a'], 'bill.gif', { type: 'image/gif' }));

    expect(response).toEqual({
      success: false,
      error: { statusCode: 400, code: 'BILL_NOT_SUPPORTED', message: 'Bills must be a PDF.' },
    });
  });
});

describe('getBill', () => {
  it("returns the bill's file as the API sends it", async () => {
    server.use(
      http.get(
        `${API}/bills/7`,
        () => new HttpResponse(new Uint8Array(PDF_BYTES), { headers: { 'Content-Type': 'application/pdf' } }),
      ),
    );

    const file = await billService.getBill(7);

    expect(file.type).toBe('application/pdf');
    expect([...new Uint8Array(await file.arrayBuffer())]).toEqual(PDF_BYTES);
  });

  it('throws when the API has no such bill', async () => {
    server.use(
      http.get(`${API}/bills/7`, () =>
        HttpResponse.json({ code: 'NOT_FOUND', message: 'Bill not found' }, { status: 404 }),
      ),
    );

    await expect(billService.getBill(7)).rejects.toBeInstanceOf(AxiosError);
  });
});
