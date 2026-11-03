import { http, HttpResponse } from 'msw/http';
import { server, TEST_BASE_API_URL } from '@mocks/server';
import settingsService from './settingsService';

const API = TEST_BASE_API_URL;
const TEMPLATES = { subjectTemplate: 'Leitura {date}', bodyTemplate: 'Leitura - {reading} - {date}' };
const SETTINGS = { from: 'me@hotmail.example', to: 'readings@water-provider.example', ...TEMPLATES };

describe('getSettings', () => {
  it('returns the settings from GET /settings', async () => {
    server.use(http.get(`${API}/settings`, () => HttpResponse.json(SETTINGS)));

    expect(await settingsService.getSettings()).toEqual(SETTINGS);
  });

  it('throws when the API fails, so the page shows its error', async () => {
    server.use(http.get(`${API}/settings`, () => HttpResponse.json({ code: 'INTERNAL_ERROR' }, { status: 500 })));

    await expect(settingsService.getSettings()).rejects.toThrow();
  });
});

describe('updateSettings', () => {
  it('puts the address and the templates to /settings and returns the saved settings', async () => {
    let receivedBody: unknown;
    server.use(
      http.put(`${API}/settings`, async ({ request }) => {
        receivedBody = await request.json();

        return HttpResponse.json(SETTINGS);
      }),
    );

    const result = await settingsService.updateSettings({ to: SETTINGS.to, ...TEMPLATES });

    expect(receivedBody).toEqual({ to: SETTINGS.to, ...TEMPLATES });
    expect(result).toEqual({ success: true, data: SETTINGS });
  });

  it("returns a failure with the API's code instead of throwing when the API refuses", async () => {
    server.use(
      http.put(`${API}/settings`, () =>
        HttpResponse.json({ code: 'VALIDATION_ERROR', message: 'Request validation failed' }, { status: 400 }),
      ),
    );

    const result = await settingsService.updateSettings({ to: 'not an address', ...TEMPLATES });

    expect(result).toEqual({
      success: false,
      error: { statusCode: 400, code: 'VALIDATION_ERROR', message: 'Request validation failed' },
    });
  });
});
