import { http, HttpResponse } from 'msw/http';
import { delay } from 'msw/utils/delay';
import { MOCK_DELAY } from '@mocks/handlers';
import { BILL_NAME_HEADER } from '@services/billService/billService';
import { createBillNotSupportedMockModel, createBillTooLargeMockModel } from './models/billErrorMockModel.mock';
import { addMockBill } from './billMockState';

// The API's limits: a PDF of at most 10 MB. It reads the type from the file's bytes; the mock trusts the type the
// browser gave it.
const PDF_CONTENT_TYPE = 'application/pdf';
const BILL_MAX_BYTES = 10_000_000;
const BAD_REQUEST = 400;
const CONTENT_TOO_LARGE = 413;
const CREATED = 201;
// The API's own name for a bill that came with none, before a reading gives it a day.
const UNNAMED_BILL_NAME = 'bill.pdf';

// The name the app sent, percent-encoded; the API also cleans it, which the demo does not need.
function sentNameOf(request: Request): string | null {
  const sentName = request.headers.get(BILL_NAME_HEADER);

  if (!sentName) return null;

  try {
    return decodeURIComponent(sentName);
  } catch {
    return null;
  }
}

export default (baseUrl: string) => [
  http.post(`${baseUrl}/bills`, async ({ request }) => {
    await delay(MOCK_DELAY);

    const file = await request.blob();
    const isPdf = request.headers.get('content-type') === PDF_CONTENT_TYPE;

    if (file.size > BILL_MAX_BYTES) {
      return HttpResponse.json(createBillTooLargeMockModel(), { status: CONTENT_TOO_LARGE });
    }

    if (!isPdf) {
      return HttpResponse.json(createBillNotSupportedMockModel(), { status: BAD_REQUEST });
    }

    const name = sentNameOf(request) ?? UNNAMED_BILL_NAME;

    return HttpResponse.json(addMockBill(file, PDF_CONTENT_TYPE, name), { status: CREATED });
  }),
];
