import type { ReadingApiModel } from '@app-types/models';

const ADD_COST_AND_BILL_LABEL = 'Add cost & bill';
const EDIT_COST_AND_BILL_LABEL = 'Edit cost & bill';

// The "⋯" menu item and the title of the dialog it opens: "Add" until the reading has a cost or a bill.
export function getCostAndBillLabel(reading: ReadingApiModel): string {
  const hasCost = reading.costCents !== null;
  const hasBill = reading.bill !== null;
  const hasCostOrBill = hasCost || hasBill;

  if (hasCostOrBill) return EDIT_COST_AND_BILL_LABEL;

  return ADD_COST_AND_BILL_LABEL;
}
