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

// What the token endpoint said: tokens, or the OAuth error code it refused with.
export type TokenAnswer = { tokens: MicrosoftTokens } | { error: string };

type MicrosoftReply = { isOk: boolean; body: unknown };

function unreachable(cause: unknown): AppError {
  return new AppError('Microsoft could not be reached. Check the network and try again', {
    code: 'MICROSOFT_UNREACHABLE',
    cause,
  });
}

function signInFailed(reason: string): AppError {
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

async function postForm(url: string, fields: Record<string, string>): Promise<MicrosoftReply> {
  try {
    const response = await fetch(url, {
      method: 'POST',
      body: new URLSearchParams(fields),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    return { isOk: response.ok, body: await readJson(response) };
  } catch (error: unknown) {
    throw unreachable(error);
  }
}

// A reply that is neither tokens nor an OAuth error (a 5xx page, a malformed body) counts as Microsoft being down.
function toTokenAnswer(reply: MicrosoftReply): TokenAnswer {
  const tokens = TokensAnswerSchema.safeParse(reply.body);

  if (reply.isOk && tokens.success) {
    const { access_token, refresh_token, expires_in } = tokens.data;

    return { tokens: { accessToken: access_token, refreshToken: refresh_token, expiresInSeconds: expires_in } };
  }

  const refusal = ErrorAnswerSchema.safeParse(reply.body);
  const isClientError = !reply.isOk && refusal.success;

  if (isClientError) return { error: refusal.data.error };

  throw unreachable(undefined);
}

// Starts a sign-in: Microsoft hands out a short code the user types at the verification address.
export async function requestDeviceCode(clientId: string): Promise<DeviceCode> {
  const reply = await postForm(DEVICE_CODE_URL, { client_id: clientId, scope: MAIL_SCOPES });
  const answer = DeviceCodeAnswerSchema.safeParse(reply.body);

  if (reply.isOk && answer.success) {
    return {
      deviceCode: answer.data.device_code,
      userCode: answer.data.user_code,
      verificationUri: answer.data.verification_uri,
      expiresInSeconds: answer.data.expires_in,
      intervalSeconds: answer.data.interval,
    };
  }

  const refusal = ErrorAnswerSchema.safeParse(reply.body);

  if (!refusal.success) throw unreachable(undefined);

  throw signInFailed(refusal.data.error);
}

// One poll: tokens once the user approved, or why not yet (authorization_pending, slow_down) or not at all.
export async function redeemDeviceCode(clientId: string, deviceCode: string): Promise<TokenAnswer> {
  const reply = await postForm(TOKEN_URL, {
    grant_type: DEVICE_CODE_GRANT,
    client_id: clientId,
    device_code: deviceCode,
  });

  return toTokenAnswer(reply);
}

export async function redeemRefreshToken(clientId: string, refreshToken: string): Promise<TokenAnswer> {
  const reply = await postForm(TOKEN_URL, {
    grant_type: REFRESH_TOKEN_GRANT,
    client_id: clientId,
    refresh_token: refreshToken,
    scope: MAIL_SCOPES,
  });

  return toTokenAnswer(reply);
}
