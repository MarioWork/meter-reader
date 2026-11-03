// An .xlsx table of anything: a coloured header frozen at the top with filter arrows, typed cells (text stays text,
// numbers stay numbers, days are dates), cells that link to a web address, every other row striped, and a sum row at
// the bottom when the table asks for one. A module says what its columns are; this file says how every table looks.
import writeExcelFile, { type Cell, type Row } from 'write-excel-file/node';
import { getCellAddress } from 'write-excel-file/utility';
import { filterArrows } from './spreadsheetFilter.ts';
import { formulaResults, type FormulaResult } from './spreadsheetFormulaResults.ts';
import { cellLinks, type CellLink } from './spreadsheetLinks.ts';

export const XLSX_CONTENT_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
export const XLSX_EXTENSION = '.xlsx';

const HEADER_ROWS = 1;
const FIRST_DATA_ROW = HEADER_ROWS + 1;
const FIRST_COLUMN = 1;

// The app's light theme (web/src/index.css): its primary blue for the header, its muted aqua for the stripes.
const HEADER_STYLE = { fontWeight: 'bold', textColor: '#FFFFFF', backgroundColor: '#006BA4' } as const;
const STRIPE_STYLE = { backgroundColor: '#F0F9FC' } as const;
// A link looks like one: the same primary blue, underlined.
const LINK_STYLE = { textColor: '#006BA4', textDecoration: { underline: true } } as const;
// The sum row stands apart from the data.
const SUM_ROW_STYLE = { fontWeight: 'bold' } as const;
// A sum of decimals in floating point carries noise far past the cents (0.1 + 0.2 is 0.30000000000000004): the
// result kept beside a SUM is rounded to this many decimals, which no money or meter value comes near.
const SUM_RESULT_DECIMALS = 9;
const DECIMAL_BASE = 10;
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
// date format when it has one ("yyyy-mm-dd", "#,##0.00"). `linkOf` makes a cell a link to an absolute url, shown as
// the cell's value; null leaves that cell plain. `isSummed` adds the column's numbers up in the sum row.
export type SpreadsheetColumn<Item> = {
  title: string;
  width: number;
  valueOf: (item: Item) => SpreadsheetValue;
  format?: string;
  linkOf?: (item: Item) => string | null;
  isSummed?: boolean;
};

// `sumRowLabel` asks for a sum row below the data: the label in the first column, and under each summed column a
// SUM of the cells above it. The filter arrows and the stripes leave it out, so sorting never moves it.
export type SpreadsheetTable<Item> = {
  sheetName: string;
  columns: SpreadsheetColumn<Item>[];
  items: Item[];
  sumRowLabel?: string;
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

// The url a data cell links to, or null: a column with no links, or a cell with nothing to click.
function linkOf<Item>(item: Item, column: SpreadsheetColumn<Item>): string | null {
  if (!column.linkOf || column.valueOf(item) === null) return null;

  return column.linkOf(item);
}

function formatStyleOf<Item>({ format }: SpreadsheetColumn<Item>): { format?: string } {
  return format ? { format } : {};
}

function toCell<Item>(item: Item, column: SpreadsheetColumn<Item>): Cell {
  const value = column.valueOf(item);

  if (value === null) return null;

  const linkStyle = linkOf(item, column) === null ? {} : LINK_STYLE;

  return { value, ...formatStyleOf(column), ...linkStyle };
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

// One data row's linked cells. getCellAddress counts rows and columns from 0, the header being row 0.
function rowLinksOf<Item>(item: Item, itemIndex: number, columns: SpreadsheetColumn<Item>[]): CellLink[] {
  return columns.flatMap((column, columnIndex) => {
    const url = linkOf(item, column);

    if (url === null) return [];

    return [{ address: getCellAddress(itemIndex + HEADER_ROWS, columnIndex), url }];
  });
}

// Every linked cell of the data rows.
function linksOf<Item>(items: Item[], columns: SpreadsheetColumn<Item>[]): CellLink[] {
  return items.flatMap((item, itemIndex) => rowLinksOf(item, itemIndex, columns));
}

// A summed column's numbers added up, without the floating-point noise; any other value in it (an empty cell) adds
// nothing.
function sumOf<Item>(items: Item[], column: SpreadsheetColumn<Item>): number {
  const total = items.reduce((sum, item) => {
    const value = column.valueOf(item);

    return typeof value === 'number' ? sum + value : sum;
  }, 0);
  const scale = DECIMAL_BASE ** SUM_RESULT_DECIMALS;

  return Math.round(total * scale) / scale;
}

// "SUM(C2:C4)": the column's data cells, from the first row under the header to the last row of data.
function sumFormula(itemCount: number, columnIndex: number): string {
  const lastDataRowIndex = HEADER_ROWS + itemCount - 1;
  const firstCell = getCellAddress(HEADER_ROWS, columnIndex);
  const lastCell = getCellAddress(lastDataRowIndex, columnIndex);

  return `SUM(${firstCell}:${lastCell})`;
}

// Under a summed column, its SUM. With no data rows there is nothing to add up: a plain 0, not a formula that would
// point at its own cell.
function toSumCell<Item>(items: Item[], column: SpreadsheetColumn<Item>, columnIndex: number): Cell {
  if (!column.isSummed) return null;

  const formatStyle = formatStyleOf(column);

  if (items.length === 0) return { value: 0, ...formatStyle, ...SUM_ROW_STYLE };

  return { type: 'Formula', value: sumFormula(items.length, columnIndex), ...formatStyle, ...SUM_ROW_STYLE };
}

// The label in the first column, then a sum under each summed column.
function toSumRow<Item>(label: string, items: Item[], columns: SpreadsheetColumn<Item>[]): Row {
  const sums = columns.slice(FIRST_COLUMN).map((column, index) => toSumCell(items, column, index + FIRST_COLUMN));

  return [{ value: label, ...SUM_ROW_STYLE }, ...sums];
}

// Each SUM's result, kept beside its formula. None for an empty table: its sums are plain zeros.
function sumResultsOf<Item>(items: Item[], columns: SpreadsheetColumn<Item>[]): FormulaResult[] {
  if (items.length === 0) return [];

  const sumRowIndex = items.length + HEADER_ROWS;

  return columns.flatMap((column, columnIndex) => {
    if (!column.isSummed) return [];

    return [{ address: getCellAddress(sumRowIndex, columnIndex), value: sumOf(items, column) }];
  });
}

// One sheet, the table: the header, a row per item in the order given, then the sum row when it asks for one.
export async function toSpreadsheet<Item>(table: SpreadsheetTable<Item>): Promise<Buffer> {
  const { sheetName, columns, items, sumRowLabel } = table;
  const hasSumRow = sumRowLabel !== undefined;

  const dataRows = items.map((item) => columns.map((column) => toCell(item, column)));
  const sumRows = hasSumRow ? [toSumRow(sumRowLabel, items, columns)] : [];
  const sheet = {
    sheet: sheetName,
    data: [toHeaderRow(columns), ...dataRows, ...sumRows],
    columns: columns.map((column) => ({ width: column.width })),
    stickyRowsCount: HEADER_ROWS,
    conditionalFormatting: [stripeRule(items.length, columns.length)],
  };

  const filter = { sheetName, rowCount: items.length + HEADER_ROWS, columnCount: columns.length };
  const sumResults = hasSumRow ? sumResultsOf(items, columns) : [];
  const features = [filterArrows([filter]), cellLinks([linksOf(items, columns)]), formulaResults([sumResults])];

  return writeExcelFile([sheet], { features }).toBuffer();
}
