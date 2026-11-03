import { http, HttpResponse } from 'msw/http';
import { delay } from 'msw/utils/delay';
import type { BackupApiModel } from '@app-types/models';
import { MOCK_DELAY } from '@mocks/handlers';
import { getMockReadings } from '@mocks/handlers/reading/readingMockState';
import { BACKUP_JSON_FILE_NAME, attachment } from './backupMockUtils';
import { createBackupMockModel } from './models/backupMockModel.mock';

// Every mock reading, whatever Home is filtered to, saved as a file as the API sends it.
export default (baseUrl: string) => [
  http.get(`${baseUrl}/backup/readings.json`, async (): Promise<HttpResponse<BackupApiModel>> => {
    await delay(MOCK_DELAY);

    return HttpResponse.json(createBackupMockModel(getMockReadings()), {
      headers: { 'Content-Disposition': attachment(BACKUP_JSON_FILE_NAME) },
    });
  }),
];
