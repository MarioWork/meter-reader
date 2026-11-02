import { http, HttpResponse } from 'msw/http';
import { server, TEST_BASE_API_URL } from '@mocks/server';
import photoService from './photoService';

const API = TEST_BASE_API_URL;
const PHOTO = new File([new Uint8Array([0xff, 0xd8, 0xff, 0xd9])], 'meter.jpg', { type: 'image/jpeg' });

describe('addPhoto', () => {
  it('posts the JPEG bytes as the body and returns a success envelope', async () => {
    let receivedType: string | null = null;
    let receivedBytes = new Uint8Array();
    server.use(
      http.post(`${API}/photos`, async ({ request }) => {
        receivedType = request.headers.get('content-type');
        receivedBytes = new Uint8Array(await request.arrayBuffer());
        return HttpResponse.json({ id: 7, createdAt: '2026-11-02T09:00:00.000Z' }, { status: 201 });
      }),
    );

    const response = await photoService.addPhoto(PHOTO);

    expect(receivedType).toBe('image/jpeg');
    expect([...receivedBytes]).toEqual([0xff, 0xd8, 0xff, 0xd9]);
    expect(response).toEqual({ success: true, data: { id: 7, createdAt: '2026-11-02T09:00:00.000Z' } });
  });

  it('returns a failure envelope instead of throwing', async () => {
    server.use(
      http.post(`${API}/photos`, () =>
        HttpResponse.json({ code: 'PHOTO_TOO_LARGE', message: 'The photo is too large' }, { status: 400 }),
      ),
    );

    const response = await photoService.addPhoto(PHOTO);

    expect(response).toEqual({
      success: false,
      error: { statusCode: 400, code: 'PHOTO_TOO_LARGE', message: 'The photo is too large' },
    });
  });
});
