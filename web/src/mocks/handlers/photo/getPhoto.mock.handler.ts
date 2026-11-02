import { http, HttpResponse } from 'msw/http';
import { delay } from 'msw/utils/delay';
import { MOCK_DELAY } from '@mocks/handlers';
import { READING_MOCK_COUNT } from '../reading/models/readingMockModel.mock';
import { createPhotoMockImage } from './models/photoMockModel.mock';
import { getMockPhoto } from './photoMockState';

const NOT_FOUND = { code: 'NOT_FOUND', message: 'Photo not found' };

// A photo uploaded in the demo comes back as sent; a mock history photo is a drawn stand-in.
export default (baseUrl: string) => [
  http.get(`${baseUrl}/photos/:id`, async ({ params }) => {
    await delay(MOCK_DELAY);

    const photoId = Number(params.id);
    const uploaded = getMockPhoto(photoId);
    const isHistoryPhoto = photoId >= 1 && photoId <= READING_MOCK_COUNT;

    if (uploaded) return new HttpResponse(uploaded, { headers: { 'Content-Type': uploaded.type } });

    if (isHistoryPhoto)
      return HttpResponse.xml(createPhotoMockImage(photoId), { headers: { 'Content-Type': 'image/svg+xml' } });

    return HttpResponse.json(NOT_FOUND, { status: 404 });
  }),
];
