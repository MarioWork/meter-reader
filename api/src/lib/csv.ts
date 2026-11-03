// A CSV file (RFC 4180) from rows and the columns to read off each. Domain-free: callers decide the columns.
const CSV_SEPARATOR = ',';
const CSV_LINE_BREAK = '\r\n';
const NEEDS_QUOTING = /[",\r\n]/;
// A cell a spreadsheet would run as a formula when the file is opened: =, +, -, @, or a leading tab or return.
const FORMULA_START = /^[=+\-@\t\r]/;
// The usual guard (OWASP's CSV injection advice): a leading apostrophe makes the cell text.
const FORMULA_ESCAPE = "'";

export type CsvCell = string | number | boolean | null;

// One column: its header, and how to read its cell off a row.
export type CsvColumn<Row> = { header: string; valueOf: (row: Row) => CsvCell };

// Quoted when it holds a separator, a quote or a line break, with the quotes inside doubled. Null is an empty cell.
// Text kept exactly as it is, so "00123" stays "00123", except text that would run as a formula, which is defused.
function toCsvCell(value: CsvCell): string {
  if (value === null) return '';

  const raw = String(value);
  const isFormula = typeof value === 'string' && FORMULA_START.test(raw);
  const text = isFormula ? `${FORMULA_ESCAPE}${raw}` : raw;

  if (!NEEDS_QUOTING.test(text)) return text;

  return `"${text.replaceAll('"', '""')}"`;
}

function toCsvLine(cells: CsvCell[]): string {
  return cells.map(toCsvCell).join(CSV_SEPARATOR);
}

// A header line, then one line per row, each ending in CRLF.
export function toCsv<Row>(rows: Row[], columns: CsvColumn<Row>[]): string {
  const header = toCsvLine(columns.map((column) => column.header));
  const lines = rows.map((row) => toCsvLine(columns.map((column) => column.valueOf(row))));

  return [header, ...lines].map((line) => `${line}${CSV_LINE_BREAK}`).join('');
}
