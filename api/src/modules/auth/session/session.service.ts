import { hashSecureToken } from '../../../lib/secureToken.ts';
import { SESSION_ABSOLUTE_MS } from '../../../lib/sessionCookie.ts';
import { authRepository, type SessionRow } from '../auth.repository.ts';
import { SESSION_IDLE_MS, SESSION_TOUCH_INTERVAL_MS } from '../auth.service.ts';
import type { AuthSession } from '../auth.type.ts';
import type { AuthState, AuthStatusResponse } from './session.schema.ts';

function isSessionExpired(row: SessionRow, now: number): boolean {
  const isPastAbsolute = now - row.signedInAt.getTime() > SESSION_ABSOLUTE_MS;
  const isPastIdle = now - row.lastSeenAt.getTime() > SESSION_IDLE_MS;

  return isPastAbsolute || isPastIdle;
}

export async function getAuthStatus(session: AuthSession | null): Promise<AuthStatusResponse> {
  if (session) return { state: 'signedIn' };

  const state: AuthState = (await authRepository.isSetUp()) ? 'signedOut' : 'setup';

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

// Signing out: ends this browser's session when it has one. Without one there is nothing to end.
export async function deleteSession(session: AuthSession | null): Promise<void> {
  if (!session) return;

  await authRepository.deleteSession(session.tokenHash);
}
