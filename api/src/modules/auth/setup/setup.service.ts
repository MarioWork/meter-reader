import { BadRequestError, ConflictError, UnauthorizedError } from '../../../lib/httpErrors.ts';
import { hashPassword } from '../../../lib/passwordHash.ts';
import { createSecureToken, hashSecureToken } from '../../../lib/secureToken.ts';
import { authRepository, type NewPasskey } from '../auth.repository.ts';
import type { RegistrationOptionsResponse, RegistrationResponse } from '../auth.schema.ts';
import {
  APP_ORIGIN,
  buildRegistrationOptions,
  createWebauthnUserId,
  isSetUp,
  log,
  openSession,
  storeChallenge,
  takeSignedChallenge,
  verifyNewPasskey,
} from '../auth.service.ts';
import { isCommonPassword } from './setup.commonPasswords.ts';
import type { Setup, SetupOptions } from './setup.schema.ts';

const SETUP_PATH = '/setup';
const SETUP_CODE_PARAM = 'code';
const SETUP_CODE_MESSAGE = 'This setup link is wrong or was already used';
const ALREADY_SET_UP_MESSAGE = 'The app is already set up. Sign in instead.';
const COMMON_PASSWORD_MESSAGE = 'That password is too common. Pick one nobody would guess.';
const PASSKEY_FAILED_MESSAGE = "The passkey couldn't be saved. Try again.";

// The new passkey and the account handle it was made for.
type VerifiedSetupPasskey = { webauthnUserId: string; passkey: NewPasskey };

async function assertSetupCode(code: string): Promise<void> {
  const isValid = await authRepository.hasSetupCode(hashSecureToken(code));

  if (!isValid) throw new UnauthorizedError(SETUP_CODE_MESSAGE, 'INVALID_SETUP_CODE');
}

async function assertNotSetUp(): Promise<void> {
  if (await isSetUp()) throw new ConflictError(ALREADY_SET_UP_MESSAGE, 'ALREADY_SET_UP');
}

// When nobody has set the app up, a fresh one-time code (the old one stops working). Undefined otherwise.
// Called on every start.
export async function addSetupCode(): Promise<string | undefined> {
  if (await isSetUp()) return undefined;

  const code = createSecureToken();
  await authRepository.replaceSetupCode(hashSecureToken(code));

  return code;
}

// The lockout way back (yarn auth:reset): the password, every passkey and every session go, and a new setup code
// replaces any old one. Readings stay. Returns the new code.
export async function resetLogin(): Promise<string> {
  const code = createSecureToken();
  await authRepository.resetSignIns(hashSecureToken(code));

  log.warn('login reset');

  return code;
}

export function getSetupLink(code: string): string {
  const link = new URL(SETUP_PATH, APP_ORIGIN);
  link.searchParams.set(SETUP_CODE_PARAM, code);

  return link.toString();
}

export async function getSetupOptions({ code }: SetupOptions): Promise<RegistrationOptionsResponse> {
  await assertNotSetUp();
  await assertSetupCode(code);

  const webauthnUserId = createWebauthnUserId();
  const options = await buildRegistrationOptions(webauthnUserId);
  await storeChallenge(options.challenge, 'SETUP', webauthnUserId);

  return { ...options };
}

async function verifySetupPasskey(response: RegistrationResponse): Promise<VerifiedSetupPasskey> {
  const failure = new UnauthorizedError(PASSKEY_FAILED_MESSAGE, 'PASSKEY_FAILED');
  const challenge = await takeSignedChallenge(response.response.clientDataJSON, 'SETUP');

  if (!challenge?.webauthnUserId) throw failure;

  const registration = await verifyNewPasskey(response, challenge.challenge, failure);
  const passkey: NewPasskey = {
    credentialId: registration.credential.id,
    publicKey: new Uint8Array(registration.credential.publicKey),
    counter: registration.credential.counter,
    transports: registration.credential.transports ?? [],
    isSynced: registration.credentialBackedUp,
  };

  return { webauthnUserId: challenge.webauthnUserId, passkey };
}

// Setup, once: a password, a passkey or both, then the user is signed in and the setup link is dead. Returns the new
// session's token for the cookie.
export async function completeSetup({ code, password, passkey }: Setup): Promise<string> {
  await assertNotSetUp();
  await assertSetupCode(code);

  const hasPassword = password !== undefined;

  if (hasPassword && isCommonPassword(password)) {
    throw new BadRequestError(COMMON_PASSWORD_MESSAGE, 'COMMON_PASSWORD');
  }

  const verified = passkey ? await verifySetupPasskey(passkey) : undefined;
  const session = openSession(verified ? 'PASSKEY' : 'PASSWORD');

  const isCompleted = await authRepository.completeSetup({
    webauthnUserId: verified?.webauthnUserId ?? createWebauthnUserId(),
    passwordHash: hasPassword ? await hashPassword(password) : null,
    passkey: verified?.passkey ?? null,
    session: session.row,
  });

  if (!isCompleted) throw new ConflictError(ALREADY_SET_UP_MESSAGE, 'ALREADY_SET_UP');

  log.info({ hasPassword, hasPasskey: verified !== undefined }, 'login set up');

  return session.token;
}
