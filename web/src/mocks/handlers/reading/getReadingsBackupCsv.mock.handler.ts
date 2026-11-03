import { http, HttpResponse } from 'msw/http';
import { delay } from 'msw/utils/delay';
import { MOCK_DELAY } from '@mocks/handlers';
import { createReadingsBackupCsvMockModel } from './models/readingsBackupCsvMockModel.mock';
import { createReadingsBackupMockModel } from './models/readingsBackupMockModel.mock';
import { getMockReadings } from './readingMockState';

const FILE_NAME = 'water-readings-backup-2026-11-03.csv';
const CSV_CONTENT_TYPE = 'text/csv; charset=utf-8';

// The same readings as the JSON backup, one CSV line each.
export default (baseUrl: string) => [
  http.get(`${baseUrl}/readings/backup.csv`, async (): Promise<HttpResponse<string>> => {
    await delay(MOCK_DELAY);

    const backup = createReadingsBackupMockModel(getMockReadings());

    return HttpResponse.text(createReadingsBackupCsvMockModel(backup), {
      headers: { 'content-type': CSV_CONTENT_TYPE, 'content-disposition': `attachment; filename="${FILE_NAME}"` },
    });
  }),
];
