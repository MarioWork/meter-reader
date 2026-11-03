// What every write-excel-file "feature" in this folder shares: raw access to the .xlsx XML, one file at a time.
import type writeExcelFile from 'write-excel-file/node';
import { getOrderOfSiblings, insertElementMarkupAccordingToOrderOfSiblings } from 'write-excel-file/utility';

// The library's Feature type, with the Node build's own file-content type filled in.
export type NodeFeature = NonNullable<NonNullable<Parameters<typeof writeExcelFile>[1]>['features']>[number];

export const WORKSHEET_FILE = 'xl/worksheets/sheet{id}.xml';
export const WORKSHEET_RELATIONSHIPS_FILE = 'xl/worksheets/_rels/sheet{id}.xml.rels';

// An element added to a sheet goes where the .xlsx format says it goes among its siblings, or Excel asks to repair.
export function insertIntoWorksheet(xml: string, markup: string): string {
  const order = getOrderOfSiblings(WORKSHEET_FILE, 'worksheet') ?? [];

  return insertElementMarkupAccordingToOrderOfSiblings(xml, markup, order, 'worksheet');
}
