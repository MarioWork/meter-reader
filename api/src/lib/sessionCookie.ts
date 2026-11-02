import type { CookieSerializeOptions } from '@fastify/cookie';
import { IS_SECURE_APP_ORIGIN } from './appOrigin.ts';

const MS_PER_SECOND = 1000;
const DAY_MS = 24 * 60 * 60 * MS_PER_SECOND;

// NIST SP 800-63B-4 caps a session at 30 days. The server checks it on every request; the cookie lives as long.
export const SESSION_ABSOLUTE_MS = 30 * DAY_MS;
export const SESSION_MAX_AGE_SECONDS = SESSION_ABSOLUTE_MS / MS_PER_SECOND;

const isSecureOrigin = IS_SECURE_APP_ORIGIN;

// `__Host-` makes the browser refuse the cookie unless it is Secure, host-only and Path=/. Plain http (local dev)
// cannot carry a Secure cookie, so there it is a plain name with the same other flags.
export const SESSION_COOKIE_NAME = isSecureOrigin ? '__Host-session' : 'session';

// HttpOnly: page scripts cannot read it. SameSite=Strict: no other site can make the browser send it.
export const SESSION_COOKIE_OPTIONS: CookieSerializeOptions = {
  httpOnly: true,
  secure: isSecureOrigin,
  sameSite: 'strict',
  path: '/',
};
