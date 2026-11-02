import { hashSecureToken } from '../../../lib/secureToken.ts';
import { authRepository, type SessionRow } from '../auth.repository.ts';
import { SESSION_ABSOLUTE_MS, SESSION_IDLE_MS, SESSION_TOUCH_INTERVAL_MS, isSetUp } from '../auth.service.ts';
import type { AuthSession } from '../auth.type.ts';
import type { AuthState, AuthStatusResponse } from './session.schema.ts';

function isSessionExpired(row: SessionRow, now: number): boolean {
  const isPastAbsolute = now - row.signedInAt.getTime() > SESSION_ABSOLUTE_MS;
  const isPastIdle = now - row.lastSeenAt.getTime() > SESSION_IDLE_MS;

  return isPastAbsolute || isPastIdle;
}

export async function getAuthStatus(session: AuthSession | null): Promise<AuthStatusResponse> {
  if (session) return { state: 'signedIn' };

  const state: AuthState = (await isSetUp()) ? 'signedOut' : 'setup';

  return { state };
}

// The session a cookie token stands for, or null. Expired ones are deleted on sight; a used one is kept alive.
export async function getSession(token: string): Promise<AuthSession | null> {
  const tokenHash = hashSecureToken(token);
  const row = await authRepository.findSession(tokenHash);

  if (!row) return null;

  const now = Date.now();

  if (isSessionExpired(row, now)) {
    await authRepository.deleteSession(tokenHash);

    return null;
  }

  const isTouchDue = now - row.lastSeenAt.getTime() > SESSION_TOUCH_INTERVAL_MS;

  if (isTouchDue) await authRepository.touchSession(tokenHash, new Date(now));

  return { tokenHash: row.tokenHash, signedInAt: row.signedInAt };
}

export async function deleteSession(session: AuthSession): Promise<void> {
  await authRepository.deleteSession(session.tokenHash);
}
