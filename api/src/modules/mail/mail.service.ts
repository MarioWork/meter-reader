// The Hotmail connection (ADR 0001): made once with yarn mail:connect, then kept alive by the server itself.
import { setTimeout as sleep } from 'node:timers/promises';
import { env } from '../../config/env.ts';
import { getErrorLogFields } from '../../lib/databaseErrors.ts';
import { AppError } from '../../lib/errors.ts';
import { ConflictError } from '../../lib/httpErrors.ts';
import { logger } from '../../lib/logger.ts';
import {
  redeemDeviceCode,
  redeemRefreshToken,
  requestDeviceCode,
  type DeviceCode,
  type MicrosoftTokens,
} from './mail.microsoftIdentity.ts';
import { mailRepository, type MailConnection } from './mail.repository.ts';
import type { MailStatusResponse } from './mail.schema.ts';

const SECOND_MS = 1000;
// A stored access token counts as spent this long before Microsoft's expiry, so a send never starts on a dying one.
const ACCESS_TOKEN_MARGIN_MS = 5 * 60 * SECOND_MS;
// RFC 8628 §3.5: on slow_down, wait this much longer between polls from then on.
const SLOW_DOWN_EXTRA_SECONDS = 5;
// The token endpoint's answers while the user has not approved yet, and how many seconds each adds to the wait.
const KEEP_WAITING_ERRORS: Record<string, number> = {
  authorization_pending: 0,
  slow_down: SLOW_DOWN_EXTRA_SECONDS,
};
// Refresh errors that mean the refresh token is dead for good: revoked, expired, or the user must sign in again.
const REFUSED_REFRESH_ERRORS = new Set(['invalid_grant', 'interaction_required']);

const DECLINED_MESSAGE = 'The sign-in was declined on the Microsoft page. Run yarn mail:connect again';
const EXPIRED_MESSAGE = 'The code expired before it was approved. Run yarn mail:connect again';
const NOT_CONNECTED_MESSAGE = 'Hotmail is not connected. Run yarn mail:connect on the server';

// Device sign-in errors that end the wait, with what to tell the user.
const DEVICE_LOGIN_FAILURES: Record<string, { code: string; message: string }> = {
  authorization_declined: { code: 'MAIL_CONNECT_DECLINED', message: DECLINED_MESSAGE },
  expired_token: { code: 'MAIL_CONNECT_EXPIRED', message: EXPIRED_MESSAGE },
};

const log = logger.child({ module: 'mail' });

// What yarn mail:connect shows the user: where to go and what to type.
export type DeviceLoginPrompt = { userCode: string; verificationUri: string };

let refreshInFlight: Promise<string | undefined> | undefined;

function requireClientId(): string {
  if (env.MICROSOFT_CLIENT_ID) return env.MICROSOFT_CLIENT_ID;

  throw new AppError('MICROSOFT_CLIENT_ID is not set. Register the app first (README, "Connecting Hotmail")', {
    code: 'MAIL_NOT_CONFIGURED',
  });
}

function notConnected(): ConflictError {
  return new ConflictError(NOT_CONNECTED_MESSAGE, 'MAIL_NOT_CONNECTED');
}

function expiresAt(tokens: MicrosoftTokens): Date {
  return new Date(Date.now() + tokens.expiresInSeconds * SECOND_MS);
}

function deviceLoginFailure(error: string): AppError {
  const failure = DEVICE_LOGIN_FAILURES[error];

  if (failure) return new AppError(failure.message, { code: failure.code });

  return new AppError(`Microsoft refused the sign-in (${error}). Run yarn mail:connect again`, {
    code: 'MICROSOFT_SIGN_IN_FAILED',
  });
}

// Polls the token endpoint at Microsoft's pace until the user approves, declines, or the code runs out.
async function waitForApproval(clientId: string, deviceCode: DeviceCode): Promise<MicrosoftTokens> {
  const deadline = Date.now() + deviceCode.expiresInSeconds * SECOND_MS;
  let intervalSeconds = deviceCode.intervalSeconds;

  while (Date.now() < deadline) {
    await sleep(intervalSeconds * SECOND_MS);

    const answer = await redeemDeviceCode(clientId, deviceCode.deviceCode);

    if ('tokens' in answer) return answer.tokens;

    const extraWaitSeconds = KEEP_WAITING_ERRORS[answer.error];

    if (extraWaitSeconds === undefined) throw deviceLoginFailure(answer.error);

    intervalSeconds += extraWaitSeconds;
  }

  throw new AppError(EXPIRED_MESSAGE, { code: 'MAIL_CONNECT_EXPIRED' });
}

// yarn mail:connect: the device-code sign-in. Shows the code, waits for the user to approve it on another device,
// then saves the tokens in place of any old connection.
export async function connectMail(showPrompt: (prompt: DeviceLoginPrompt) => void): Promise<void> {
  const clientId = requireClientId();
  const deviceCode = await requestDeviceCode(clientId);

  showPrompt({ userCode: deviceCode.userCode, verificationUri: deviceCode.verificationUri });

  const tokens = await waitForApproval(clientId, deviceCode);

  if (!tokens.refreshToken) {
    throw new AppError('Microsoft sent no refresh token. Check the app asks for offline_access (README)', {
      code: 'MICROSOFT_SIGN_IN_FAILED',
    });
  }

  await mailRepository.replaceConnection({
    refreshToken: tokens.refreshToken,
    accessToken: tokens.accessToken,
    accessTokenExpiresAt: expiresAt(tokens),
  });
  log.info('Hotmail connected');
}

// A refresh Microsoft refused: the connection is dead, so it goes, and the web app shows "not connected". Any other
// refusal (a broken app registration) leaves it alone: it is not the token's fault.
async function handleRefusedRefresh(connection: MailConnection, error: string): Promise<undefined> {
  if (!REFUSED_REFRESH_ERRORS.has(error)) {
    throw new AppError(`Microsoft refused the token refresh (${error})`, { code: 'MICROSOFT_SIGN_IN_FAILED' });
  }

  await mailRepository.deleteConnection(connection.refreshToken);
  log.warn({ reason: error }, 'Hotmail token refused (revoked or expired): disconnected, run yarn mail:connect');

  return undefined;
}

// Trades the refresh token for new tokens and saves them. Returns the new access token, or undefined when Microsoft
// refused and the connection was removed.
async function refreshConnection(connection: MailConnection): Promise<string | undefined> {
  const answer = await redeemRefreshToken(requireClientId(), connection.refreshToken);

  if ('error' in answer) return handleRefusedRefresh(connection, answer.error);

  const { tokens } = answer;

  await mailRepository.updateConnection(connection.refreshToken, {
    refreshToken: tokens.refreshToken ?? connection.refreshToken,
    accessToken: tokens.accessToken,
    accessTokenExpiresAt: expiresAt(tokens),
  });
  log.debug('Hotmail token refreshed');

  return tokens.accessToken;
}

// One refresh at a time: callers that arrive while one runs share its result instead of spending the token twice.
async function refreshConnectionOnce(connection: MailConnection): Promise<string | undefined> {
  refreshInFlight ??= refreshConnection(connection);

  try {
    return await refreshInFlight;
  } finally {
    refreshInFlight = undefined;
  }
}

// Whether the server holds a Hotmail connection. A revoked one is noticed by the next refresh, which removes it.
export async function getMailStatus(): Promise<MailStatusResponse> {
  const isConnected = await mailRepository.hasConnection();

  return { state: isConnected ? 'connected' : 'notConnected' };
}

// The server's own refresh, on a timer (server.ts): keeps the refresh token in use so it never lapses between
// readings, and notices a revoked one. Never throws: a failure is logged and the next round tries again.
export async function refreshMailToken(): Promise<void> {
  try {
    const connection = await mailRepository.findConnection();

    if (!connection) return;

    await refreshConnectionOnce(connection);
  } catch (error: unknown) {
    log.warn(getErrorLogFields(error), 'Hotmail token refresh failed; trying again on the next round');
  }
}

// The bearer token for Graph's sendMail: the stored one while fresh, a refreshed one otherwise.
export async function getAccessToken(): Promise<string> {
  const connection = await mailRepository.findConnection();

  if (!connection) throw notConnected();

  const isFresh = connection.accessTokenExpiresAt.getTime() - ACCESS_TOKEN_MARGIN_MS > Date.now();

  if (isFresh) return connection.accessToken;

  const accessToken = await refreshConnectionOnce(connection);

  if (!accessToken) throw notConnected();

  return accessToken;
}
