import type { ReadingApiModel } from '@app-types/models';

const ADD_COST_AND_BILL_LABEL = 'Add cost & bill';
const EDIT_COST_AND_BILL_LABEL = 'Edit cost & bill';

// Whether the reading has either yet: a cost, a bill, or both.
export function hasCostOrBill(reading: ReadingApiModel): boolean {
  const hasCost = reading.costCents !== null;
  const hasBill = reading.bill !== null;

  return hasCost || hasBill;
}

// The "⋯" menu item and the title of the dialog it opens: "Add" until the reading has a cost or a bill.
export function getCostAndBillLabel(reading: ReadingApiModel): string {
  if (hasCostOrBill(reading)) return EDIT_COST_AND_BILL_LABEL;

  return ADD_COST_AND_BILL_LABEL;
}
