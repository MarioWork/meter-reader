import { http, HttpResponse } from 'msw/http';
import { delay } from 'msw/utils/delay';
import type { BillContentType } from '@app-types/models';
import { MOCK_DELAY } from '@mocks/handlers';
import { BILL_NAME_HEADER } from '@services/billService/billService';
import { createBillNotSupportedMockModel, createBillTooLargeMockModel } from './models/billErrorMockModel.mock';
import { addMockBill } from './billMockState';

// The API's limits. It reads the type from the file's bytes; the mock trusts the type the browser gave it.
const BILL_CONTENT_TYPES: BillContentType[] = ['application/pdf', 'image/jpeg', 'image/png'];
const BILL_MAX_BYTES = 10_000_000;
const BAD_REQUEST = 400;
const CONTENT_TOO_LARGE = 413;
const CREATED = 201;
// The API's own name for a bill that came with none, before a reading gives it a day.
const UNNAMED_BILL_NAMES: Record<BillContentType, string> = {
  'application/pdf': 'bill.pdf',
  'image/jpeg': 'bill.jpg',
  'image/png': 'bill.png',
};

function isBillContentType(contentType: string): contentType is BillContentType {
  return BILL_CONTENT_TYPES.some((billContentType) => billContentType === contentType);
}

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
    const contentType = request.headers.get('content-type') ?? '';

    if (file.size > BILL_MAX_BYTES) {
      return HttpResponse.json(createBillTooLargeMockModel(), { status: CONTENT_TOO_LARGE });
    }

    if (!isBillContentType(contentType)) {
      return HttpResponse.json(createBillNotSupportedMockModel(), { status: BAD_REQUEST });
    }

    const name = sentNameOf(request) ?? UNNAMED_BILL_NAMES[contentType];

    return HttpResponse.json(addMockBill(file, contentType, name), { status: CREATED });
  }),
];
