import { generateAuthenticationOptions } from '@simplewebauthn/server';
import { ConflictError, UnauthorizedError } from '../../../lib/httpErrors.ts';
import { hashPassword, verifyPassword } from '../../../lib/passwordHash.ts';
import { createSecureToken } from '../../../lib/secureToken.ts';
import { authRepository } from '../auth.repository.ts';
import type { AuthenticationOptionsResponse } from '../auth.schema.ts';
import {
  CEREMONY_TIMEOUT_MS,
  RP_ID,
  SESSION_ABSOLUTE_MS,
  SESSION_IDLE_MS,
  isSetUp,
  log,
  openSession,
  storeChallenge,
  takeSignedChallenge,
  verifySignedAnswer,
  type OpenedSession,
} from '../auth.service.ts';
import type { AuthSession } from '../auth.type.ts';
import type { PasskeySignIn, PasswordSignIn } from './signIn.schema.ts';

// One message per way in, the same for every failure, so a failure says nothing about why.
const PASSWORD_FAILED_MESSAGE = "That password doesn't match. Try again.";
const PASSKEY_FAILED_MESSAGE = "That passkey didn't work. Try again.";
const NOT_SET_UP_MESSAGE = 'Nobody has set the app up yet';

// Checked against when there is no password, so that answer takes as long as a wrong password. Made once, at
// start-up, so even the first try is not slower.
const timingDecoyHash = hashPassword(createSecureToken());

// Sweeps sessions past either timeout, then hands back the new one. Signing in again replaces this browser's old
// session, if any, so a stolen old cookie stops working once the user signs in again.
async function finishSignIn(opened: OpenedSession, previous: AuthSession | null): Promise<string> {
  const now = Date.now();

  if (previous) await authRepository.deleteSession(previous.tokenHash);

  await authRepository.deleteExpiredSessions(new Date(now - SESSION_ABSOLUTE_MS), new Date(now - SESSION_IDLE_MS));

  return opened.token;
}

// Password sign-in: one answer for every failure, and no lockout; the route's rate limit caps the tries.
export async function addPasswordSession({ password }: PasswordSignIn, previous: AuthSession | null): Promise<string> {
  const storedHash = await authRepository.findPasswordHash();
  const isMatch = await verifyPassword(password, storedHash ?? (await timingDecoyHash));

  if (!isMatch || !storedHash) throw new UnauthorizedError(PASSWORD_FAILED_MESSAGE, 'SIGN_IN_FAILED');

  const opened = openSession('PASSWORD');
  await authRepository.createSession(opened.row);

  log.info('signed in with the password');

  return finishSignIn(opened, previous);
}

// No allowCredentials: the browser offers whichever passkey it holds for this site, so there is nothing to type.
export async function getSignInOptions(): Promise<AuthenticationOptionsResponse> {
  if (!(await isSetUp())) throw new ConflictError(NOT_SET_UP_MESSAGE, 'NOT_SET_UP');

  const options = await generateAuthenticationOptions({
    rpID: RP_ID,
    timeout: CEREMONY_TIMEOUT_MS,
    userVerification: 'required',
  });
  await storeChallenge(options.challenge, 'SIGN_IN');

  return { ...options };
}

export async function addPasskeySession({ response }: PasskeySignIn, previous: AuthSession | null): Promise<string> {
  const failure = new UnauthorizedError(PASSKEY_FAILED_MESSAGE, 'SIGN_IN_FAILED');
  const challenge = await takeSignedChallenge(response.response.clientDataJSON, 'SIGN_IN');
  const passkey = await authRepository.findPasskey(response.id);

  if (!challenge || !passkey) throw failure;

  // The browser's userHandle is not signed and may be left out, but when it is sent it must be the account's.
  const isOtherHandle =
    response.response.userHandle !== undefined && response.response.userHandle !== passkey.account.webauthnUserId;

  if (isOtherHandle) throw failure;

  const authentication = await verifySignedAnswer(response, challenge.challenge, passkey, failure);
  const opened = openSession('PASSKEY');

  await authRepository.completePasskeySignIn({
    passkeyId: passkey.id,
    passkeyUse: {
      counter: authentication.newCounter,
      isSynced: authentication.credentialBackedUp,
      lastUsedAt: opened.row.signedInAt,
    },
    session: opened.row,
  });

  log.info({ passkeyId: passkey.id }, 'signed in with a passkey');

  return finishSignIn(opened, previous);
}
