import { http, HttpResponse } from 'msw/http';
import { delay } from 'msw/utils/delay';
import type { MailStatusApiModel } from '@app-types/models';
import { MOCK_DELAY } from '@mocks/handlers';
import { createMailStatusMockModel } from './models/mailStatusMockModel.mock';

export default (baseUrl: string) => [
  http.get(`${baseUrl}/mail/status`, async (): Promise<HttpResponse<MailStatusApiModel>> => {
    await delay(MOCK_DELAY);

    return HttpResponse.json(createMailStatusMockModel());
  }),
];
