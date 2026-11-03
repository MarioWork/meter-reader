import { http, HttpResponse } from 'msw/http';
import { delay } from 'msw/utils/delay';
import type { ReadingsBackupApiModel } from '@app-types/models';
import { MOCK_DELAY } from '@mocks/handlers';
import { createReadingsBackupMockModel } from './models/readingsBackupMockModel.mock';
import { getMockReadings } from './readingMockState';

const FILE_NAME = 'water-readings-backup-2026-11-03.json';

// Every mock reading, whatever Home is filtered to, saved as a file as the API sends it.
export default (baseUrl: string) => [
  http.get(`${baseUrl}/readings/backup.json`, async (): Promise<HttpResponse<ReadingsBackupApiModel>> => {
    await delay(MOCK_DELAY);

    return HttpResponse.json(createReadingsBackupMockModel(getMockReadings()), {
      headers: { 'content-disposition': `attachment; filename="${FILE_NAME}"` },
    });
  }),
];
