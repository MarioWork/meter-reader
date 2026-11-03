import { http, HttpResponse } from 'msw/http';
import { delay } from 'msw/utils/delay';
import { MOCK_DELAY } from '@mocks/handlers';
import { createReadingsBackupMockModel } from './models/readingsBackupMockModel.mock';
import { createReadingsBackupZipMockModel } from './models/readingsBackupZipMockModel.mock';
import { getMockReadings } from './readingMockState';

const FILE_NAME = 'water-readings-backup-2026-11-03.zip';
const ZIP_CONTENT_TYPE = 'application/zip';

// Every mock reading's Photo in photos/ and Bill in bills/, saved as one zip as the API sends it.
export default (baseUrl: string) => [
  http.get(`${baseUrl}/readings/backup.zip`, async (): Promise<HttpResponse<Uint8Array>> => {
    await delay(MOCK_DELAY);

    const backup = createReadingsBackupMockModel(getMockReadings());

    return new HttpResponse(createReadingsBackupZipMockModel(backup), {
      headers: { 'content-type': ZIP_CONTENT_TYPE, 'content-disposition': `attachment; filename="${FILE_NAME}"` },
    });
  }),
];
