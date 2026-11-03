import { http, HttpResponse } from 'msw/http';
import { delay } from 'msw/utils/delay';
import type { ReadingApiModel, ReadingBillApiModel } from '@app-types/models';
import type { UpdateReading } from '@services/readingService/readingService.type';
import { MOCK_DELAY } from '@mocks/handlers';
import { getMockBill } from '../bill/billMockState';
import { createBillNotAvailableMockModel, createReadingNotFoundMockModel } from './models/readingErrorMockModel.mock';
import { findMockReading, updateMockReading } from './readingMockState';

const NOT_FOUND = 404;
const CONFLICT = 409;

// The bill a `billId` names, as the reading carries it: null to remove it, undefined when no bill has that id.
function toReadingBill(billId: number | null): ReadingBillApiModel | null | undefined {
  if (billId === null) return null;

  const uploaded = getMockBill(billId);

  if (!uploaded) return undefined;

  const { id, name, contentType, sizeBytes } = uploaded.bill;

  return { id, name, contentType, sizeBytes };
}

// Like the API: sets, changes or removes (null) the reading's cost and its bill, and answers the reading as it is
// now. A bill left out stays as it is.
export default (baseUrl: string) => [
  http.patch(`${baseUrl}/readings/:id`, async ({ params, request }) => {
    await delay(MOCK_DELAY);

    const id = Number(params.id);
    const { costCents, billId } = (await request.json()) as UpdateReading;

    if (!findMockReading(id)) return HttpResponse.json(createReadingNotFoundMockModel(id), { status: NOT_FOUND });

    const changes: Partial<ReadingApiModel> = { costCents };

    if (billId !== undefined) {
      const bill = toReadingBill(billId);

      if (bill === undefined) return HttpResponse.json(createBillNotAvailableMockModel(), { status: CONFLICT });

      changes.bill = bill;
    }

    return HttpResponse.json(updateMockReading(id, changes));
  }),
];
