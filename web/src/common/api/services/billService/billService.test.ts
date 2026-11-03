import { http, HttpResponse } from 'msw/http';
import { server, TEST_BASE_API_URL } from '@mocks/server';
import billService from './billService';

const API = TEST_BASE_API_URL;
const PDF_BYTES = [0x25, 0x50, 0x44, 0x46, 0x2d];
const BILL = new File([new Uint8Array(PDF_BYTES)], 'october.pdf', { type: 'application/pdf' });
const SAVED_BILL = { id: 7, contentType: 'application/pdf', sizeBytes: 5, createdAt: '2026-11-03T09:00:00.000Z' };

it("posts the file's bytes as the body, with its own type, and returns a success envelope", async () => {
  let receivedType: string | null = null;
  let receivedBytes = new Uint8Array();
  server.use(
    http.post(`${API}/bills`, async ({ request }) => {
      receivedType = request.headers.get('content-type');
      receivedBytes = new Uint8Array(await request.arrayBuffer());
      return HttpResponse.json(SAVED_BILL, { status: 201 });
    }),
  );

  const response = await billService.addBill(BILL);

  expect(receivedType).toBe('application/pdf');
  expect([...receivedBytes]).toEqual(PDF_BYTES);
  expect(response).toEqual({ success: true, data: SAVED_BILL });
});

it('returns a failure envelope with the server reason instead of throwing', async () => {
  server.use(
    http.post(`${API}/bills`, () =>
      HttpResponse.json(
        { code: 'BILL_NOT_SUPPORTED', message: 'The bill must be a PDF, JPEG or PNG' },
        { status: 400 },
      ),
    ),
  );

  const response = await billService.addBill(new File(['GIF89a'], 'bill.gif', { type: 'image/gif' }));

  expect(response).toEqual({
    success: false,
    error: { statusCode: 400, code: 'BILL_NOT_SUPPORTED', message: 'The bill must be a PDF, JPEG or PNG' },
  });
});
