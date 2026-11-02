// A fake of Microsoft's sign-in service for the mail tests: the device-code and token endpoints, answered from MSW.
import { http, HttpResponse } from 'msw/http';
import { setupServer } from 'msw/node';
import { delay } from 'msw/utils/delay';
import { DEVICE_CODE_URL, TOKEN_URL } from './mail.microsoftIdentity.ts';

export const TEST_USER_CODE = 'F7KQ2LXP9';
export const TEST_VERIFICATION_URI = 'https://www.microsoft.com/link';
export const TEST_ACCESS_TOKEN = 'test-access-token-eyJ0eXAiOiJKV1Qi';
export const TEST_REFRESH_TOKEN = 'test-refresh-token-M.C540_BAY.0.U';
export const TEST_DEVICE_CODE = 'test-device-code-DAQABAAEAAAD';
export const ACCESS_TOKEN_LIFETIME_SECONDS = 3600;

const OK = 200;
const BAD_REQUEST = 400;
const SERVICE_UNAVAILABLE = 503;
// Microsoft's real lifetime for a device code: 15 minutes.
const DEVICE_CODE_LIFETIME_SECONDS = 900;

export type MicrosoftAnswer = { status: number; body: Record<string, unknown> };

// A form Microsoft received, as the fields it was sent.
export type ReceivedForm = Record<string, string>;

export const microsoftIdentityServer = setupServer();

export function tokensAnswer(overrides: Record<string, unknown> = {}): MicrosoftAnswer {
  return {
    status: OK,
    body: {
      token_type: 'Bearer',
      scope: 'https://graph.microsoft.com/Mail.Send',
      expires_in: ACCESS_TOKEN_LIFETIME_SECONDS,
      access_token: TEST_ACCESS_TOKEN,
      refresh_token: TEST_REFRESH_TOKEN,
      ...overrides,
    },
  };
}

// An OAuth error, as Microsoft sends it: 400 with `error` and a human description.
export function errorAnswer(error: string): MicrosoftAnswer {
  return { status: BAD_REQUEST, body: { error, error_description: `AADSTS00000: ${error}` } };
}

export function deviceCodeAnswer(overrides: Record<string, unknown> = {}): MicrosoftAnswer {
  return {
    status: OK,
    body: {
      device_code: TEST_DEVICE_CODE,
      user_code: TEST_USER_CODE,
      verification_uri: TEST_VERIFICATION_URI,
      expires_in: DEVICE_CODE_LIFETIME_SECONDS,
      // No wait between polls, so the tests run at full speed.
      interval: 0,
      message: `To sign in, open ${TEST_VERIFICATION_URI} and enter the code ${TEST_USER_CODE}.`,
      ...overrides,
    },
  };
}

function toFields(text: string): ReceivedForm {
  return Object.fromEntries(new URLSearchParams(text));
}

// Answers each request to `url` with the next answer in line; the last one repeats. Returns the forms received.
function answerInTurn(url: string, answers: MicrosoftAnswer[]): ReceivedForm[] {
  const received: ReceivedForm[] = [];

  microsoftIdentityServer.use(
    http.post(url, async ({ request }) => {
      received.push(toFields(await request.text()));
      const answer = answers[Math.min(received.length, answers.length) - 1] ?? errorAnswer('server_error');

      return HttpResponse.json(answer.body, { status: answer.status });
    }),
  );

  return received;
}

export function answerDeviceCode(answer: MicrosoftAnswer = deviceCodeAnswer()): ReceivedForm[] {
  return answerInTurn(DEVICE_CODE_URL, [answer]);
}

export function answerToken(...answers: MicrosoftAnswer[]): ReceivedForm[] {
  return answerInTurn(TOKEN_URL, answers);
}

// Microsoft is having a passing outage: a 5xx with no OAuth error.
export function outageAnswer(): MicrosoftAnswer {
  return { status: SERVICE_UNAVAILABLE, body: {} };
}

// Microsoft takes the request and never answers.
export function hangForever(url: string): void {
  microsoftIdentityServer.use(
    http.post(url, async () => {
      await delay('infinite');
    }),
  );
}

// Microsoft cannot be reached at all (no network, DNS down).
export function failNetwork(url: string): void {
  microsoftIdentityServer.use(http.post(url, () => HttpResponse.error()));
}
