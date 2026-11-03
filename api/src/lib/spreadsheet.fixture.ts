// What read-excel-file does not read back from an .xlsx: where its links go, what its formulas are, how a number is
// shown. Read straight from the file's XML, for the first sheet.
import { strFromU8, unzipSync } from 'fflate';

const SHEET_FILE = 'xl/worksheets/sheet1.xml';
const SHEET_RELATIONSHIPS_FILE = 'xl/worksheets/_rels/sheet1.xml.rels';
const STYLES_FILE = 'xl/styles.xml';
const HYPERLINK = /<hyperlink ref="([A-Z]+\d+)" r:id="([^"]+)"\/>/g;
const FORMULA_CELL = /<c r="([A-Z]+\d+)"[^>]*><f>([^<]*)<\/f>/g;
const CELL_STYLES = /<cellXfs[^>]*>(.*?)<\/cellXfs>/;
const CELL_STYLE = /<xf[^>]*>/g;
const NUMBER_FORMAT_ID = /numFmtId="(\d+)"/;

type CellEntry = [address: string, text: string | undefined];

function readFile(xlsx: Buffer, path: string): string {
  const file = unzipSync(new Uint8Array(xlsx))[path];

  return file ? strFromU8(file) : '';
}

function relationshipTarget(relationshipsXml: string, id: string): string | undefined {
  return new RegExp(`<Relationship Id="${id}"[^>]* Target="([^"]+)"`).exec(relationshipsXml)?.[1];
}

// Each linked cell's address, and the url it opens: { D2: 'https://…/bills/7' }.
export function sheetLinks(xlsx: Buffer): Record<string, string | undefined> {
  const relationshipsXml = readFile(xlsx, SHEET_RELATIONSHIPS_FILE);
  const links = [...readFile(xlsx, SHEET_FILE).matchAll(HYPERLINK)];

  const entries = links.map(([, address = '', id = '']): CellEntry => [
    address,
    relationshipTarget(relationshipsXml, id),
  ]);

  return Object.fromEntries(entries);
}

// Each formula cell's address, and its formula: { C5: 'SUM(C2:C4)' }.
export function sheetFormulas(xlsx: Buffer): Record<string, string | undefined> {
  const formulas = [...readFile(xlsx, SHEET_FILE).matchAll(FORMULA_CELL)];

  const entries = formulas.map(([, address = '', formula]): CellEntry => [address, formula]);

  return Object.fromEntries(entries);
}

function unescapeXml(text: string): string {
  return text.replaceAll('&quot;', '"').replaceAll('&amp;', '&');
}

// The id of the number format the cell's style uses, read off the cell's `s` (its style's index in <cellXfs>).
function numberFormatIdOf(xlsx: Buffer, stylesXml: string, address: string): string | undefined {
  const styleIndex = new RegExp(`<c r="${address}" s="(\\d+)"`).exec(readFile(xlsx, SHEET_FILE))?.[1];
  const cellStyles = CELL_STYLES.exec(stylesXml)?.[1]?.match(CELL_STYLE) ?? [];

  return NUMBER_FORMAT_ID.exec(cellStyles[Number(styleIndex)] ?? '')?.[1];
}

// The number format a cell shows its value in ('"€"#,##0.00'), or undefined when it has none.
export function cellNumberFormat(xlsx: Buffer, address: string): string | undefined {
  const stylesXml = readFile(xlsx, STYLES_FILE);
  const formatId = numberFormatIdOf(xlsx, stylesXml, address);

  const formatCode = new RegExp(`<numFmt numFmtId="${formatId}" formatCode="([^"]+)"`).exec(stylesXml)?.[1];

  return formatCode === undefined ? undefined : unescapeXml(formatCode);
}
