import { http, HttpResponse } from 'msw/http';
import { READING_ROUTES_PATHS } from '@application/routes/routesUtils';
import { server, TEST_BASE_API_URL } from '@mocks/server';
import { createFormData } from '@utils/formDataUtils';
import { sendReadingAction } from './sendReadingModalActions';
import { ADD_PHOTO_INTENT, PHOTO_FIELD, SEND_INTENT_FIELD } from './sendReadingModalUtils';

const API = TEST_BASE_API_URL;
const READING_ID = '10';
const SHRUNK_PHOTO = new File([new Uint8Array([0xff, 0xd8, 0xff, 0xd9])], 'meter.jpg', { type: 'image/jpeg' });
// The route the action answers on: the reading's page with the preview over it.
const SEND_PATTERN = READING_ROUTES_PATHS.detailsSend();
const UPLOADED_PHOTO = { id: 1000, createdAt: '2026-11-02T09:00:00.000Z' };

function addPhoto(photo: File) {
  const body = createFormData({ [SEND_INTENT_FIELD]: ADD_PHOTO_INTENT, [PHOTO_FIELD]: photo });
  const request = new Request(`http://localhost/readings/${READING_ID}/send`, { method: 'POST', body });

  const args = {
    request,
    params: { readingId: READING_ID },
    context: {},
    url: new URL(request.url),
    pattern: SEND_PATTERN,
  };

  return sendReadingAction(args as unknown as Parameters<typeof sendReadingAction>[0]);
}

describe('adding a photo', () => {
  it('uploads the photo, then links it to the reading, when the reading was saved without one', async () => {
    let uploadedBytes = new Uint8Array();
    let linked: unknown;
    server.use(
      http.post(`${API}/photos`, async ({ request }) => {
        uploadedBytes = new Uint8Array(await request.arrayBuffer());
        return HttpResponse.json(UPLOADED_PHOTO, { status: 201 });
      }),
      http.patch(`${API}/readings/${READING_ID}`, async ({ request }) => {
        linked = await request.json();
        return HttpResponse.json({ id: Number(READING_ID), photoId: UPLOADED_PHOTO.id });
      }),
    );

    const result = await addPhoto(SHRUNK_PHOTO);

    expect([...uploadedBytes]).toEqual([0xff, 0xd8, 0xff, 0xd9]);
    expect(linked).toEqual({ photoId: UPLOADED_PHOTO.id });
    expect(result).toMatchObject({ success: true });
  });

  it("returns the link's failure when the reading already has a photo", async () => {
    server.use(
      http.post(`${API}/photos`, () => HttpResponse.json(UPLOADED_PHOTO, { status: 201 })),
      http.patch(`${API}/readings/${READING_ID}`, () =>
        HttpResponse.json(
          { code: 'PHOTO_NOT_AVAILABLE', message: 'This reading already has a photo' },
          { status: 409 },
        ),
      ),
    );

    const result = await addPhoto(SHRUNK_PHOTO);

    expect(result).toMatchObject({ success: false, error: { statusCode: 409, code: 'PHOTO_NOT_AVAILABLE' } });
  });

  it('uploads nothing and fails when the picked file is not a JPEG', async () => {
    let isUploaded = false;
    server.use(
      http.post(`${API}/photos`, () => {
        isUploaded = true;
        return HttpResponse.json(UPLOADED_PHOTO, { status: 201 });
      }),
    );

    const result = await addPhoto(new File(['not a photo'], 'notes.txt', { type: 'text/plain' }));

    expect(result).toEqual({ success: false });
    expect(isUploaded).toBe(false);
  });
});
