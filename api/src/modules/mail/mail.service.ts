// The Hotmail connection (ADR 0001): made once with yarn mail:connect, then kept alive by the server itself.
import { setTimeout as sleep } from 'node:timers/promises';
import { env } from '../../config/env.ts';
import { getErrorLogFields } from '../../lib/databaseErrors.ts';
import { AppError } from '../../lib/errors.ts';
import { logger } from '../../lib/logger.ts';
import {
  TEMPORARILY_UNAVAILABLE,
  microsoftRefused,
  microsoftUnreachable,
  redeemDeviceCode,
  redeemRefreshToken,
  requestDeviceCode,
  type DeviceCode,
  type MicrosoftTokens,
} from './mail.microsoftIdentity.ts';
import { mailRepository, type MailConnection } from './mail.repository.ts';
import type { MailState, MailStatusResponse } from './mail.schema.ts';

const SECOND_MS = 1000;
// RFC 8628 §3.5: on slow_down, wait this much longer between polls from then on.
const SLOW_DOWN_EXTRA_SECONDS = 5;
// The token endpoint's answers while the user has not approved yet, and how many seconds each adds to the wait. A
// passing Microsoft outage just means asking again.
const KEEP_WAITING_ERRORS: Record<string, number> = {
  authorization_pending: 0,
  slow_down: SLOW_DOWN_EXTRA_SECONDS,
  [TEMPORARILY_UNAVAILABLE]: 0,
};
const EXPIRED_TOKEN_ERROR = 'expired_token';

const CONNECTED: MailState = 'connected';
const NOT_CONNECTED: MailState = 'notConnected';

// Device sign-in errors that are the user's doing, with what to tell them. Any other one is microsoftRefused.
const DEVICE_LOGIN_FAILURES: Record<string, { code: string; message: string }> = {
  authorization_declined: {
    code: 'MAIL_CONNECT_DECLINED',
    message: 'The sign-in was declined on the Microsoft page. Run yarn mail:connect again',
  },
  [EXPIRED_TOKEN_ERROR]: {
    code: 'MAIL_CONNECT_EXPIRED',
    message: 'The code expired before it was approved. Run yarn mail:connect again',
  },
};

const log = logger.child({ module: 'mail' });

// What yarn mail:connect shows the user: where to go and what to type.
export type DeviceLoginPrompt = { userCode: string; verificationUri: string };

function requireClientId(): string {
  if (env.MICROSOFT_CLIENT_ID) return env.MICROSOFT_CLIENT_ID;

  throw new AppError('MICROSOFT_CLIENT_ID is not set. Register the app first (README, "Connecting Hotmail")', {
    code: 'MAIL_NOT_CONFIGURED',
  });
}

function deviceLoginFailure(error: string): AppError {
  const failure = DEVICE_LOGIN_FAILURES[error];

  if (!failure) return microsoftRefused(error);

  return new AppError(failure.message, { code: failure.code });
}

// The row to save for new tokens. A refresh may come back without a refresh token: the old one then stays.
function toConnection(tokens: MicrosoftTokens, previousRefreshToken: string): MailConnection {
  return {
    refreshToken: tokens.refreshToken ?? previousRefreshToken,
    accessToken: tokens.accessToken,
    accessTokenExpiresAt: new Date(Date.now() + tokens.expiresInSeconds * SECOND_MS),
  };
}

// Polls the token endpoint at Microsoft's pace until the user approves, declines, or the code runs out.
async function waitForApproval(clientId: string, deviceCode: DeviceCode, signal?: AbortSignal) {
  const deadline = Date.now() + deviceCode.expiresInSeconds * SECOND_MS;
  let intervalSeconds = deviceCode.intervalSeconds;

  while (Date.now() < deadline) {
    await sleep(intervalSeconds * SECOND_MS, undefined, { signal });

    const answer = await redeemDeviceCode(clientId, deviceCode.deviceCode, signal);

    if ('tokens' in answer) return answer.tokens;

    const extraWaitSeconds = KEEP_WAITING_ERRORS[answer.error];

    if (extraWaitSeconds === undefined) throw deviceLoginFailure(answer.error);

    intervalSeconds += extraWaitSeconds;
  }

  throw deviceLoginFailure(EXPIRED_TOKEN_ERROR);
}

// yarn mail:connect: the device-code sign-in. Shows the code, waits for the user to approve it on another device,
// then saves the tokens in place of any old connection.
export async function connectMail(
  showPrompt: (prompt: DeviceLoginPrompt) => void,
  signal?: AbortSignal,
): Promise<void> {
  const clientId = requireClientId();
  const deviceCode = await requestDeviceCode(clientId, signal);

  showPrompt({ userCode: deviceCode.userCode, verificationUri: deviceCode.verificationUri });

  const tokens = await waitForApproval(clientId, deviceCode, signal);

  if (!tokens.refreshToken) throw microsoftRefused('no refresh token: is offline_access granted?');

  await mailRepository.replaceConnection(toConnection(tokens, tokens.refreshToken));
  log.info('Hotmail connected');
}

// Whether the server can send mail: it holds a connection, and the app it signs in through is configured. A revoked
// token is noticed by the next refresh, which removes it.
export async function getMailStatus(): Promise<MailStatusResponse> {
  const hasClientId = env.MICROSOFT_CLIENT_ID !== '';
  const hasConnection = hasClientId && (await mailRepository.hasConnection());

  return { state: hasConnection ? CONNECTED : NOT_CONNECTED };
}

// Microsoft refused the refresh token. A passing outage is retried next round; any other refusal (revoked, expired,
// or the app registration broken) means it will never work again, so the connection goes and the banner shows.
async function dropRefusedConnection(connection: MailConnection, error: string): Promise<void> {
  if (error === TEMPORARILY_UNAVAILABLE) throw microsoftUnreachable();

  await mailRepository.deleteConnection(connection.refreshToken);
  log.warn({ reason: error }, 'Hotmail token refused: disconnected, run yarn mail:connect');
}

async function refreshConnection(connection: MailConnection, signal?: AbortSignal): Promise<void> {
  const answer = await redeemRefreshToken(requireClientId(), connection.refreshToken, signal);

  if ('error' in answer) return dropRefusedConnection(connection, answer.error);

  await mailRepository.updateConnection(connection.refreshToken, toConnection(answer.tokens, connection.refreshToken));
  log.debug('Hotmail token refreshed');
}

// The server's own refresh, on a timer (server.ts): trades the refresh token for new tokens and saves them, so it
// never lapses between readings, and notices a revoked one. Never throws: a failure is logged and the next round
// tries again.
export async function refreshMailToken(signal?: AbortSignal): Promise<void> {
  try {
    const connection = await mailRepository.findConnection();

    if (!connection) return;

    await refreshConnection(connection, signal);
  } catch (error: unknown) {
    log.warn(getErrorLogFields(error), 'Hotmail token refresh failed; trying again on the next round');
  }
}
