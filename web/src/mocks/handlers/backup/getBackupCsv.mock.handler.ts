import { http, HttpResponse } from 'msw/http';
import { delay } from 'msw/utils/delay';
import { MOCK_DELAY } from '@mocks/handlers';
import { getMockReadings } from '@mocks/handlers/reading/readingMockState';
import { BACKUP_CSV_FILE_NAME, CSV_CONTENT_TYPE, attachment } from './backupMockUtils';
import { createBackupCsvMockModel } from './models/backupCsvMockModel.mock';
import { createBackupMockModel } from './models/backupMockModel.mock';

// The same readings, one CSV line each.
export default (baseUrl: string) => [
  http.get(`${baseUrl}/backup/readings.csv`, async (): Promise<HttpResponse<string>> => {
    await delay(MOCK_DELAY);

    return HttpResponse.text(createBackupCsvMockModel(createBackupMockModel(getMockReadings())), {
      headers: { 'Content-Type': CSV_CONTENT_TYPE, 'Content-Disposition': attachment(BACKUP_CSV_FILE_NAME) },
    });
  }),
];
