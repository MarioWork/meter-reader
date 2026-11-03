// Filter arrows on a sheet's header row: a feature write-excel-file leaves to its users ("features": raw access to
// the .xlsx XML). Excel reads the sheet's <autoFilter>; LibreOffice also needs the workbook's hidden name for it.
import {
  appendMarkupInsideElement,
  findElement,
  getCellAddress,
  getClosingTagMarkup,
  getOpeningTagMarkup,
  getOrderOfSiblings,
  getSelfClosingTagMarkup,
  insertElementMarkupAccordingToOrderOfSiblings,
  replaceElement,
  sanitizeTextContent,
} from 'write-excel-file/utility';
import { insertIntoWorksheet, WORKSHEET_FILE, type NodeFeature } from './spreadsheetFeature.ts';

const WORKBOOK_FILE = 'xl/workbook.xml';
// Excel names a sheet's filter range with this hidden defined name; LibreOffice needs it to show the arrows.
const FILTER_DATABASE_NAME = '_xlnm._FilterDatabase';
const CELL_ADDRESS = /^([A-Z]+)(\d+)$/;
// "$A$1": the same address, fixed, as a defined name holds it.
const ABSOLUTE_ADDRESS = '$$$1$$$2';
const FIRST_INDEX = 0;

// The arrows sit over the header and every row below it, across every column. One per sheet, in workbook order.
export type SheetFilter = { sheetName: string; rowCount: number; columnCount: number };

// "A1:D8": the header's first cell to the last data row's last cell.
function filterRange({ rowCount, columnCount }: SheetFilter): string {
  const firstCell = getCellAddress(FIRST_INDEX, FIRST_INDEX);
  const lastCell = getCellAddress(rowCount - 1, columnCount - 1);

  return `${firstCell}:${lastCell}`;
}

function toAbsoluteAddress(address: string): string {
  return address.replace(CELL_ADDRESS, ABSOLUTE_ADDRESS);
}

// 'Bob''s readings'!$A$1:$D$8: the sheet's name quoted (any quote doubled), then the range fixed.
function absoluteRange(filter: SheetFilter): string {
  const [firstCell = '', lastCell = ''] = filterRange(filter).split(':');
  const quotedName = `'${filter.sheetName.replaceAll("'", "''")}'`;

  return `${quotedName}!${toAbsoluteAddress(firstCell)}:${toAbsoluteAddress(lastCell)}`;
}

function definedNameElements(filters: SheetFilter[]): string {
  const names = filters.map((filter, sheetIndex) => {
    const attributes = { name: FILTER_DATABASE_NAME, localSheetId: sheetIndex, hidden: 1 };
    const range = sanitizeTextContent(absoluteRange(filter));

    return `${getOpeningTagMarkup('definedName', attributes)}${range}${getClosingTagMarkup('definedName')}`;
  });

  return names.join('');
}

// The library writes an empty <definedNames/>: fill it rather than add a second one.
function addDefinedNames(xml: string, filters: SheetFilter[]): string {
  const names = definedNameElements(filters);
  const markup = `${getOpeningTagMarkup('definedNames')}${names}${getClosingTagMarkup('definedNames')}`;
  const existing = findElement(xml, 'definedNames');

  if (existing?.selfClosingTag) return replaceElement(xml, existing, markup);

  if (existing) return appendMarkupInsideElement(xml, existing, names);

  const order = getOrderOfSiblings(WORKBOOK_FILE, 'workbook') ?? [];

  return insertElementMarkupAccordingToOrderOfSiblings(xml, markup, order, 'workbook');
}

// One feature for the whole workbook: `filters` is in the same order as the sheets passed to writeExcelFile.
export function filterArrows(filters: SheetFilter[]): NodeFeature {
  return {
    files: {
      transform: {
        [WORKSHEET_FILE]: {
          transform: (xml, _options, { sheetIndex }) => {
            const filter = filters[sheetIndex];

            if (!filter) return xml;

            return insertIntoWorksheet(xml, getSelfClosingTagMarkup('autoFilter', { ref: filterRange(filter) }));
          },
        },
        [WORKBOOK_FILE]: {
          transform: (xml) => {
            if (filters.length === 0) return xml;

            return addDefinedNames(xml, filters);
          },
        },
      },
    },
  };
}
