import { http, HttpResponse } from 'msw/http';
import { server, TEST_BASE_API_URL } from '@mocks/server';
import { BILL_NAME_HEADER } from '@services/billService/billService';
import { createFormData } from '@utils/formDataUtils';
import { updateCostAndBillAction } from './costAndBillModalActions';

const API = TEST_BASE_API_URL;
// The newest reading in the mock history.
const READING_ID = '14';
const PDF_BYTES = [0x25, 0x50, 0x44, 0x46, 0x2d];
const PDF_BILL = new File([new Uint8Array(PDF_BYTES)], 'october-bill.pdf', { type: 'application/pdf' });
const PNG_BILL = new File([new Uint8Array([0x89, 0x50, 0x4e, 0x47])], 'october-bill.png', { type: 'image/png' });
const FOUND_STATUS = 302;

type ActionArgs = Parameters<typeof updateCostAndBillAction>[0];

const ACTION_PATTERN = '/home/readings/:readingId/cost-and-bill';

function submit(fields: Record<string, unknown>) {
  const url = new URL(`http://localhost/home/readings/${READING_ID}/cost-and-bill?page=1`);
  const request = new Request(url, { method: 'PATCH', body: createFormData(fields) });
  const args = { request, url, pattern: ACTION_PATTERN, params: { readingId: READING_ID }, context: {} };

  return updateCostAndBillAction(args as unknown as ActionArgs);
}

// Keeps what the app asked to save, then lets the mock API answer it as usual.
function recordUpdateRequests() {
  const received: unknown[] = [];

  server.use(
    http.patch(`${API}/readings/:id`, async ({ request }) => {
      received.push(await request.clone().json());
    }),
  );

  return received;
}

it('uploads the bill first, then links it to the reading with its id and goes back to the history', async () => {
  let uploadedType: string | null = null;
  let uploadedName: string | null = null;
  let uploadedBytes = new Uint8Array();
  server.use(
    http.post(`${API}/bills`, async ({ request }) => {
      uploadedType = request.headers.get('content-type');
      uploadedName = request.headers.get(BILL_NAME_HEADER);
      uploadedBytes = new Uint8Array(await request.clone().arrayBuffer());
    }),
  );
  const received = recordUpdateRequests();

  const result = await submit({ changes: { costCents: 4210 }, bill: PDF_BILL });

  expect(uploadedType).toBe('application/pdf');
  expect(uploadedName).toBe('october-bill.pdf');
  expect([...uploadedBytes]).toEqual(PDF_BYTES);
  expect(received).toEqual([{ costCents: 4210, billId: 1 }]);
  expect(result).toBeInstanceOf(Response);
  expect((result as Response).status).toBe(FOUND_STATUS);
  expect((result as Response).headers.get('Location')).toBe('/home?page=1');
});

it('replaces the saved bill with the one uploaded now', async () => {
  await submit({ changes: { costCents: null }, bill: PDF_BILL });
  const received = recordUpdateRequests();

  await submit({ changes: { costCents: null }, bill: PNG_BILL });

  expect(received).toEqual([{ costCents: null, billId: 2 }]);
});

it('sends the bill as null to remove it, with no upload', async () => {
  let isUploaded = false;
  server.use(
    http.post(`${API}/bills`, () => {
      isUploaded = true;
    }),
  );
  const received = recordUpdateRequests();

  await submit({ changes: { costCents: null, billId: null } });

  expect(isUploaded).toBe(false);
  expect(received).toEqual([{ costCents: null, billId: null }]);
});

it.each([
  ['BILL_NOT_SUPPORTED', 400, 'The bill must be a PDF, JPEG or PNG'],
  ['BILL_TOO_LARGE', 413, 'The bill must be at most 10 MB'],
])("returns the upload's %s failure and changes nothing on the reading", async (code, status, message) => {
  server.use(http.post(`${API}/bills`, () => HttpResponse.json({ code, message }, { status })));
  const received = recordUpdateRequests();

  const result = await submit({ changes: { costCents: 4210 }, bill: PDF_BILL });

  expect(result).toEqual({ success: false, error: { statusCode: status, code, message } });
  expect(received).toEqual([]);
});
