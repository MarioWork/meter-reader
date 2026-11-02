// What the auth jobs' routes share: their tags, rate limits and the session cookie.
import type { FastifyReply } from 'fastify';
import { SESSION_COOKIE_NAME, SESSION_COOKIE_OPTIONS, SESSION_MAX_AGE_SECONDS } from '../../lib/sessionCookie.ts';

export const TAGS = ['auth'];

const ONE_MINUTE = '1 minute';

// Each passkey attempt is two requests (options, then verify): ten a minute is five attempts per device.
export const CEREMONY_RATE_LIMIT = { max: 10, timeWindow: ONE_MINUTE };
// Password tries per address: enough for a few typos, far too few to guess a 15-character password. No lockout:
// anyone on the network could otherwise lock the user out.
export const PASSWORD_RATE_LIMIT = { max: 5, timeWindow: ONE_MINUTE };

export const PUBLIC_CEREMONY_CONFIG = { isPublic: true, rateLimit: CEREMONY_RATE_LIMIT };
export const PUBLIC_PASSWORD_CONFIG = { isPublic: true, rateLimit: PASSWORD_RATE_LIMIT };

// Signing out also drops what this browser cached from the app. Not "cookies": that would clear every cookie of the
// whole registrable domain (other home apps), not just this host's.
const CLEAR_SITE_DATA = '"cache"';

export function setSessionCookie(reply: FastifyReply, token: string): void {
  reply.setCookie(SESSION_COOKIE_NAME, token, { ...SESSION_COOKIE_OPTIONS, maxAge: SESSION_MAX_AGE_SECONDS });
}

export function clearSessionCookie(reply: FastifyReply): void {
  reply.clearCookie(SESSION_COOKIE_NAME, SESSION_COOKIE_OPTIONS);
  reply.header('clear-site-data', CLEAR_SITE_DATA);
}
