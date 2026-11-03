// The cells both mock spreadsheets share with the API's: a reading's day as a date, its Cost as a number in euros.
import type { ReadingApiModel } from '@app-types/models';
import { CENTS_PER_EURO } from '@utils/costUtils';

export const XLSX_CONTENT_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
export const XLSX_EXTENSION = '.xlsx';

const DATE_FORMAT = 'yyyy-mm-dd';
// Euros with 2 decimals, as the API writes a Cost: €42.10.
export const EURO_FORMAT = '"€"#,##0.00';
// A day as the API sends it is a calendar day; as a spreadsheet date, it is midnight UTC of that day.
const MIDNIGHT_UTC = 'T00:00:00.000Z';

export function toMockDayCell({ date }: ReadingApiModel) {
  return { value: new Date(`${date}${MIDNIGHT_UTC}`), format: DATE_FORMAT };
}

// Empty when the reading has no Cost.
export function toMockCostCell({ costCents }: ReadingApiModel) {
  if (costCents === null) return null;

  return { value: costCents / CENTS_PER_EURO, format: EURO_FORMAT };
}
