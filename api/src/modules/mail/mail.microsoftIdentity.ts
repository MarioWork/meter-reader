// Microsoft's sign-in service (identity platform v2.0) for personal accounts (Hotmail, Outlook.com): the device-code
// sign-in yarn mail:connect runs, and the token refresh the server runs by itself (ADR 0001). No client secret: the
// app is registered as a public client. Nothing here logs, and no error carries a token or a response body.
import { z } from 'zod';
import { AppError } from '../../lib/errors.ts';

// `consumers`: personal Microsoft accounts only, never a work or school one.
const AUTHORITY_URL = 'https://login.microsoftonline.com/consumers/oauth2/v2.0';
export const DEVICE_CODE_URL = `${AUTHORITY_URL}/devicecode`;
export const TOKEN_URL = `${AUTHORITY_URL}/token`;
// Send-only (ADR 0001): Mail.Send cannot read, list or delete mail. offline_access adds the refresh token.
const MAIL_SCOPES = 'https://graph.microsoft.com/Mail.Send offline_access';
const DEVICE_CODE_GRANT = 'urn:ietf:params:oauth:grant-type:device_code';
const REFRESH_TOKEN_GRANT = 'refresh_token';
const REQUEST_TIMEOUT_MS = 10_000;
const FIRST_SUCCESS_STATUS = 200;
const FIRST_REDIRECT_STATUS = 300;
const FIRST_SERVER_ERROR_STATUS = 500;
// What a passing outage is reported as: Microsoft's own code for it. Every 5xx and `server_error` count as one too.
export const TEMPORARILY_UNAVAILABLE = 'temporarily_unavailable';
const PASSING_ERRORS = new Set([TEMPORARILY_UNAVAILABLE, 'server_error']);

const DeviceCodeAnswerSchema = z.object({
  device_code: z.string().min(1),
  user_code: z.string().min(1),
  verification_uri: z.url(),
  expires_in: z.number().int().nonnegative(),
  interval: z.number().int().nonnegative(),
});

const TokensAnswerSchema = z.object({
  access_token: z.string().min(1),
  // Always sent for offline_access; optional so a refresh without one keeps the old refresh token.
  refresh_token: z.string().min(1).optional(),
  expires_in: z.number().int().positive(),
});

// An OAuth error (RFC 6749 §5.2): `error` is the stable code; the description is for humans.
const ErrorAnswerSchema = z.object({ error: z.string().min(1) });

export type DeviceCode = {
  deviceCode: string;
  userCode: string;
  verificationUri: string;
  expiresInSeconds: number;
  intervalSeconds: number;
};

export type MicrosoftTokens = {
  accessToken: string;
  refreshToken: string | undefined;
  expiresInSeconds: number;
};

// What Microsoft said: the answer asked for, or the OAuth error code it refused with.
type MicrosoftAnswer<Data> = { data: Data } | { error: string };

export type TokenAnswer = { tokens: MicrosoftTokens } | { error: string };

type MicrosoftReply = { status: number; body: unknown };

export function microsoftUnreachable(cause?: unknown): AppError {
  return new AppError('Microsoft could not be reached. Check the network and try again', {
    code: 'MICROSOFT_UNREACHABLE',
    cause,
  });
}

// Microsoft said no for a reason that is not the user's doing: almost always the app registration (README).
export function microsoftRefused(reason: string): AppError {
  return new AppError(`Microsoft refused the sign-in (${reason}). Check the app registration (README)`, {
    code: 'MICROSOFT_SIGN_IN_FAILED',
  });
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    // A gateway error page, not JSON: the caller treats it as no answer
    return undefined;
  }
}

async function postForm(url: string, fields: Record<string, string>, signal?: AbortSignal): Promise<MicrosoftReply> {
  const timeout = AbortSignal.timeout(REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: 'POST',
      body: new URLSearchParams(fields),
      signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
    });

    return { status: response.status, body: await readJson(response) };
  } catch (error: unknown) {
    throw microsoftUnreachable(error);
  }
}

// The answer, or the OAuth error Microsoft refused with. A 5xx, or a passing error, reads as temporarily_unavailable;
// anything else (no body, a body of the wrong shape) means Microsoft could not really be reached.
function readAnswer<Data>(reply: MicrosoftReply, schema: z.ZodType<Data>): MicrosoftAnswer<Data> {
  const isServerError = reply.status >= FIRST_SERVER_ERROR_STATUS;
  const answer = schema.safeParse(reply.body);
  const isOk = reply.status >= FIRST_SUCCESS_STATUS && reply.status < FIRST_REDIRECT_STATUS;

  if (isOk && answer.success) return { data: answer.data };

  if (isServerError) return { error: TEMPORARILY_UNAVAILABLE };

  const refusal = ErrorAnswerSchema.safeParse(reply.body);

  if (!refusal.success) throw microsoftUnreachable();

  const isPassing = PASSING_ERRORS.has(refusal.data.error);

  return { error: isPassing ? TEMPORARILY_UNAVAILABLE : refusal.data.error };
}

function toTokenAnswer(reply: MicrosoftReply): TokenAnswer {
  const answer = readAnswer(reply, TokensAnswerSchema);

  if ('error' in answer) return answer;

  const { access_token, refresh_token, expires_in } = answer.data;

  return { tokens: { accessToken: access_token, refreshToken: refresh_token, expiresInSeconds: expires_in } };
}

// Starts a sign-in: Microsoft hands out a short code the user types at the verification address.
export async function requestDeviceCode(clientId: string, signal?: AbortSignal): Promise<DeviceCode> {
  const reply = await postForm(DEVICE_CODE_URL, { client_id: clientId, scope: MAIL_SCOPES }, signal);
  const answer = readAnswer(reply, DeviceCodeAnswerSchema);

  if ('error' in answer) {
    if (answer.error === TEMPORARILY_UNAVAILABLE) throw microsoftUnreachable();

    throw microsoftRefused(answer.error);
  }

  return {
    deviceCode: answer.data.device_code,
    userCode: answer.data.user_code,
    verificationUri: answer.data.verification_uri,
    expiresInSeconds: answer.data.expires_in,
    intervalSeconds: answer.data.interval,
  };
}

// One poll: tokens once the user approved, or why not yet (authorization_pending, slow_down) or not at all.
export async function redeemDeviceCode(
  clientId: string,
  deviceCode: string,
  signal?: AbortSignal,
): Promise<TokenAnswer> {
  const fields = { grant_type: DEVICE_CODE_GRANT, client_id: clientId, device_code: deviceCode };

  return toTokenAnswer(await postForm(TOKEN_URL, fields, signal));
}

export async function redeemRefreshToken(
  clientId: string,
  refreshToken: string,
  signal?: AbortSignal,
): Promise<TokenAnswer> {
  const fields = {
    grant_type: REFRESH_TOKEN_GRANT,
    client_id: clientId,
    refresh_token: refreshToken,
    scope: MAIL_SCOPES,
  };

  return toTokenAnswer(await postForm(TOKEN_URL, fields, signal));
}
