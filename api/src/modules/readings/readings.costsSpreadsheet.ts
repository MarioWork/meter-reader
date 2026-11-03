// The Costs page's spreadsheet: the readings it lists, with the same day, digits and Cost columns as the readings
// spreadsheet, a link to each one's Bill, and the Costs added up at the bottom. How the table looks is
// src/lib/spreadsheet.ts.
import { toSpreadsheet, XLSX_EXTENSION, type SpreadsheetColumn } from '../../lib/spreadsheet.ts';
import { COST_COLUMN, DATE_COLUMN, DIGITS_COLUMN, dayRangeParts, type SheetDayRange } from './readings.spreadsheet.ts';

const SHEET_NAME = 'Costs';
const FILE_NAME_BASE = 'water-costs';
const FILE_NAME_SEPARATOR = '-';
const SUM_ROW_LABEL = 'Total';
const OPEN_BILL_TEXT = 'Open';
const BILL_WIDTH = 8;

// A reading as the Costs spreadsheet reads it: its day (midnight UTC), its digits, its Cost in euro cents, and where
// its Bill opens. Either of the last two may be missing, never both: the Costs page lists only readings with one.
export type CostSheetLine = { date: Date; digits: string; costCents: number | null; billUrl: string | null };

// "Open", linked to the Bill; empty when the reading has none.
const BILL_COLUMN: SpreadsheetColumn<CostSheetLine> = {
  title: 'Bill',
  width: BILL_WIDTH,
  valueOf: ({ billUrl }) => (billUrl === null ? null : OPEN_BILL_TEXT),
  linkOf: ({ billUrl }) => billUrl,
};

const COST_SHEET_COLUMNS: SpreadsheetColumn<CostSheetLine>[] = [
  DATE_COLUMN,
  DIGITS_COLUMN,
  { ...COST_COLUMN, isSummed: true },
  BILL_COLUMN,
];

export function toCostsSpreadsheet(lines: CostSheetLine[]): Promise<Buffer> {
  return toSpreadsheet({
    sheetName: SHEET_NAME,
    columns: COST_SHEET_COLUMNS,
    items: lines,
    sumRowLabel: SUM_ROW_LABEL,
  });
}

// water-costs.xlsx, or with the day range in it: water-costs-2026-01-01-to-2026-03-31.xlsx.
export function costsSpreadsheetFileName(range: SheetDayRange): string {
  const parts = [FILE_NAME_BASE, ...dayRangeParts(range)];

  return `${parts.join(FILE_NAME_SEPARATOR)}${XLSX_EXTENSION}`;
}
