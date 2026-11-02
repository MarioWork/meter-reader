import { http, HttpResponse } from 'msw/http';
import { MailStateUtil } from '@app-types/utility';
import { server, TEST_BASE_API_URL } from '@mocks/server';
import mailService from './mailService';

const API = TEST_BASE_API_URL;

describe('getStatus', () => {
  it('returns whether the server can send mail from Hotmail', async () => {
    server.use(http.get(`${API}/mail/status`, () => HttpResponse.json({ state: MailStateUtil.NOT_CONNECTED })));

    expect(await mailService.getStatus()).toEqual({ state: MailStateUtil.NOT_CONNECTED });
  });

  it('throws when the API fails, so the page shows its error', async () => {
    server.use(http.get(`${API}/mail/status`, () => HttpResponse.json({ code: 'INTERNAL_ERROR' }, { status: 500 })));

    await expect(mailService.getStatus()).rejects.toThrow();
  });
});
