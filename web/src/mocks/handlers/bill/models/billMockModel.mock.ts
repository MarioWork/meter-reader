import type { BillApiModel } from '@app-types/models';

// Fixed, so the mocks stay deterministic.
const MOCK_UPLOADED_AT = '2026-11-03T09:00:00.000Z';
// A one-page scanned bill, under the name it had on the phone.
const MOCK_BILL_BYTES = 184_320;
const MOCK_BILL_NAME = 'water-bill-october-2026.pdf';

export const createBillMockModel = (overrides?: Partial<BillApiModel>): BillApiModel => ({
  id: 1,
  name: MOCK_BILL_NAME,
  contentType: 'application/pdf',
  sizeBytes: MOCK_BILL_BYTES,
  createdAt: MOCK_UPLOADED_AT,
  ...overrides,
});
