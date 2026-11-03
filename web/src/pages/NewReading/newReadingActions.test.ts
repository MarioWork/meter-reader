import { http, HttpResponse } from 'msw/http';
import { BASE_ROUTES_PATHS } from '@application/routes/routesUtils';
import { server, TEST_BASE_API_URL } from '@mocks/server';
import { createFormData } from '@utils/formDataUtils';
import { createReadingAction } from './newReadingActions';

const API = TEST_BASE_API_URL;
const READING = { digits: '00600', date: '2026-10-31' };
const SHRUNK_PHOTO = new File([new Uint8Array([0xff, 0xd8, 0xff, 0xd9])], 'meter.jpg', { type: 'image/jpeg' });
const UPLOADED_PHOTO = { id: 1000, createdAt: '2026-11-02T09:00:00.000Z' };
const FOUND_STATUS = 302;

function submit(fields: Record<string, unknown>) {
  const request = new Request('http://localhost/readings/new', { method: 'POST', body: createFormData(fields) });

  return createReadingAction({ request, params: {}, context: {} } as Parameters<typeof createReadingAction>[0]);
}

it('uploads the photo first, then saves the reading with its id and goes Home', async () => {
  let uploadedBytes = new Uint8Array();
  let savedReading: unknown;
  server.use(
    http.post(`${API}/photos`, async ({ request }) => {
      uploadedBytes = new Uint8Array(await request.arrayBuffer());
      return HttpResponse.json(UPLOADED_PHOTO, { status: 201 });
    }),
    http.post(`${API}/readings`, async ({ request }) => {
      savedReading = await request.json();
      return HttpResponse.json({}, { status: 201 });
    }),
  );

  const result = await submit({ intent: 'save', reading: READING, photo: SHRUNK_PHOTO });

  expect([...uploadedBytes]).toEqual([0xff, 0xd8, 0xff, 0xd9]);
  expect(savedReading).toEqual({ ...READING, photoId: UPLOADED_PHOTO.id });
  expect(result).toBeInstanceOf(Response);
  expect((result as Response).status).toBe(FOUND_STATUS);
  expect((result as Response).headers.get('Location')).toBe(BASE_ROUTES_PATHS.HOME);
});

it('saves the reading without a photo id when no photo was picked', async () => {
  let savedReading: unknown;
  server.use(
    http.post(`${API}/readings`, async ({ request }) => {
      savedReading = await request.json();
      return HttpResponse.json({}, { status: 201 });
    }),
  );

  await submit({ intent: 'save', reading: READING });

  expect(savedReading).toEqual(READING);
});

it("returns the upload's failure and saves no reading when the photo upload fails", async () => {
  let isReadingPosted = false;
  server.use(
    http.post(`${API}/photos`, () =>
      HttpResponse.json({ code: 'PHOTO_TOO_LARGE', message: 'The photo is too large' }, { status: 400 }),
    ),
    http.post(`${API}/readings`, () => {
      isReadingPosted = true;
      return HttpResponse.json({}, { status: 201 });
    }),
  );

  const result = await submit({ reading: READING, photo: SHRUNK_PHOTO });

  expect(result).toEqual({
    success: false,
    error: { statusCode: 400, code: 'PHOTO_TOO_LARGE', message: 'The photo is too large' },
  });
  expect(isReadingPosted).toBe(false);
});

it('sends nothing when the photo is not a JPEG', async () => {
  let isAnythingPosted = false;
  server.use(
    http.post(`${API}/*`, () => {
      isAnythingPosted = true;
      return HttpResponse.json({}, { status: 201 });
    }),
  );
  const png = new File([new Uint8Array([0x89, 0x50])], 'meter.png', { type: 'image/png' });

  const result = await submit({ reading: READING, photo: png });

  expect(result).toEqual({ success: false });
  expect(isAnythingPosted).toBe(false);
});

it('sends the saved reading with its photo straight away when the user picks Send, then goes Home', async () => {
  let sentPath = '';
  let sentFields: unknown;
  server.use(
    http.post(`${API}/photos`, () => HttpResponse.json(UPLOADED_PHOTO, { status: 201 })),
    http.post(`${API}/readings`, () =>
      HttpResponse.json({ id: 42, ...READING, photoId: UPLOADED_PHOTO.id }, { status: 201 }),
    ),
    http.post(`${API}/readings/:id/send`, async ({ request, params }) => {
      sentPath = String(params.id);
      sentFields = await request.json();
      return HttpResponse.json({});
    }),
  );

  const result = await submit({ intent: 'send', reading: READING, photo: SHRUNK_PHOTO });

  expect(sentPath).toBe('42');
  expect(sentFields).toEqual({ attachPhoto: true });
  expect((result as Response).headers.get('Location')).toBe(BASE_ROUTES_PATHS.HOME);
});

it('still goes Home when the send fails, since the reading is already saved', async () => {
  server.use(
    http.post(`${API}/readings`, () => HttpResponse.json({ id: 42, ...READING, photoId: null }, { status: 201 })),
    http.post(`${API}/readings/:id/send`, () =>
      HttpResponse.json({ code: 'MAIL_FAILED', message: 'The mail service refused it' }, { status: 502 }),
    ),
  );

  const result = await submit({ intent: 'send', reading: READING });

  expect((result as Response).headers.get('Location')).toBe(BASE_ROUTES_PATHS.HOME);
});

it('sends nothing when the save fails', async () => {
  let isSendPosted = false;
  server.use(
    http.post(`${API}/readings`, () =>
      HttpResponse.json({ code: 'INTERNAL_ERROR', message: 'Something went wrong' }, { status: 500 }),
    ),
    http.post(`${API}/readings/:id/send`, () => {
      isSendPosted = true;
      return HttpResponse.json({});
    }),
  );

  const result = await submit({ intent: 'send', reading: READING });

  expect(result).toMatchObject({ success: false });
  expect(isSendPosted).toBe(false);
});
