import { TEST_BASE_API_URL } from '@mocks/server';
import { describeBill, getBillUrl } from './billUtils';

describe('getBillUrl', () => {
  it("points at the bill on the API's base URL", () => {
    expect(getBillUrl(7)).toBe(`${TEST_BASE_API_URL}/bills/7`);
  });
});

describe('describeBill', () => {
  it.each([
    [{ id: 1, name: 'bill.pdf', contentType: 'application/pdf' as const, sizeBytes: 184_320 }, 'PDF, 184.3 KB'],
    [{ id: 1, name: 'bill.pdf', contentType: 'image/jpeg' as const, sizeBytes: 2_400_000 }, 'JPEG, 2.4 MB'],
    [{ id: 1, name: 'bill.pdf', contentType: 'image/png' as const, sizeBytes: 900 }, 'PNG, 0.9 KB'],
  ])('says what %o is in a few words', (bill, description) => {
    expect(describeBill(bill)).toBe(description);
  });
});
