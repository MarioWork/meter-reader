import { http, HttpResponse } from 'msw/http';
import { delay } from 'msw/utils/delay';
import { MOCK_DELAY } from '@mocks/handlers';
import { getMockBill } from './billMockState';

const NOT_FOUND = { code: 'NOT_FOUND', message: 'Bill not found' };
const NOT_FOUND_STATUS = 404;
// Opened, not saved, under its name (RFC 8187: UTF-8, percent-encoded).
const INLINE_NAMED = "inline; filename*=UTF-8''";

// A bill uploaded in the demo comes back as it was sent, for the app's viewer to show under its name.
export default (baseUrl: string) => [
  http.get(`${baseUrl}/bills/:id`, async ({ params }) => {
    await delay(MOCK_DELAY);

    const uploaded = getMockBill(Number(params.id));

    if (!uploaded) return HttpResponse.json(NOT_FOUND, { status: NOT_FOUND_STATUS });

    return new HttpResponse(uploaded.file, {
      headers: {
        'Content-Type': uploaded.bill.contentType,
        'Content-Disposition': `${INLINE_NAMED}${encodeURIComponent(uploaded.bill.name)}`,
      },
    });
  }),
];
