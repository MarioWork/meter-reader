import { formulaResults } from './spreadsheetFormulaResults.ts';

const SHEET_XML =
  '<worksheet><sheetData><row r="1"><c r="A1" t="s"><v>0</v></c></row>' +
  '<row r="3"><c r="A3" t="s"><v>1</v></c><c r="B3" s="2"><f>SUM(B2:B2)</f></c></row></sheetData></worksheet>';
const SHEET_PROPERTIES = { sheetIndex: 0, sheetId: '1' };

function transformWith(results: { address: string; value: number }[]): string | undefined {
  const transform = formulaResults([results]).files?.transform?.['xl/worksheets/sheet{id}.xml']?.transform;

  return transform?.(SHEET_XML, {}, SHEET_PROPERTIES);
}

describe('formulaResults', () => {
  it('keeps the result beside the formula when the cell holds one', () => {
    expect(transformWith([{ address: 'B3', value: 82.5 }])).toContain(
      '<c r="B3" s="2"><f>SUM(B2:B2)</f><v>82.5</v></c>',
    );
  });

  it('leaves the sheet as it is when the cell holds no formula or is not there', () => {
    expect(transformWith([{ address: 'A3', value: 1 }])).toBe(SHEET_XML);
    expect(transformWith([{ address: 'C9', value: 1 }])).toBe(SHEET_XML);
  });
});
