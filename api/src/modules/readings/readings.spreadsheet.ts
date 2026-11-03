// The readings spreadsheet: which columns it has, how each reads off a reading, and what the file is called. How
// the table looks is src/lib/spreadsheet.ts, shared with every other spreadsheet.
import { toSpreadsheet, toSpreadsheetTime, XLSX_EXTENSION, type SpreadsheetColumn } from '../../lib/spreadsheet.ts';
import type { ExportReadingsQuery, ReadingStatus } from './readings.schema.ts';

const SHEET_NAME = 'Readings';
const FILE_NAME_BASE = 'water-readings';
const FILE_NAME_SEPARATOR = '-';
const DATE_FORMAT = 'yyyy-mm-dd';
const DATE_TIME_FORMAT = 'yyyy-mm-dd hh:mm';
// Euros with 2 decimals, as the app shows a Cost: €42.10.
const EURO_FORMAT = '"€"#,##0.00';
const CENTS_PER_EURO = 100;
// Column widths, in characters: wide enough for a day, a meter's digits, the longest status, a day and time, a Cost.
const DAY_WIDTH = 12;
const DIGITS_WIDTH = 12;
const STATUS_WIDTH = 10;
const DATE_TIME_WIDTH = 17;
const COST_WIDTH = 12;

// A reading as the spreadsheet reads it: its day (midnight UTC), its digits, its status, when it was sent, and its Cost
// in euro cents.
export type ReadingSheetLine = {
  date: Date;
  digits: string;
  status: ReadingStatus;
  sentAt: Date | null;
  costCents: number | null;
};

// What the file name says the filters were. Days are the YYYY-MM-DD the user picked.
type ReadingSheetFilters = Pick<ExportReadingsQuery, 'from' | 'to' | 'status'>;

// The day range alone, for any spreadsheet narrowed to one.
export type SheetDayRange = Pick<ExportReadingsQuery, 'from' | 'to'>;

// The glossary's words (docs/GLOSSARY.md), as Home shows them.
const STATUS_LABELS: Record<ReadingStatus, string> = {
  notSent: 'Not sent',
  sent: 'Sent',
  failed: 'Failed',
};

// The same words, in a file name.
const STATUS_FILE_NAME_PARTS: Record<ReadingStatus, string> = {
  notSent: 'not-sent',
  sent: 'sent',
  failed: 'failed',
};

// A reading's day and digits, the columns every readings spreadsheet starts with.
export const DATE_COLUMN: SpreadsheetColumn<{ date: Date }> = {
  title: 'Date',
  width: DAY_WIDTH,
  valueOf: (line) => line.date,
  format: DATE_FORMAT,
};

// Text, never a number, so "00123" keeps its leading zeros.
export const DIGITS_COLUMN: SpreadsheetColumn<{ digits: string }> = {
  title: 'Digits',
  width: DIGITS_WIDTH,
  valueOf: (line) => line.digits,
};

// A number in euros, so it adds up; empty when the reading has no Cost.
export const COST_COLUMN: SpreadsheetColumn<{ costCents: number | null }> = {
  title: 'Cost',
  width: COST_WIDTH,
  valueOf: ({ costCents }) => (costCents === null ? null : costCents / CENTS_PER_EURO),
  format: EURO_FORMAT,
};

// Sent at reads as the user's own clock showed it, in `timeZone`.
function readingColumns(timeZone: string): SpreadsheetColumn<ReadingSheetLine>[] {
  const sentAtOf = ({ sentAt }: ReadingSheetLine) => (sentAt ? toSpreadsheetTime(sentAt, timeZone) : null);

  return [
    DATE_COLUMN,
    DIGITS_COLUMN,
    { title: 'Status', width: STATUS_WIDTH, valueOf: (line) => STATUS_LABELS[line.status] },
    { title: 'Sent at', width: DATE_TIME_WIDTH, valueOf: sentAtOf, format: DATE_TIME_FORMAT },
    COST_COLUMN,
  ];
}

export function toReadingsSpreadsheet(lines: ReadingSheetLine[], timeZone: string): Promise<Buffer> {
  return toSpreadsheet({ sheetName: SHEET_NAME, columns: readingColumns(timeZone), items: lines });
}

// The day range in a file name: [] for none, ['from', day], ['until', day] or [from, 'to', to].
export function dayRangeParts({ from, to }: SheetDayRange): string[] {
  if (from && to) return [from, 'to', to];

  if (from) return ['from', from];

  if (to) return ['until', to];

  return [];
}

// water-readings.xlsx, or with the filters in it: water-readings-2026-01-01-to-2026-03-31-not-sent.xlsx.
export function readingsSpreadsheetFileName(filters: ReadingSheetFilters): string {
  const statusParts = (filters.status ?? []).map((status) => STATUS_FILE_NAME_PARTS[status]);
  const parts = [FILE_NAME_BASE, ...dayRangeParts(filters), ...statusParts];

  return `${parts.join(FILE_NAME_SEPARATOR)}${XLSX_EXTENSION}`;
}
