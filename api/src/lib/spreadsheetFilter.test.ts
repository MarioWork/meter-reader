import { filterArrows } from './spreadsheetFilter.ts';

const SHEET_XML =
  '<worksheet><sheetViews><sheetView workbookViewId="0"/></sheetViews><cols/><sheetData><row r="1"/></sheetData></worksheet>';
const EMPTY_NAMES_WORKBOOK_XML =
  '<workbook><sheets><sheet name="Readings"/></sheets><definedNames/><calcPr/></workbook>';
const SHEET_PROPERTIES = { sheetIndex: 0, sheetId: '1' };
const OTHER_SHEET_PROPERTIES = { sheetIndex: 1, sheetId: '2' };

const feature = filterArrows([{ sheetName: "Bob's readings", rowCount: 8, columnCount: 4 }]);
const sheetTransform = feature.files?.transform?.['xl/worksheets/sheet{id}.xml']?.transform;
const workbookTransform = feature.files?.transform?.['xl/workbook.xml']?.transform;

describe('filterArrows', () => {
  it('puts the filter over the header and every row, after the data, when the sheet has one', () => {
    const xml = sheetTransform?.(SHEET_XML, {}, SHEET_PROPERTIES);

    expect(xml).toContain('</sheetData><autoFilter ref="A1:D8"/>');
  });

  it('leaves a sheet as it is when it has no filter', () => {
    const xml = sheetTransform?.(SHEET_XML, {}, OTHER_SHEET_PROPERTIES);

    expect(xml).toBe(SHEET_XML);
  });

  it("names the filter's range in the workbook, quoting the sheet name, when the workbook has an empty list", () => {
    const xml = workbookTransform?.(EMPTY_NAMES_WORKBOOK_XML, [], {}) ?? '';

    expect(xml).toContain(
      `<definedNames><definedName name="_xlnm._FilterDatabase" localSheetId="0" hidden="1">'Bob''s readings'!$A$1:$D$8</definedName></definedNames>`,
    );
    expect(xml).not.toContain('<definedNames/>');
  });
});
