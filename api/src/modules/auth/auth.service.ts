// What the auth jobs share: session lifetimes, opening a session, and the passkey ceremony (challenges, options,
// checking what the browser sent).
import {
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
  type WebAuthnCredential,
} from '@simplewebauthn/server';
import { randomBytes } from 'node:crypto';
import { z } from 'zod';
import { env } from '../../config/env.ts';
import type { HttpError } from '../../lib/httpErrors.ts';
import { logger } from '../../lib/logger.ts';
import { createSecureToken, hashSecureToken } from '../../lib/secureToken.ts';
import { authRepository, type AuthChallengePurpose, type NewSession, type PasskeyRow } from './auth.repository.ts';
import type { AuthenticationResponse, RegistrationResponse } from './auth.schema.ts';

export const log = logger.child({ module: 'auth' });

const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

// NIST SP 800-63B-4 caps a session at 30 days; a week unused ends it sooner.
export const SESSION_ABSOLUTE_MS = 30 * DAY_MS;
export const SESSION_IDLE_MS = 7 * DAY_MS;
// lastSeenAt is written at most this often, so reading a page is not a database write.
export const SESSION_TOUCH_INTERVAL_MS = HOUR_MS;
// The browser gives up after CEREMONY_TIMEOUT_MS; the challenge outlives it a little.
export const CEREMONY_TIMEOUT_MS = 2 * MINUTE_MS;
const CHALLENGE_TTL_MS = 5 * MINUTE_MS;

const RP_NAME = 'Meter Reader';
// What the passkey manager lists the passkey under: there is one account, so the app's name says enough.
const PASSKEY_USER_NAME = 'Meter Reader';
const WEBAUTHN_USER_ID_BYTES = 32;

export const APP_ORIGIN = new URL(env.APP_ORIGIN).origin;
// A passkey belongs to a host name for good: it never works on another one, and never on a bare IP address.
export const RP_ID = new URL(env.APP_ORIGIN).hostname;

const ClientDataSchema = z.object({ challenge: z.string().min(1) });

// A new session: the raw token goes in the cookie and nowhere else; the row keeps only its hash.
export type OpenedSession = { token: string; row: NewSession };

export function openSession(signInMethod: NewSession['signInMethod']): OpenedSession {
  const token = createSecureToken();
  const now = new Date();

  return { token, row: { tokenHash: hashSecureToken(token), signInMethod, signedInAt: now, lastSeenAt: now } };
}

// The random WebAuthn user handle the account's passkeys carry. Never the row id.
export function createWebauthnUserId(): string {
  return randomBytes(WEBAUTHN_USER_ID_BYTES).toString('base64url');
}

export async function isSetUp(): Promise<boolean> {
  return authRepository.isSetUp();
}

// The challenge the browser signed, read from its client data. Undefined when the data is not what a browser sends.
function readSignedChallenge(clientDataJSON: string): string | undefined {
  try {
    const decoded: unknown = JSON.parse(Buffer.from(clientDataJSON, 'base64url').toString('utf8'));

    return ClientDataSchema.safeParse(decoded).data?.challenge;
  } catch {
    return undefined;
  }
}

// The challenge must be one this server handed out, for this ceremony, unexpired and unused; it is spent here.
export async function takeSignedChallenge(clientDataJSON: string, purpose: AuthChallengePurpose) {
  const challenge = readSignedChallenge(clientDataJSON);

  if (!challenge) return undefined;

  return authRepository.takeChallenge(challenge, purpose);
}

export async function storeChallenge(
  challenge: string,
  purpose: AuthChallengePurpose,
  webauthnUserId: string | null = null,
): Promise<void> {
  await authRepository.createChallenge({
    challenge,
    purpose,
    webauthnUserId,
    expiresAt: new Date(Date.now() + CHALLENGE_TTL_MS),
  });
}

// A discoverable passkey (nothing to type at sign-in) that needs Face ID / Touch ID / a PIN, and no attestation
// (any passkey manager is welcome).
export function buildRegistrationOptions(webauthnUserId: string) {
  return generateRegistrationOptions({
    rpName: RP_NAME,
    rpID: RP_ID,
    userName: PASSKEY_USER_NAME,
    userDisplayName: PASSKEY_USER_NAME,
    userID: Buffer.from(webauthnUserId, 'base64url'),
    timeout: CEREMONY_TIMEOUT_MS,
    attestationType: 'none',
    authenticatorSelection: { residentKey: 'required', userVerification: 'required' },
  });
}

// Checks a new passkey against the challenge it was made for. Any failure is the same `failure`.
export async function verifyNewPasskey(response: RegistrationResponse, expectedChallenge: string, failure: HttpError) {
  try {
    const verification = await verifyRegistrationResponse({
      response,
      expectedChallenge,
      expectedOrigin: APP_ORIGIN,
      expectedRPID: RP_ID,
      requireUserVerification: true,
    });

    if (!verification.verified) throw failure;

    return verification.registrationInfo;
  } catch (error: unknown) {
    log.warn({ err: error }, 'passkey registration failed');
    throw failure;
  }
}

function toWebAuthnCredential(row: PasskeyRow): WebAuthnCredential {
  return {
    id: row.credentialId,
    publicKey: new Uint8Array(row.publicKey),
    counter: row.counter,
    transports: row.transports,
  };
}

// Checks a sign-in answer against the stored passkey: signature, challenge, site, Face ID / Touch ID, counter.
// Any failure is the same `failure`.
export async function verifySignedAnswer(
  response: AuthenticationResponse,
  expectedChallenge: string,
  passkey: PasskeyRow,
  failure: HttpError,
) {
  try {
    const verification = await verifyAuthenticationResponse({
      response,
      expectedChallenge,
      expectedOrigin: APP_ORIGIN,
      expectedRPID: RP_ID,
      credential: toWebAuthnCredential(passkey),
      requireUserVerification: true,
    });

    if (!verification.verified) throw failure;

    return verification.authenticationInfo;
  } catch (error: unknown) {
    log.warn({ err: error, passkeyId: passkey.id }, 'passkey sign-in failed');
    throw failure;
  }
}
