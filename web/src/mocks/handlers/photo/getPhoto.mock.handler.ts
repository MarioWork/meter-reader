import { http, HttpResponse } from 'msw/http';
import { delay } from 'msw/utils/delay';
import { MOCK_DELAY } from '@mocks/handlers';
import { READING_MOCK_COUNT } from '../reading/models/readingMockModel.mock';
import { createPhotoMockImage } from './models/photoMockModel.mock';
import { getMockPhoto } from './photoMockState';

const SVG_CONTENT_TYPE = 'image/svg+xml';
const FIRST_HISTORY_PHOTO_ID = 1;
const NOT_FOUND = { code: 'NOT_FOUND', message: 'Photo not found' };

// A photo uploaded in the demo comes back as sent; a mock history photo is a drawn stand-in.
export default (baseUrl: string) => [
  http.get(`${baseUrl}/photos/:id`, async ({ params }) => {
    await delay(MOCK_DELAY);

    const photoId = Number(params.id);
    const uploaded = getMockPhoto(photoId);
    const isHistoryPhoto = photoId >= FIRST_HISTORY_PHOTO_ID && photoId <= READING_MOCK_COUNT;

    if (uploaded) return new HttpResponse(uploaded, { headers: { 'Content-Type': uploaded.type } });

    if (isHistoryPhoto)
      return HttpResponse.xml(createPhotoMockImage(photoId), { headers: { 'Content-Type': SVG_CONTENT_TYPE } });

    return HttpResponse.json(NOT_FOUND, { status: 404 });
  }),
];
