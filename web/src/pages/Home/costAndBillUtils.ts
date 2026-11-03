import type { ReadingApiModel } from '@app-types/models';

const ADD_COST_AND_BILL_LABEL = 'Add cost & bill';
const EDIT_COST_AND_BILL_LABEL = 'Edit cost & bill';

// The "⋯" menu item and the title of the dialog it opens: "Add" until the reading has a cost (or, later, a bill).
export function getCostAndBillLabel(reading: ReadingApiModel): string {
  const hasCostOrBill = reading.costCents !== null;

  if (hasCostOrBill) return EDIT_COST_AND_BILL_LABEL;

  return ADD_COST_AND_BILL_LABEL;
}
