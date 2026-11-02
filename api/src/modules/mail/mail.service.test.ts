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
  microsoftIdentityServer,
  outageAnswer,
  tokensAnswer,
} from './mail.microsoftIdentity.mock.ts';
import { mailRepository, type MailConnection } from './mail.repository.ts';
import { connectMail, getMailStatus, refreshMailToken } from './mail.service.ts';

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

function storedConnection(accessTokenExpiresAt: Date): MailConnection {
  return { refreshToken: STORED_REFRESH_TOKEN, accessToken: STORED_ACCESS_TOKEN, accessTokenExpiresAt };
}

function minutesFromNow(minutes: number): Date {
  return new Date(Date.now() + minutes * MINUTE_MS);
}

function loggedText(): string {
  return inspect(logCalls, { depth: null });
}

beforeAll(() => {
  microsoftIdentityServer.listen({ onUnhandledFrame: 'error' });
});

beforeEach(() => {
  testEnv.MICROSOFT_CLIENT_ID = CLIENT_ID;
});

afterEach(() => {
  microsoftIdentityServer.resetHandlers();
  logCalls.length = 0;
});

afterAll(() => {
  microsoftIdentityServer.close();
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
