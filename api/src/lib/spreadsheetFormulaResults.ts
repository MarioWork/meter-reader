// A formula's result kept in its cell, beside the formula. write-excel-file writes the formula alone and leaves the
// sum to the app that opens the file; a viewer that runs no formulas (Quick Look, a phone's preview, a script reading
// the file) would then show an empty cell. Excel still recalculates it on open.
import {
  appendMarkupInsideElement,
  findElement,
  findElementInsideElement,
  getChildElements,
  getClosingTagMarkup,
  getOpeningTagMarkup,
  type FoundElement,
} from 'write-excel-file/utility';
import { WORKSHEET_FILE, type NodeFeature } from './spreadsheetFeature.ts';

const CELL_ADDRESS = /^[A-Z]+(\d+)$/;

// One formula cell, by its address ("C5"), and the number its formula gives.
export type FormulaResult = { address: string; value: number };

function rowNumberOf(address: string): string {
  return CELL_ADDRESS.exec(address)?.[1] ?? '';
}

function findChild(xml: string, parent: FoundElement, attribute: string, value: string): FoundElement | undefined {
  return getChildElements(xml, parent).find((child) => String(child.openingTagAttributes[attribute]) === value);
}

// The cell's <c> element: inside <sheetData>, its <row r="5">, then its <c r="C5">.
function findCell(xml: string, address: string): FoundElement | undefined {
  const sheetData = findElement(xml, 'sheetData');
  const row = sheetData && findChild(xml, sheetData, 'r', rowNumberOf(address));

  return row && findChild(xml, row, 'r', address);
}

// <c r="C5"><f>SUM(C2:C4)</f></c> becomes <c r="C5"><f>SUM(C2:C4)</f><v>82</v></c>. A cell that is not there, or holds
// no formula, is left as it is.
function addResult(xml: string, { address, value }: FormulaResult): string {
  const cell = findCell(xml, address);
  const formula = cell && !cell.selfClosingTag ? findElementInsideElement(xml, 'f', cell) : undefined;

  if (!cell || !formula) return xml;

  return appendMarkupInsideElement(xml, cell, `${getOpeningTagMarkup('v')}${value}${getClosingTagMarkup('v')}`);
}

// One feature for the whole workbook: `sheetsResults` holds each sheet's results, in the order the sheets are written.
export function formulaResults(sheetsResults: FormulaResult[][]): NodeFeature {
  return {
    files: {
      transform: {
        [WORKSHEET_FILE]: {
          transform: (xml, _options, { sheetIndex }) => (sheetsResults[sheetIndex] ?? []).reduce(addResult, xml),
        },
      },
    },
  };
}
