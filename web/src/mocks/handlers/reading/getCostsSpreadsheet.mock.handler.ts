import { http, HttpResponse } from 'msw/http';
import { delay } from 'msw/utils/delay';
import writeExcelFile from 'write-excel-file/browser';
import type { ReadingApiModel } from '@app-types/models';
import { MOCK_DELAY } from '@mocks/handlers';
import { CENTS_PER_EURO } from '@utils/costUtils';
import {
  getMockCostReadings,
  isMockRangeBackwards,
  readMockDayRange,
  sumMockCostCents,
  type MockDayRange,
} from './costsMockList';
import { createReadingValidationErrorMockModel } from './models/readingErrorMockModel.mock';
import {
  BOLD,
  EURO_FORMAT,
  toMockCostCell,
  toMockDayCell,
  XLSX_CONTENT_TYPE,
  XLSX_EXTENSION,
} from './readingSheetMockCells';

const BAD_REQUEST = 400;
const FILE_NAME_BASE = 'water-costs';
const FILE_NAME_SEPARATOR = '-';
const HEADER_TITLES = ['Date', 'Digits', 'Cost', 'Bill'];
const SUM_ROW_LABEL = 'Total';
const OPEN_BILL_TEXT = 'Open';
// The words between the days in a file name.
const RANGE_TO_WORD = 'to';
const RANGE_FROM_WORD = 'from';
const RANGE_UNTIL_WORD = 'until';

// The Bill column says Open, as the API's does; the demo's cell is plain text, not a link.
function toRow(reading: ReadingApiModel) {
  const bill = reading.bill === null ? null : OPEN_BILL_TEXT;

  return [toMockDayCell(reading), reading.digits, toMockCostCell(reading), bill];
}

function toSumRow(readings: ReadingApiModel[]) {
  const total = {
    value: sumMockCostCents(readings) / CENTS_PER_EURO,
    format: EURO_FORMAT,
    fontWeight: BOLD,
  };

  return [{ value: SUM_ROW_LABEL, fontWeight: BOLD }, null, total, null];
}

// The day range in the name, as the API names it: water-costs-2026-01-01-to-2026-03-31.xlsx.
function dayRangeParts({ dateFrom, dateTo }: MockDayRange): string[] {
  if (dateFrom && dateTo) return [dateFrom, RANGE_TO_WORD, dateTo];

  if (dateFrom) return [RANGE_FROM_WORD, dateFrom];

  if (dateTo) return [RANGE_UNTIL_WORD, dateTo];

  return [];
}

function fileName(range: MockDayRange): string {
  return `${[FILE_NAME_BASE, ...dayRangeParts(range)].join(FILE_NAME_SEPARATOR)}${XLSX_EXTENSION}`;
}

// A real .xlsx in the demo too, built in the browser: a bold header, the Costs page's readings for the day range,
// newest first, then their sum.
export default (baseUrl: string) => [
  http.get(`${baseUrl}/readings/costs/export.xlsx`, async ({ request }) => {
    await delay(MOCK_DELAY);

    const range = readMockDayRange(request);

    if (isMockRangeBackwards(range)) {
      return HttpResponse.json(createReadingValidationErrorMockModel(), { status: BAD_REQUEST });
    }

    const readings = getMockCostReadings(request);
    const header = HEADER_TITLES.map((title) => ({ value: title, fontWeight: BOLD }));
    const blob = await writeExcelFile([header, ...readings.map(toRow), toSumRow(readings)]).toBlob();

    return new HttpResponse(blob, {
      headers: {
        'content-type': XLSX_CONTENT_TYPE,
        'content-disposition': `attachment; filename="${fileName(range)}"`,
      },
    });
  }),
];
