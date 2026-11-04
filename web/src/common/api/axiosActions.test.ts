import axios from 'axios';
import { http, HttpResponse } from 'msw/http';
import { server, TEST_BASE_API_URL } from '@mocks/server';
import { HttpVerbsUtil } from '@app-types/utility';
import { axiosActions, isNotFoundFailure, isUnauthorizedFailure } from './axiosActions';

const TEST_PATH = '/actions-test';
const TEST_URL = `${TEST_BASE_API_URL}${TEST_PATH}`;

it('wraps the response data as a success', async () => {
  server.use(http.post(TEST_URL, () => HttpResponse.json({ id: 7 })));

  const result = await axiosActions<{ id: number }>({ url: TEST_PATH, method: HttpVerbsUtil.POST });

  expect(result).toEqual({ success: true, data: { id: 7 } });
});

it('returns a failure with the status and the API envelope instead of throwing', async () => {
  server.use(
    http.post(TEST_URL, () =>
      HttpResponse.json({ code: 'ALREADY_SET_UP', message: 'The app is already set up' }, { status: 409 }),
    ),
  );

  const result = await axiosActions({ url: TEST_PATH, method: HttpVerbsUtil.POST });

  expect(result).toEqual({
    success: false,
    error: { statusCode: 409, code: 'ALREADY_SET_UP', message: 'The app is already set up' },
  });
});

it("returns the refused fields with the API's reasons when the API names them", async () => {
  server.use(
    http.post(TEST_URL, () =>
      HttpResponse.json(
        {
          code: 'VALIDATION_ERROR',
          message: 'Request validation failed',
          issues: [{ path: '/subjectTemplate', message: '{readng} is not a placeholder.' }, { path: 7 }],
        },
        { status: 400 },
      ),
    ),
  );

  const result = await axiosActions({ url: TEST_PATH, method: HttpVerbsUtil.POST });

  expect(result.error).toEqual({
    statusCode: 400,
    code: 'VALIDATION_ERROR',
    message: 'Request validation failed',
    issues: [{ path: '/subjectTemplate', message: '{readng} is not a placeholder.' }],
  });
});

it('returns only the status when the answer is not the API envelope', async () => {
  server.use(http.post(TEST_URL, () => HttpResponse.json({ message: 'Conflict' }, { status: 409 })));

  const result = await axiosActions({ url: TEST_PATH, method: HttpVerbsUtil.POST });

  expect(result).toEqual({ success: false, error: { statusCode: 409 } });
});

it('returns a failure with no status when the request never gets an answer', async () => {
  server.use(http.post(TEST_URL, () => HttpResponse.error()));

  const result = await axiosActions({ url: TEST_PATH, method: HttpVerbsUtil.POST });

  expect(result).toEqual({ success: false, error: { statusCode: undefined } });
});

it('rethrows an error that is not a request failure', async () => {
  vi.spyOn(axios, 'request').mockRejectedValueOnce(new TypeError('bug'));

  await expect(axiosActions({ url: TEST_PATH, method: HttpVerbsUtil.POST })).rejects.toThrow('bug');
});

describe('isNotFoundFailure', () => {
  it('is true for a read that found nothing', async () => {
    server.use(http.get(TEST_URL, () => HttpResponse.json({ code: 'NOT_FOUND' }, { status: 404 })));

    const reading = axios.get(TEST_PATH);

    await expect(reading).rejects.toSatisfy(isNotFoundFailure);
  });

  it('is false for a read that broke', async () => {
    server.use(http.get(TEST_URL, () => HttpResponse.json({ code: 'INTERNAL_ERROR' }, { status: 500 })));

    await expect(axios.get(TEST_PATH)).rejects.not.toSatisfy(isNotFoundFailure);
  });
});

describe('isUnauthorizedFailure', () => {
  it('is true for a write refused for having no session', async () => {
    server.use(
      http.post(TEST_URL, () => HttpResponse.json({ code: 'UNAUTHORIZED', message: 'Sign in' }, { status: 401 })),
    );

    const result = await axiosActions({ url: TEST_PATH, method: HttpVerbsUtil.POST });

    expect(isUnauthorizedFailure(result)).toBe(true);
  });

  it('is false for a 401 with its own code, such as a wrong password', async () => {
    server.use(http.post(TEST_URL, () => HttpResponse.json({ code: 'SIGN_IN_FAILED' }, { status: 401 })));

    const result = await axiosActions({ url: TEST_PATH, method: HttpVerbsUtil.POST });

    expect(isUnauthorizedFailure(result)).toBe(false);
  });

  it('is true for a read that threw a 401', async () => {
    server.use(http.get(TEST_URL, () => HttpResponse.json({ code: 'UNAUTHORIZED' }, { status: 401 })));

    const failure: unknown = await axios.get(TEST_PATH).catch((error: unknown) => error);

    expect(isUnauthorizedFailure(failure)).toBe(true);
  });
});
