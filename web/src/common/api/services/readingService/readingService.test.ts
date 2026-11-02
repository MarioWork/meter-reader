import { http, HttpResponse } from 'msw/http';
import { HttpVerbsUtil, ReadingStatusUtil } from '@app-types/utility';
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

describe('getReadingEmail', () => {
  it("asks for the reading's email and returns the preview the API built", async () => {
    let receivedPath = '';
    server.use(
      http.get(`${API}/readings/:id/email`, ({ request }) => {
        receivedPath = new URL(request.url).pathname;
        return HttpResponse.json({
          to: 'readings@water-provider.example',
          subject: 'test',
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
        receivedBody = await request.json();
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
