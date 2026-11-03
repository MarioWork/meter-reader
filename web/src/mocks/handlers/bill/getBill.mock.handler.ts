import { http, HttpResponse } from 'msw/http';
import { delay } from 'msw/utils/delay';
import { MOCK_DELAY } from '@mocks/handlers';
import { getMockBill } from './billMockState';

const NOT_FOUND = { code: 'NOT_FOUND', message: 'Bill not found' };
const NOT_FOUND_STATUS = 404;
const DOWNLOAD_PARAM = 'download';
const DOWNLOAD_NAME = 'bill';
const IS_DOWNLOAD_VALUE = 'true';
const INLINE = 'inline';
const ATTACHMENT = 'attachment';

// A bill uploaded in the demo comes back as it was sent: to open, or to save with ?download=true.
export default (baseUrl: string) => [
  http.get(`${baseUrl}/bills/:id`, async ({ params, request }) => {
    await delay(MOCK_DELAY);

    const uploaded = getMockBill(Number(params.id));

    if (!uploaded) return HttpResponse.json(NOT_FOUND, { status: NOT_FOUND_STATUS });

    const isDownload = new URL(request.url).searchParams.get(DOWNLOAD_PARAM) === IS_DOWNLOAD_VALUE;
    const disposition = isDownload ? ATTACHMENT : INLINE;

    return new HttpResponse(uploaded.file, {
      headers: {
        'Content-Type': uploaded.bill.contentType,
        'Content-Disposition': `${disposition}; filename="${DOWNLOAD_NAME}"`,
      },
    });
  }),
];
