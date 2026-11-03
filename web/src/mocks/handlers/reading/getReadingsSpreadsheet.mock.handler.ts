import { http, HttpResponse } from 'msw/http';
import { delay } from 'msw/utils/delay';
import writeExcelFile from 'write-excel-file/browser';
import type { ReadingApiModel } from '@app-types/models';
import { ApiUrlParamsUtil } from '@app-types/utility';
import { MOCK_DELAY } from '@mocks/handlers';
import { narrowMockList } from '@mocks/mockListUtils';
import { READING_STATUS_LABELS } from '@utils/readingStatusUtils';
import { createReadingValidationErrorMockModel } from './models/readingErrorMockModel.mock';
import { ReadingApiSearchFields } from '@services/readingService/readingService';
import { isMockRangeBackwards, readMockDayRange } from './costsMockList';
import { getMockReadings } from './readingMockState';
import { BOLD, toMockCostCell, toMockDayCell, XLSX_CONTENT_TYPE } from './readingSheetMockCells';

const BAD_REQUEST = 400;
const FILE_NAME = 'water-readings.xlsx';
const DATE_TIME_FORMAT = 'yyyy-mm-dd hh:mm';
const HEADER_TITLES = ['Date', 'Digits', 'Status', 'Sent at', 'Cost'];

function toRow(reading: ReadingApiModel) {
  const sentAt = reading.sentAt ? { value: new Date(reading.sentAt), format: DATE_TIME_FORMAT } : null;

  return [
    toMockDayCell(reading),
    reading.digits,
    READING_STATUS_LABELS[reading.status],
    sentAt,
    toMockCostCell(reading),
  ];
}

// A real .xlsx in the demo too, built in the browser: a bold header, then every reading the filters match, newest
// first. Sent times stay in UTC here; the API shows them in the user's time zone.
export default (baseUrl: string) => [
  http.get(`${baseUrl}/readings/export.xlsx`, async ({ request }) => {
    await delay(MOCK_DELAY);

    if (isMockRangeBackwards(readMockDayRange(request))) {
      return HttpResponse.json(createReadingValidationErrorMockModel(), { status: BAD_REQUEST });
    }

    // The same filters as the list, no page: every reading they match.
    const readings = narrowMockList(request, getMockReadings(), {
      choices: { [ReadingApiSearchFields.STATUS]: (reading) => reading.status },
      ranges: [{ from: ApiUrlParamsUtil.dateFrom, to: ApiUrlParamsUtil.dateTo, read: (reading) => reading.date }],
    });
    const header = HEADER_TITLES.map((title) => ({ value: title, fontWeight: BOLD }));
    const blob = await writeExcelFile([header, ...readings.map(toRow)]).toBlob();

    return new HttpResponse(blob, {
      headers: { 'content-type': XLSX_CONTENT_TYPE, 'content-disposition': `attachment; filename="${FILE_NAME}"` },
    });
  }),
];
