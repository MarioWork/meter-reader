import { http, HttpResponse } from 'msw/http';
import { delay } from 'msw/utils/delay';
import type { BillContentType } from '@app-types/models';
import { MOCK_DELAY } from '@mocks/handlers';
import { createBillNotSupportedMockModel, createBillTooLargeMockModel } from './models/billErrorMockModel.mock';
import { addMockBill } from './billMockState';

// The API's limits. It reads the type from the file's bytes; the mock trusts the type the browser gave it.
const BILL_CONTENT_TYPES: BillContentType[] = ['application/pdf', 'image/jpeg', 'image/png'];
const BILL_MAX_BYTES = 10_000_000;
const BAD_REQUEST = 400;
const CONTENT_TOO_LARGE = 413;
const CREATED = 201;

function isBillContentType(contentType: string): contentType is BillContentType {
  return BILL_CONTENT_TYPES.some((billContentType) => billContentType === contentType);
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

    return HttpResponse.json(addMockBill(file, contentType), { status: CREATED });
  }),
];
