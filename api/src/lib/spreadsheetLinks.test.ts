import { cellLinks } from './spreadsheetLinks.ts';

const SHEET_XML = '<worksheet><sheetData><row r="1"/></sheetData><pageMargins/></worksheet>';
const SHEET_PROPERTIES = { sheetIndex: 0, sheetId: '1' };

const feature = cellLinks([[{ address: 'D2', url: 'https://meter.example/api/bills/7?download=true&x="y"' }]]);
const sheetTransform = feature.files?.transform?.['xl/worksheets/sheet{id}.xml']?.transform;
const relationshipsInsert = feature.files?.transform?.['xl/worksheets/_rels/sheet{id}.xml.rels']?.insert;

describe('cellLinks', () => {
  it('lists the linked cell before the page margins, as the format orders it, when the sheet has a link', () => {
    const xml = sheetTransform?.(SHEET_XML, {}, SHEET_PROPERTIES);

    expect(xml).toContain('</sheetData><hyperlinks><hyperlink ref="D2" r:id="rId-link-1"/></hyperlinks><pageMargins/>');
  });

  it('points the link at its url, escaped, as an outside address when the url has special characters', () => {
    const markup = relationshipsInsert?.({}, SHEET_PROPERTIES);

    expect(markup).toBe(
      '<Relationship Id="rId-link-1" ' +
        'Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink" ' +
        'Target="https://meter.example/api/bills/7?download=true&amp;x=&quot;y&quot;" TargetMode="External"/>',
    );
  });

  it('leaves the sheet as it is when it has no links', () => {
    const otherSheet = { sheetIndex: 1, sheetId: '2' };

    expect(sheetTransform?.(SHEET_XML, {}, otherSheet)).toBe(SHEET_XML);
    expect(relationshipsInsert?.({}, otherSheet)).toBe('');
  });
});
