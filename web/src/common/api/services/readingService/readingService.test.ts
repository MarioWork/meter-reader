import { http, HttpResponse } from 'msw/http';
import { HttpVerbsUtil, ReadingStatusUtil } from '@app-types/utility';
import type { ReadingsBackupApiModel } from '@app-types/models';
import { getMockReadings } from '@mocks/handlers/reading/readingMockState';
import { server, TEST_BASE_API_URL } from '@mocks/server';
import readingService from './readingService';

const EMPTY_PAGE = { data: [], currentPage: 1, totalResultNumber: 0 };

// Answers the list with an empty page and hands back the query it received.
function captureListQuery(): { query: URLSearchParams } {
  const received = { query: new URLSearchParams() };
  server.use(
    http.get(`${API}/readings`, ({ request }) => {
      received.query = new URL(request.url).searchParams;
      return HttpResponse.json(EMPTY_PAGE);
    }),
  );

  return received;
}

const API = TEST_BASE_API_URL;

describe('getCosts', () => {
  it('sends the day range under its wire names', async () => {
    let receivedQuery = new URLSearchParams();
    server.use(
      http.get(`${API}/readings/costs`, ({ request }) => {
        receivedQuery = new URL(request.url).searchParams;
        return HttpResponse.json({ data: [], totalCostCents: 0 });
      }),
    );

    await readingService.getCosts({ dateFrom: '2026-01-01', dateTo: '2026-03-31' });

    expect(receivedQuery.get('from')).toBe('2026-01-01');
    expect(receivedQuery.get('to')).toBe('2026-03-31');
  });

  it('returns the readings with a cost and their sum as the API sent them', async () => {
    const costs = await readingService.getCosts({ dateFrom: '2026-01-01', dateTo: '2026-03-31' });

    expect(costs.data.map((reading) => reading.costCents)).toEqual([3775, 4410]);
    expect(costs.totalCostCents).toBe(8185);
  });
});

describe('getReadings', () => {
  it('sends the page and the size under their wire names', async () => {
    let receivedQuery = new URLSearchParams();
    server.use(
      http.get(`${API}/readings`, ({ request }) => {
        receivedQuery = new URL(request.url).searchParams;
        return HttpResponse.json({ data: [], currentPage: 2, totalResultNumber: 0 });
      }),
    );

    await readingService.getReadings({ pagination: { page: '2', size: '1' } });

    expect(receivedQuery.get('page')).toBe('2');
    expect(receivedQuery.get('size')).toBe('1');
  });

  it('sends the day range and the statuses under their wire names, the statuses comma-separated', async () => {
    const received = captureListQuery();

    await readingService.getReadings({
      pagination: { page: '1', size: '10' },
      dateFrom: '2026-09-01',
      dateTo: '2026-09-30',
      statuses: [ReadingStatusUtil.NOT_SENT, ReadingStatusUtil.FAILED],
    });

    expect(received.query.get('from')).toBe('2026-09-01');
    expect(received.query.get('to')).toBe('2026-09-30');
    expect(received.query.get('status')).toBe('notSent,failed');
  });

  it('leaves out the filters that are not set, and the statuses when none is asked for', async () => {
    const received = captureListQuery();

    await readingService.getReadings({ pagination: { page: '1', size: '10' }, statuses: [] });

    expect(received.query.has('from')).toBe(false);
    expect(received.query.has('to')).toBe(false);
    expect(received.query.has('status')).toBe(false);
  });

  it('returns the page the API sent', async () => {
    const response = await readingService.getReadings({ pagination: { page: '1', size: '10' } });

    expect(response.data).toHaveLength(10);
    expect(response.totalResultNumber).toBe(14);
  });
});

describe('getReadingsSpreadsheetUrl', () => {
  const XLSX_CONTENT_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

  // Reads the whole file, as a browser saving it would. A body left unread keeps the mocked socket open.
  async function download(url: string): Promise<Response> {
    const response = await fetch(url);

    await response.arrayBuffer();

    return response;
  }

  it('points at the spreadsheet under the API base url, the filters and time zone under their wire names, when filtered', () => {
    const url = new URL(
      readingService.getReadingsSpreadsheetUrl({
        dateFrom: '2026-09-01',
        dateTo: '2026-09-30',
        statuses: [ReadingStatusUtil.NOT_SENT, ReadingStatusUtil.FAILED],
        timeZone: 'Europe/Lisbon',
      }),
    );

    expect(`${url.origin}${url.pathname}`).toBe(`${API}/readings/export.xlsx`);
    expect(url.searchParams.get('from')).toBe('2026-09-01');
    expect(url.searchParams.get('to')).toBe('2026-09-30');
    expect(url.searchParams.get('status')).toBe('notSent,failed');
    expect(url.searchParams.get('timeZone')).toBe('Europe/Lisbon');
  });

  it('leaves out every filter when none is set and no status is asked for', () => {
    const url = new URL(readingService.getReadingsSpreadsheetUrl({ statuses: [], timeZone: 'UTC' }));

    expect([...url.searchParams.keys()]).toEqual(['timeZone']);
  });

  it('downloads an .xlsx file under a clear name when followed', async () => {
    const response = await download(readingService.getReadingsSpreadsheetUrl({ timeZone: 'UTC' }));

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe(XLSX_CONTENT_TYPE);
    expect(response.headers.get('content-disposition')).toBe('attachment; filename="water-readings.xlsx"');
  });
});

describe('getReadingsBackupJsonUrl', () => {
  it('points at the JSON backup under the API base url, with no filter', () => {
    expect(readingService.getReadingsBackupJsonUrl()).toBe(`${API}/readings/backup.json`);
  });

  it('downloads every mock reading as a JSON file when followed', async () => {
    const response = await fetch(readingService.getReadingsBackupJsonUrl());

    const backup = (await response.json()) as ReadingsBackupApiModel;
    expect(response.headers.get('content-disposition')).toMatch(/^attachment; filename="water-readings-backup-/);
    expect(backup.readings).toHaveLength(getMockReadings().length);
  });
});

describe('getReadingsBackupCsvUrl', () => {
  it('points at the CSV backup under the API base url, with no filter', () => {
    expect(readingService.getReadingsBackupCsvUrl()).toBe(`${API}/readings/backup.csv`);
  });

  it('downloads a header and one line per mock reading as a CSV file when followed', async () => {
    const response = await fetch(readingService.getReadingsBackupCsvUrl());

    const lines = (await response.text()).trimEnd().split('\r\n');
    expect(response.headers.get('content-type')).toBe('text/csv; charset=utf-8');
    expect(lines).toHaveLength(getMockReadings().length + 1);
  });
});

describe('addReading', () => {
  const reading = { digits: '00123', date: '2026-10-31' };

  it('posts the digits as text and returns a success envelope', async () => {
    let receivedBody: unknown;
    server.use(
      http.post(`${API}/readings`, async ({ request }) => {
        receivedBody = await request.json();
        return HttpResponse.json(
          { ...reading, id: 30, status: ReadingStatusUtil.NOT_SENT, createdAt: '2026-10-31T09:00:00.000Z' },
          { status: 201 },
        );
      }),
    );

    const response = await readingService.addReading(reading);

    expect(receivedBody).toEqual({ digits: '00123', date: '2026-10-31' });
    expect(response.success).toBe(true);
    expect(response.data?.digits).toBe('00123');
  });

  it('returns a failure envelope instead of throwing', async () => {
    server.use(
      http.post(`${API}/readings`, () =>
        HttpResponse.json({ code: 'VALIDATION_ERROR', message: 'Request validation failed' }, { status: 400 }),
      ),
    );

    const response = await readingService.addReading(reading);

    expect(response).toEqual({
      success: false,
      error: { statusCode: 400, code: 'VALIDATION_ERROR', message: 'Request validation failed' },
    });
  });
});

describe('deleteReading', () => {
  it('sends a DELETE for the reading and returns a success envelope', async () => {
    let receivedMethod = '';
    let receivedPath = '';
    server.use(
      http.delete(`${API}/readings/:id`, ({ request }) => {
        receivedMethod = request.method;
        receivedPath = new URL(request.url).pathname;
        return new HttpResponse(null, { status: 204 });
      }),
    );

    const response = await readingService.deleteReading(14);

    expect(receivedMethod).toBe(HttpVerbsUtil.DELETE);
    expect(receivedPath).toBe('/api/readings/14');
    expect(response.success).toBe(true);
  });

  it('returns a failure envelope instead of throwing when the reading is gone', async () => {
    const response = await readingService.deleteReading(999);

    expect(response).toEqual({
      success: false,
      error: { statusCode: 404, code: 'NOT_FOUND', message: 'Reading 999 not found' },
    });
  });
});

describe('updateReading', () => {
  // Keeps what the app asked for and where, then lets the mock API answer it as usual.
  function recordUpdateRequest() {
    const received: { method: string; path: string; body: unknown } = { method: '', path: '', body: undefined };
    server.use(
      http.patch(`${API}/readings/:id`, async ({ request }) => {
        received.method = request.method;
        received.path = new URL(request.url).pathname;
        received.body = await request.clone().json();
      }),
    );

    return received;
  }

  it('patches the cost in cents and returns the updated reading in a success envelope', async () => {
    const received = recordUpdateRequest();

    const response = await readingService.updateReading(14, { costCents: 4210 });

    expect(received).toEqual({ method: HttpVerbsUtil.PATCH, path: '/api/readings/14', body: { costCents: 4210 } });
    expect(response.success).toBe(true);
    expect(response.data?.costCents).toBe(4210);
  });

  it('changes a cost that is already set', async () => {
    await readingService.updateReading(14, { costCents: 4210 });

    const response = await readingService.updateReading(14, { costCents: 3999 });

    expect(response.data?.costCents).toBe(3999);
  });

  it('sends null to remove the cost', async () => {
    const received = recordUpdateRequest();
    await readingService.updateReading(14, { costCents: 4210 });

    const response = await readingService.updateReading(14, { costCents: null });

    expect(received.body).toEqual({ costCents: null });
    expect(response.data?.costCents).toBeNull();
  });

  it("returns a failure envelope with the server's reason instead of throwing when the API refuses the cost", async () => {
    server.use(
      http.patch(`${API}/readings/:id`, () =>
        HttpResponse.json({ code: 'VALIDATION_ERROR', message: 'Request validation failed' }, { status: 400 }),
      ),
    );

    const response = await readingService.updateReading(14, { costCents: -1 });

    expect(response).toEqual({
      success: false,
      error: { statusCode: 400, code: 'VALIDATION_ERROR', message: 'Request validation failed' },
    });
  });

  it('returns a failure envelope when the reading is gone', async () => {
    const response = await readingService.updateReading(999, { costCents: 4210 });

    expect(response).toMatchObject({ success: false, error: { statusCode: 404 } });
  });
});

describe('getReadingEmail', () => {
  it("asks for the reading's email and returns the preview the API built", async () => {
    let receivedPath = '';
    server.use(
      http.get(`${API}/readings/:id/email`, ({ request }) => {
        receivedPath = new URL(request.url).pathname;
        return HttpResponse.json({
          to: 'readings@water-provider.example',
          subject: 'Meter reading 1 October 2026',
          body: 'Date: 1 October 2026\nReading: 00529',
          attachment: null,
        });
      }),
    );

    const email = await readingService.getReadingEmail(14);

    expect(receivedPath).toBe('/api/readings/14/email');
    expect(email.body).toBe('Date: 1 October 2026\nReading: 00529');
  });

  it('throws when the API fails, so the page shows its error', async () => {
    await expect(readingService.getReadingEmail(999)).rejects.toThrow();
  });
});

describe('sendReading', () => {
  it('posts whether to attach the photo and returns the sent reading in a success envelope', async () => {
    let receivedBody: unknown;
    let receivedPath = '';
    server.use(
      http.post(`${API}/readings/:id/send`, async ({ request }) => {
        receivedBody = await request.clone().json();
        receivedPath = new URL(request.url).pathname;
      }),
    );

    const response = await readingService.sendReading(14, { attachPhoto: true });

    expect(receivedPath).toBe('/api/readings/14/send');
    expect(receivedBody).toEqual({ attachPhoto: true });
    expect(response.success).toBe(true);
    expect(response.data?.status).toBe(ReadingStatusUtil.SENT);
  });

  it("returns a failure envelope with the server's reason instead of throwing when the send fails", async () => {
    server.use(
      http.post(`${API}/readings/:id/send`, () =>
        HttpResponse.json(
          { code: 'MAIL_SERVICE_BUSY', message: 'Microsoft is busy or down right now. Try again in a few minutes' },
          { status: 502 },
        ),
      ),
    );

    const response = await readingService.sendReading(14, { attachPhoto: false });

    expect(response).toEqual({
      success: false,
      error: {
        statusCode: 502,
        code: 'MAIL_SERVICE_BUSY',
        message: 'Microsoft is busy or down right now. Try again in a few minutes',
      },
    });
  });
});
