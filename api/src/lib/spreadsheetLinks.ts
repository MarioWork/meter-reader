// Cells that open a web address when clicked, another feature write-excel-file leaves to its users. A real link, not a
// HYPERLINK() formula: it shows its text in a viewer that runs no formulas (Quick Look, a phone's preview) and still
// opens there. The sheet lists which cells link; the sheet's relationships file holds where each one goes.
import { getClosingTagMarkup, getOpeningTagMarkup, getSelfClosingTagMarkup } from 'write-excel-file/utility';
import {
  insertIntoWorksheet,
  WORKSHEET_FILE,
  WORKSHEET_RELATIONSHIPS_FILE,
  type NodeFeature,
} from './spreadsheetFeature.ts';

const HYPERLINK_RELATIONSHIP_TYPE = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink';
// Its own prefix, so an id cannot clash with the library's own relationships (rId-drawing-1).
const RELATIONSHIP_ID_PREFIX = 'rId-link-';
const FIRST_LINK_NUMBER = 1;

// One linked cell: its address ("D2") and the absolute url it opens.
export type CellLink = { address: string; url: string };

function relationshipId(linkIndex: number): string {
  return `${RELATIONSHIP_ID_PREFIX}${linkIndex + FIRST_LINK_NUMBER}`;
}

function hyperlinksElement(links: CellLink[]): string {
  const elements = links.map(({ address }, linkIndex) =>
    getSelfClosingTagMarkup('hyperlink', { ref: address, 'r:id': relationshipId(linkIndex) }),
  );

  return `${getOpeningTagMarkup('hyperlinks')}${elements.join('')}${getClosingTagMarkup('hyperlinks')}`;
}

// The attribute values are escaped by the library, so a url cannot break out of its quotes.
function relationshipElements(links: CellLink[]): string {
  const elements = links.map(({ url }, linkIndex) =>
    getSelfClosingTagMarkup('Relationship', {
      Id: relationshipId(linkIndex),
      Type: HYPERLINK_RELATIONSHIP_TYPE,
      Target: url,
      TargetMode: 'External',
    }),
  );

  return elements.join('');
}

// One feature for the whole workbook: `sheetsLinks` holds each sheet's links, in the order the sheets are written.
export function cellLinks(sheetsLinks: CellLink[][]): NodeFeature {
  return {
    files: {
      transform: {
        [WORKSHEET_FILE]: {
          transform: (xml, _options, { sheetIndex }) => {
            const links = sheetsLinks[sheetIndex] ?? [];

            if (links.length === 0) return xml;

            return insertIntoWorksheet(xml, hyperlinksElement(links));
          },
        },
        [WORKSHEET_RELATIONSHIPS_FILE]: {
          insert: (_options, { sheetIndex }) => relationshipElements(sheetsLinks[sheetIndex] ?? []),
        },
      },
    },
  };
}
