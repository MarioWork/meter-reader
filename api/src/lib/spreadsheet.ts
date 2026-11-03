// An .xlsx table of anything: a coloured header frozen at the top with filter arrows, typed cells (text stays text,
// numbers stay numbers, days are dates), and every other row striped. A module says what its columns are; this
// file says how every table looks.
import writeExcelFile, { type Cell, type Row } from 'write-excel-file/node';
import { filterArrows } from './spreadsheetFilter.ts';

export const XLSX_CONTENT_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
export const XLSX_EXTENSION = '.xlsx';

const HEADER_ROWS = 1;
const FIRST_DATA_ROW = HEADER_ROWS + 1;
const FIRST_COLUMN = 1;

// The app's light theme (web/src/index.css): its primary blue for the header, its muted aqua for the stripes.
const HEADER_STYLE = { fontWeight: 'bold', textColor: '#FFFFFF', backgroundColor: '#006BA4' } as const;
const STRIPE_STYLE = { backgroundColor: '#F0F9FC' } as const;
// Every other data row; row numbers are the sheet's own (the header is row 1). Formulas are written without the
// leading "=": the .xlsx format stores them that way, and Excel asks to repair a file whose formulas start with one.
const STRIPE_FORMULA = 'MOD(ROW(),2)=0';
// The parts of a clock's reading, for toSpreadsheetTime. Months count from 1 there and from 0 in Date.UTC.
const MONTH_OFFSET = 1;
const WALL_CLOCK_OPTIONS: Intl.DateTimeFormatOptions = {
  hourCycle: 'h23',
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
  hour: 'numeric',
  minute: 'numeric',
  second: 'numeric',
};

// What one cell holds. A string is always text, never a number or a formula: "00123" keeps its zeros.
export type SpreadsheetValue = string | number | Date | null;

// One column: its header, its width (in characters), how to read its cell off an item, and the cell's number or
// date format when it has one ("yyyy-mm-dd", "#,##0.00").
export type SpreadsheetColumn<Item> = {
  title: string;
  width: number;
  valueOf: (item: Item) => SpreadsheetValue;
  format?: string;
};

export type SpreadsheetTable<Item> = {
  sheetName: string;
  columns: SpreadsheetColumn<Item>[];
  items: Item[];
};

type WallClockPart = 'year' | 'month' | 'day' | 'hour' | 'minute' | 'second';

// The moment as a clock in `timeZone` showed it, stored as that same time in UTC: a spreadsheet's date has no time
// zone, and write-excel-file writes a Date's UTC time.
export function toSpreadsheetTime(moment: Date, timeZone: string): Date {
  const parts = new Intl.DateTimeFormat('en-GB', { ...WALL_CLOCK_OPTIONS, timeZone }).formatToParts(moment);
  const partOf = (type: WallClockPart) => Number(parts.find((part) => part.type === type)?.value);

  const month = partOf('month') - MONTH_OFFSET;

  return new Date(Date.UTC(partOf('year'), month, partOf('day'), partOf('hour'), partOf('minute'), partOf('second')));
}

function toCell<Item>(item: Item, { valueOf, format }: SpreadsheetColumn<Item>): Cell {
  const value = valueOf(item);

  if (value === null) return null;

  if (!format) return value;

  return { value, format };
}

function toHeaderRow<Item>(columns: SpreadsheetColumn<Item>[]): Row {
  return columns.map((column) => ({ value: column.title, ...HEADER_STYLE }));
}

// The stripes cover the data rows only, and at least one row, so an empty table still has a valid rule.
function stripeRule(rowCount: number, columnCount: number) {
  const lastRow = Math.max(rowCount + HEADER_ROWS, FIRST_DATA_ROW);
  const cellRange = { from: { row: FIRST_DATA_ROW, column: FIRST_COLUMN }, to: { row: lastRow, column: columnCount } };

  return { cellRange, condition: { formula: STRIPE_FORMULA }, style: STRIPE_STYLE };
}

// One sheet, the table: the header, then a row per item in the order given.
export async function toSpreadsheet<Item>({ sheetName, columns, items }: SpreadsheetTable<Item>): Promise<Buffer> {
  const rows = items.map((item) => columns.map((column) => toCell(item, column)));
  const sheet = {
    sheet: sheetName,
    data: [toHeaderRow(columns), ...rows],
    columns: columns.map((column) => ({ width: column.width })),
    stickyRowsCount: HEADER_ROWS,
    conditionalFormatting: [stripeRule(rows.length, columns.length)],
  };
  const filter = { sheetName, rowCount: rows.length + HEADER_ROWS, columnCount: columns.length };

  return writeExcelFile([sheet], { features: [filterArrows([filter])] }).toBuffer();
}
