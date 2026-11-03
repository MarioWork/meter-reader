// The bills uploaded in the demo, kept so a reading updated with one can show it and open it.
import type { BillApiModel, BillContentType, BillId } from '@app-types/models';
import { createBillMockModel } from './models/billMockModel.mock';

type MockBill = { bill: BillApiModel; file: Blob };

const FIRST_UPLOADED_ID = 1;

let bills = new Map<BillId, MockBill>();

export function addMockBill(file: Blob, contentType: BillContentType, name: string): BillApiModel {
  const bill = createBillMockModel({ id: FIRST_UPLOADED_ID + bills.size, name, contentType, sizeBytes: file.size });

  bills = new Map(bills).set(bill.id, { bill, file });

  return bill;
}

export function getMockBill(id: BillId): MockBill | undefined {
  return bills.get(id);
}

// Between tests: no uploaded bills.
export function resetMockBills(): void {
  bills = new Map();
}
