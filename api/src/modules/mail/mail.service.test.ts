import { inspect } from 'node:util';
import { AppError } from '../../lib/errors.ts';
import { DEVICE_CODE_URL, TOKEN_URL } from './mail.microsoftIdentity.ts';
import {
  ACCESS_TOKEN_LIFETIME_SECONDS,
  TEST_ACCESS_TOKEN,
  TEST_DEVICE_CODE,
  TEST_REFRESH_TOKEN,
  TEST_USER_CODE,
  TEST_VERIFICATION_URI,
  answerDeviceCode,
  answerToken,
  deviceCodeAnswer,
  errorAnswer,
  failNetwork,
  hangForever,
  microsoftServer,
  outageAnswer,
  tokensAnswer,
} from './mail.microsoftIdentity.mock.ts';
import {
  acceptedAnswer,
  answerSendMail,
  expiredTokenAnswer,
  failGraphNetwork,
  graphErrorAnswer,
  throttledAnswer,
} from './mail.microsoftGraph.mock.ts';
import { mailRepository, type MailConnection } from './mail.repository.ts';
import { connectMail, getMailStatus, refreshMailToken, sendMail } from './mail.service.ts';

// Everything the mail module logs, kept so a test can prove no token is in it; and an env a test can change.
const { logCalls, testEnv } = vi.hoisted(() => ({
  logCalls: [] as unknown[],
  testEnv: { MICROSOFT_CLIENT_ID: '' },
}));

vi.mock('../../config/env.ts', () => ({ env: testEnv }));

vi.mock('../../lib/logger.ts', () => {
  const record = (...args: unknown[]) => {
    logCalls.push(args);
  };
  const recordingLogger = {
    trace: record,
    debug: record,
    info: record,
    warn: record,
    error: record,
    fatal: record,
    child: () => recordingLogger,
  };

  return { logger: recordingLogger };
});

vi.mock('./mail.repository.ts', () => ({
  mailRepository: {
    hasConnection: vi.fn(),
    findConnection: vi.fn(),
    replaceConnection: vi.fn(),
    updateConnection: vi.fn(),
    deleteConnection: vi.fn(),
  },
}));

const CLIENT_ID = '5c1b2e8a-3f4d-4e6b-9a7c-2d8e1f0a4b6c';
const SECOND_MS = 1000;
const MINUTE_MS = 60 * SECOND_MS;
const MAIL_SCOPES = 'https://graph.microsoft.com/Mail.Send offline_access';
const STORED_REFRESH_TOKEN = 'stored-refresh-token';
const STORED_ACCESS_TOKEN = 'stored-access-token';
const PROVIDER_EMAIL = 'readings@water-provider.example';
// The phone's cap on a photo: 4,000,000 bytes once base64 adds a third, so with the rest of the mail it is over the
// 4,000,000-byte request limit.
const LARGEST_PHOTO_BYTES = 3_000_000;
const READING_MAIL = { to: PROVIDER_EMAIL, subject: 'test', body: 'Date: 31 October 2026\nReading: 00123' };

function storedConnection(accessTokenExpiresAt: Date): MailConnection {
  return { refreshToken: STORED_REFRESH_TOKEN, accessToken: STORED_ACCESS_TOKEN, accessTokenExpiresAt };
}

function minutesFromNow(minutes: number): Date {
  return new Date(Date.now() + minutes * MINUTE_MS);
}

// The repository as a tiny in-memory store: a refresh's saved tokens are what the next read finds.
function storeConnection(connection: MailConnection): void {
  let stored: MailConnection | undefined = connection;

  vi.mocked(mailRepository.findConnection).mockImplementation(async () => stored);
  vi.mocked(mailRepository.updateConnection).mockImplementation(async (_previousRefreshToken, refreshed) => {
    stored = refreshed;
  });
  vi.mocked(mailRepository.deleteConnection).mockImplementation(async () => {
    stored = undefined;
  });
}

function loggedText(): string {
  return inspect(logCalls, { depth: null });
}

beforeAll(() => {
  microsoftServer.listen({ onUnhandledFrame: 'error' });
});

beforeEach(() => {
  testEnv.MICROSOFT_CLIENT_ID = CLIENT_ID;
});

afterEach(() => {
  microsoftServer.resetHandlers();
  logCalls.length = 0;
});

afterAll(() => {
  microsoftServer.close();
});

describe('connectMail', () => {
  it('shows the code and the address, then saves the tokens when the user approves', async () => {
    const deviceCodeForms = answerDeviceCode();
    const tokenForms = answerToken(errorAnswer('authorization_pending'), tokensAnswer());
    const showPrompt = vi.fn();
    const startedAt = Date.now();

    await connectMail(showPrompt);

    expect(showPrompt).toHaveBeenCalledWith({ userCode: TEST_USER_CODE, verificationUri: TEST_VERIFICATION_URI });
    expect(deviceCodeForms).toEqual([{ client_id: CLIENT_ID, scope: MAIL_SCOPES }]);
    expect(tokenForms).toHaveLength(2);
    expect(tokenForms[1]).toEqual({
      grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
      client_id: CLIENT_ID,
      device_code: TEST_DEVICE_CODE,
    });
    const saved = vi.mocked(mailRepository.replaceConnection).mock.calls[0]?.[0];
    expect(saved).toMatchObject({ refreshToken: TEST_REFRESH_TOKEN, accessToken: TEST_ACCESS_TOKEN });
    const lifetimeMs = (saved?.accessTokenExpiresAt.getTime() ?? 0) - startedAt;
    expect(lifetimeMs).toBeGreaterThanOrEqual(ACCESS_TOKEN_LIFETIME_SECONDS * SECOND_MS);
    expect(lifetimeMs).toBeLessThan((ACCESS_TOKEN_LIFETIME_SECONDS + 5) * SECOND_MS);
  });

  it('keeps asking when Microsoft says to slow down', async () => {
    answerDeviceCode();
    const tokenForms = answerToken(errorAnswer('slow_down'), tokensAnswer());

    await connectMail(vi.fn());

    expect(tokenForms).toHaveLength(2);
    expect(mailRepository.replaceConnection).toHaveBeenCalledTimes(1);
  }, 10_000);

  it('keeps asking when Microsoft has a passing outage', async () => {
    answerDeviceCode();
    const tokenForms = answerToken(outageAnswer(), errorAnswer('temporarily_unavailable'), tokensAnswer());

    await connectMail(vi.fn());

    expect(tokenForms).toHaveLength(3);
    expect(mailRepository.replaceConnection).toHaveBeenCalledTimes(1);
  });

  it('stops with MICROSOFT_UNREACHABLE when Microsoft never answers and the wait is cut short', async () => {
    hangForever(DEVICE_CODE_URL);
    const stop = new AbortController();

    const connecting = connectMail(vi.fn(), stop.signal);
    stop.abort();

    await expect(connecting).rejects.toMatchObject({ code: 'MICROSOFT_UNREACHABLE' });
  });

  it('throws MAIL_NOT_CONFIGURED, asking Microsoft nothing, when MICROSOFT_CLIENT_ID is not set', async () => {
    testEnv.MICROSOFT_CLIENT_ID = '';

    await expect(connectMail(vi.fn())).rejects.toMatchObject({ code: 'MAIL_NOT_CONFIGURED' });
  });

  it('throws MAIL_CONNECT_DECLINED and saves nothing when the user declines', async () => {
    answerDeviceCode();
    answerToken(errorAnswer('authorization_declined'));

    const connecting = connectMail(vi.fn());

    await expect(connecting).rejects.toMatchObject({ code: 'MAIL_CONNECT_DECLINED' });
    expect(mailRepository.replaceConnection).not.toHaveBeenCalled();
  });

  it('throws MAIL_CONNECT_EXPIRED when the code runs out before anyone approves it', async () => {
    answerDeviceCode();
    answerToken(errorAnswer('expired_token'));

    await expect(connectMail(vi.fn())).rejects.toMatchObject({ code: 'MAIL_CONNECT_EXPIRED' });
  });

  it('throws MAIL_CONNECT_EXPIRED when the code lifetime passes while still pending', async () => {
    answerDeviceCode(deviceCodeAnswer({ expires_in: 0 }));
    answerToken(errorAnswer('authorization_pending'));

    await expect(connectMail(vi.fn())).rejects.toMatchObject({ code: 'MAIL_CONNECT_EXPIRED' });
  });

  it('throws MICROSOFT_SIGN_IN_FAILED, naming the reason, when Microsoft refuses to start the sign-in', async () => {
    answerDeviceCode(errorAnswer('unauthorized_client'));
    const showPrompt = vi.fn();

    const connecting = connectMail(showPrompt);

    await expect(connecting).rejects.toBeInstanceOf(AppError);
    await expect(connecting).rejects.toMatchObject({ code: 'MICROSOFT_SIGN_IN_FAILED' });
    await expect(connecting).rejects.toThrow('unauthorized_client');
    expect(showPrompt).not.toHaveBeenCalled();
  });

  it('throws MICROSOFT_UNREACHABLE when Microsoft cannot be reached', async () => {
    failNetwork(DEVICE_CODE_URL);

    await expect(connectMail(vi.fn())).rejects.toMatchObject({ code: 'MICROSOFT_UNREACHABLE' });
  });

  it('never logs a token or the device code when the sign-in succeeds', async () => {
    answerDeviceCode();
    answerToken(tokensAnswer());

    await connectMail(vi.fn());

    expect(loggedText()).not.toContain(TEST_ACCESS_TOKEN);
    expect(loggedText()).not.toContain(TEST_REFRESH_TOKEN);
    expect(loggedText()).not.toContain(TEST_DEVICE_CODE);
  });
});

describe('refreshMailToken', () => {
  it('saves new tokens over the old ones when Microsoft accepts the stored refresh token', async () => {
    vi.mocked(mailRepository.findConnection).mockResolvedValueOnce(storedConnection(minutesFromNow(30)));
    const tokenForms = answerToken(tokensAnswer());

    await refreshMailToken();

    expect(tokenForms).toEqual([
      {
        grant_type: 'refresh_token',
        client_id: CLIENT_ID,
        refresh_token: STORED_REFRESH_TOKEN,
        scope: MAIL_SCOPES,
      },
    ]);
    const [previousRefreshToken, saved] = vi.mocked(mailRepository.updateConnection).mock.calls[0] ?? [];
    expect(previousRefreshToken).toBe(STORED_REFRESH_TOKEN);
    expect(saved).toMatchObject({ refreshToken: TEST_REFRESH_TOKEN, accessToken: TEST_ACCESS_TOKEN });
    expect(saved?.accessTokenExpiresAt.getTime()).toBeGreaterThan(Date.now());
  });

  it('keeps the old refresh token when Microsoft sends no new one', async () => {
    vi.mocked(mailRepository.findConnection).mockResolvedValueOnce(storedConnection(minutesFromNow(30)));
    answerToken(tokensAnswer({ refresh_token: undefined }));

    await refreshMailToken();

    expect(mailRepository.updateConnection).toHaveBeenCalledWith(
      STORED_REFRESH_TOKEN,
      expect.objectContaining({ refreshToken: STORED_REFRESH_TOKEN, accessToken: TEST_ACCESS_TOKEN }),
    );
  });

  it.each(['invalid_grant', 'interaction_required', 'invalid_client', 'unauthorized_client'])(
    'removes the connection when Microsoft refuses the refresh token with %s',
    async (error) => {
      vi.mocked(mailRepository.findConnection).mockResolvedValueOnce(storedConnection(minutesFromNow(30)));
      answerToken(errorAnswer(error));

      await refreshMailToken();

      expect(mailRepository.deleteConnection).toHaveBeenCalledWith(STORED_REFRESH_TOKEN);
      expect(mailRepository.updateConnection).not.toHaveBeenCalled();
    },
  );

  it('keeps the connection, without throwing, when Microsoft cannot be reached', async () => {
    vi.mocked(mailRepository.findConnection).mockResolvedValueOnce(storedConnection(minutesFromNow(30)));
    failNetwork(TOKEN_URL);

    await refreshMailToken();

    expect(mailRepository.deleteConnection).not.toHaveBeenCalled();
    expect(mailRepository.updateConnection).not.toHaveBeenCalled();
  });

  it('keeps the connection when Microsoft answers with a server error', async () => {
    vi.mocked(mailRepository.findConnection).mockResolvedValueOnce(storedConnection(minutesFromNow(30)));
    answerToken(outageAnswer());

    await refreshMailToken();

    expect(mailRepository.deleteConnection).not.toHaveBeenCalled();
  });

  it('keeps the connection when Microsoft never answers and the server shuts down', async () => {
    vi.mocked(mailRepository.findConnection).mockResolvedValueOnce(storedConnection(minutesFromNow(30)));
    hangForever(TOKEN_URL);
    const shutdown = new AbortController();

    const refreshing = refreshMailToken(shutdown.signal);
    shutdown.abort();
    await refreshing;

    expect(mailRepository.deleteConnection).not.toHaveBeenCalled();
    expect(mailRepository.updateConnection).not.toHaveBeenCalled();
  });

  it('asks Microsoft nothing when Hotmail is not connected', async () => {
    vi.mocked(mailRepository.findConnection).mockResolvedValueOnce(undefined);

    await refreshMailToken();

    expect(mailRepository.updateConnection).not.toHaveBeenCalled();
  });

  it('never logs a token when Microsoft refuses the refresh', async () => {
    vi.mocked(mailRepository.findConnection).mockResolvedValueOnce(storedConnection(minutesFromNow(30)));
    answerToken(errorAnswer('invalid_grant'));

    await refreshMailToken();

    expect(loggedText()).not.toContain(STORED_REFRESH_TOKEN);
    expect(loggedText()).not.toContain(STORED_ACCESS_TOKEN);
  });
});

describe('getMailStatus', () => {
  it('answers connected when the server holds a connection', async () => {
    vi.mocked(mailRepository.hasConnection).mockResolvedValueOnce(true);

    expect(await getMailStatus()).toEqual({ state: 'connected' });
  });

  it('answers notConnected when yarn mail:connect has not run, or a refused token was removed', async () => {
    vi.mocked(mailRepository.hasConnection).mockResolvedValueOnce(false);

    expect(await getMailStatus()).toEqual({ state: 'notConnected' });
  });

  it('answers notConnected when MICROSOFT_CLIENT_ID is not set, even with a stored connection', async () => {
    testEnv.MICROSOFT_CLIENT_ID = '';
    vi.mocked(mailRepository.hasConnection).mockResolvedValueOnce(true);

    expect(await getMailStatus()).toEqual({ state: 'notConnected' });
  });
});

describe('sendMail', () => {
  it('sends the mail through Graph with the stored token when the token is still fresh', async () => {
    vi.mocked(mailRepository.findConnection).mockResolvedValue(storedConnection(minutesFromNow(30)));
    const received = answerSendMail();

    await sendMail(READING_MAIL);

    expect(received).toEqual([
      {
        authorization: `Bearer ${STORED_ACCESS_TOKEN}`,
        body: {
          message: {
            subject: 'test',
            body: { contentType: 'Text', content: 'Date: 31 October 2026\nReading: 00123' },
            toRecipients: [{ emailAddress: { address: PROVIDER_EMAIL } }],
            attachments: [],
          },
          saveToSentItems: true,
        },
      },
    ]);
  });

  it('refreshes the token first, then sends with the new one, when the stored token runs out within minutes', async () => {
    storeConnection(storedConnection(minutesFromNow(2)));
    const tokenForms = answerToken(tokensAnswer());
    const received = answerSendMail();

    await sendMail(READING_MAIL);

    expect(tokenForms).toHaveLength(1);
    expect(received[0]?.authorization).toBe(`Bearer ${TEST_ACCESS_TOKEN}`);
    expect(mailRepository.updateConnection).toHaveBeenCalledWith(
      STORED_REFRESH_TOKEN,
      expect.objectContaining({ accessToken: TEST_ACCESS_TOKEN }),
    );
  });

  it('refreshes once, not once per mail, when two mails go out at the same time with a stale token', async () => {
    storeConnection(storedConnection(minutesFromNow(-5)));
    const tokenForms = answerToken(tokensAnswer());
    const received = answerSendMail();

    await Promise.all([sendMail(READING_MAIL), sendMail(READING_MAIL)]);

    expect(tokenForms).toHaveLength(1);
    expect(received.map((request) => request.authorization)).toEqual([
      `Bearer ${TEST_ACCESS_TOKEN}`,
      `Bearer ${TEST_ACCESS_TOKEN}`,
    ]);
  });

  it('shares the refresh the timer already started instead of starting a second one', async () => {
    storeConnection(storedConnection(minutesFromNow(-5)));
    const tokenForms = answerToken(tokensAnswer());
    answerSendMail();

    await Promise.all([refreshMailToken(), sendMail(READING_MAIL)]);

    expect(tokenForms).toHaveLength(1);
  });

  it('throws MAIL_NOT_CONNECTED, asking Microsoft nothing, when Hotmail is not connected', async () => {
    vi.mocked(mailRepository.findConnection).mockResolvedValue(undefined);
    const received = answerSendMail();

    await expect(sendMail(READING_MAIL)).rejects.toMatchObject({ code: 'MAIL_NOT_CONNECTED' });
    expect(received).toEqual([]);
  });

  it('throws MAIL_NOT_CONNECTED and sends nothing when Microsoft refuses the refresh token', async () => {
    storeConnection(storedConnection(minutesFromNow(-5)));
    answerToken(errorAnswer('invalid_grant'));
    const received = answerSendMail();

    await expect(sendMail(READING_MAIL)).rejects.toMatchObject({ code: 'MAIL_NOT_CONNECTED' });
    expect(received).toEqual([]);
    expect(mailRepository.deleteConnection).toHaveBeenCalledWith(STORED_REFRESH_TOKEN);
  });

  it('throws MICROSOFT_UNREACHABLE and sends nothing when the stale token cannot be refreshed', async () => {
    storeConnection(storedConnection(minutesFromNow(-5)));
    answerToken(outageAnswer());
    const received = answerSendMail();

    await expect(sendMail(READING_MAIL)).rejects.toMatchObject({ code: 'MICROSOFT_UNREACHABLE' });
    expect(received).toEqual([]);
  });

  it('attaches the photo as a base64 file when the mail has one', async () => {
    vi.mocked(mailRepository.findConnection).mockResolvedValue(storedConnection(minutesFromNow(30)));
    const received = answerSendMail();
    const contents = Buffer.from('a tiny jpeg');

    await sendMail({
      ...READING_MAIL,
      attachment: { name: 'meter-2026-10-31.jpg', contentType: 'image/jpeg', contents },
    });

    expect(received[0]?.body).toMatchObject({
      message: {
        attachments: [
          {
            '@odata.type': '#microsoft.graph.fileAttachment',
            name: 'meter-2026-10-31.jpg',
            contentType: 'image/jpeg',
            contentBytes: contents.toString('base64'),
          },
        ],
      },
    });
  });

  it('throws MAIL_TOO_LARGE, asking Microsoft nothing, when the encoded mail is over Graph limit', async () => {
    vi.mocked(mailRepository.findConnection).mockResolvedValue(storedConnection(minutesFromNow(30)));
    const received = answerSendMail();
    const contents = Buffer.alloc(LARGEST_PHOTO_BYTES);

    const sending = sendMail({
      ...READING_MAIL,
      attachment: { name: 'meter.jpg', contentType: 'image/jpeg', contents },
    });

    await expect(sending).rejects.toMatchObject({ code: 'MAIL_TOO_LARGE' });
    expect(received).toEqual([]);
  });

  it("throws MAIL_REFUSED naming Graph's code, never Graph's message, when Graph refuses the mail", async () => {
    vi.mocked(mailRepository.findConnection).mockResolvedValue(storedConnection(minutesFromNow(30)));
    answerSendMail(graphErrorAnswer('ErrorInvalidRecipients'));

    const sending = sendMail(READING_MAIL);

    await expect(sending).rejects.toMatchObject({ code: 'MAIL_REFUSED' });
    await expect(sending).rejects.toThrow('ErrorInvalidRecipients');
    await expect(sending).rejects.not.toThrow(PROVIDER_EMAIL);
  });

  it('refreshes the token once and sends again when Graph does not take a token that looked fresh', async () => {
    storeConnection(storedConnection(minutesFromNow(30)));
    const tokenForms = answerToken(tokensAnswer());
    const received = answerSendMail(expiredTokenAnswer(), acceptedAnswer());

    await sendMail(READING_MAIL);

    expect(tokenForms).toHaveLength(1);
    expect(received.map((request) => request.authorization)).toEqual([
      `Bearer ${STORED_ACCESS_TOKEN}`,
      `Bearer ${TEST_ACCESS_TOKEN}`,
    ]);
  });

  it('throws MAIL_TOKEN_REJECTED when Graph does not take the token even after a refresh', async () => {
    storeConnection(storedConnection(minutesFromNow(30)));
    answerToken(tokensAnswer());
    const received = answerSendMail(expiredTokenAnswer());

    await expect(sendMail(READING_MAIL)).rejects.toMatchObject({ code: 'MAIL_TOKEN_REJECTED' });
    expect(received).toHaveLength(2);
  });

  it('throws MAIL_NOT_CONNECTED when Graph does not take the token and Microsoft refuses the refresh', async () => {
    storeConnection(storedConnection(minutesFromNow(30)));
    answerToken(errorAnswer('invalid_grant'));
    answerSendMail(expiredTokenAnswer());

    await expect(sendMail(READING_MAIL)).rejects.toMatchObject({ code: 'MAIL_NOT_CONNECTED' });
  });

  it('throws MAIL_SERVICE_BUSY when Graph is throttling', async () => {
    vi.mocked(mailRepository.findConnection).mockResolvedValue(storedConnection(minutesFromNow(30)));
    answerSendMail(throttledAnswer());

    await expect(sendMail(READING_MAIL)).rejects.toMatchObject({ code: 'MAIL_SERVICE_BUSY' });
  });

  it('throws MICROSOFT_UNREACHABLE when Graph cannot be reached', async () => {
    vi.mocked(mailRepository.findConnection).mockResolvedValue(storedConnection(minutesFromNow(30)));
    failGraphNetwork();

    await expect(sendMail(READING_MAIL)).rejects.toMatchObject({ code: 'MICROSOFT_UNREACHABLE' });
  });

  it('never logs the token, the address or the body when a mail is sent', async () => {
    storeConnection(storedConnection(minutesFromNow(-5)));
    answerToken(tokensAnswer());
    answerSendMail();

    await sendMail(READING_MAIL);

    expect(loggedText()).not.toContain(TEST_ACCESS_TOKEN);
    expect(loggedText()).not.toContain(PROVIDER_EMAIL);
    expect(loggedText()).not.toContain('00123');
  });
});
